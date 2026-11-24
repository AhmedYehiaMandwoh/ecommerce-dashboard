import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { parse } from "csv-parse/sync";
import { Db } from "../../db";
import { hashPassword, verifyPassword, digest, requireRole } from "../../security";
import { CheckoutDto, OfferDto, OfferUpdateDto, ProductDto } from "../../dto";
import { allocateShipping } from "../../shipping";
import { applyPercent, normalizeCode } from "../../discount";
import { Prisma } from "../../generated/prisma/client";
import { transitions, normalizeItems } from "./orders.rules";

@Injectable()
export class OrdersService {
  constructor(private db: Db) {}
  async quote(user:any,d:any){
    requireRole(user,'CUSTOMER');
    const items=normalizeItems(d.items);
    const address=await this.db.address.findFirst({where:{id:d.addressId,userId:user.id}});
    if(!address)throw new BadRequestException('Choose your address');
    const offers=await this.db.offer.findMany({where:{id:{in:items.map(i=>i.offerId)},active:true,product:{approved:true},shop:{approved:true}}});
    if(offers.length!==items.length)throw new BadRequestException('Some offers are unavailable');
    const area=await this.db.deliveryArea.findFirst({where:{id:d.deliveryAreaId,active:true}});
    if(!area||area.city.trim().toLocaleLowerCase()!==address.city.trim().toLocaleLowerCase())throw new BadRequestException('Delivery area does not serve this address city');
    let subtotal=0;
    for(const item of items){const offer=offers.find(o=>o.id===item.offerId)!;if(offer.stock<item.quantity)throw new ConflictException('Insufficient stock');subtotal+=offer.price*item.quantity;}
    const groups=[...new Set(offers.map(o=>o.shopId))].map(shopId=>({shopId,subtotal:items.reduce((sum,item)=>{const o=offers.find(o=>o.id===item.offerId)!;return sum+(o.shopId===shopId?o.price*item.quantity:0)},0)}));
    let discount=0,discountCode:string|null=null,shopGroups=groups;
    const code=normalizeCode(d.discountCode);
    if(code){const dc=await this.db.discountCode.findUnique({where:{code}});if(!dc||!dc.active||(dc.expiresAt&&dc.expiresAt<new Date())||(dc.maxUses!==null&&dc.used>=dc.maxUses))throw new BadRequestException('Discount code invalid or expired');const applied=applyPercent(groups,dc.percent);discount=applied.reduce((n,g)=>n+g.discount,0);shopGroups=applied.map(g=>({shopId:g.shopId,subtotal:g.subtotal}));discountCode=dc.code;}
    return {groups:allocateShipping(area.fee,shopGroups),subtotalBeforeDiscount:subtotal,discount,discountCode,subtotal:subtotal-discount,delivery:area.fee,total:subtotal-discount+area.fee,currency:'EGP',payment:'CASH_ON_DELIVERY',deliveryArea:{id:area.id,city:area.city,area:area.area},testOnly:true,checkoutSupported:true,shippingAllocationRequired:false};
  }
  async groupedCheckout(user:any,d:any){
    requireRole(user,'CUSTOMER');
    if(process.env.TEST_CHECKOUT!=='true')throw new ForbiddenException('Test checkout disabled');
    const items=normalizeItems(d.items);
    const fingerprint=digest(JSON.stringify({items,addressId:d.addressId,deliveryAreaId:d.deliveryAreaId,note:d.note||'',expectedTotal:d.expectedTotal,discountCode:normalizeCode(d.discountCode)}));
    const include={orders:{include:{shop:true,items:true,events:true}}};
    const replay=async()=>{const c=await this.db.checkout.findUnique({where:{customerId_requestKey:{customerId:user.id,requestKey:d.requestKey}},include});if(c&&c.fingerprint!==fingerprint)throw new ConflictException('Request key belongs to a different basket');return c;};
    const old=await replay();if(old)return old;
    try{return await this.db.$transaction(async tx=>{
      const existing=await tx.checkout.findUnique({where:{customerId_requestKey:{customerId:user.id,requestKey:d.requestKey}},include});
      if(existing){if(existing.fingerprint!==fingerprint)throw new ConflictException('Request key belongs to a different basket');return existing;}
      const address=await tx.address.findFirst({where:{id:d.addressId,userId:user.id}});
      if(!address)throw new BadRequestException('Choose your address');
      const area=await tx.deliveryArea.findFirst({where:{id:d.deliveryAreaId,active:true}});
      if(!area||area.city.trim().toLocaleLowerCase()!==address.city.trim().toLocaleLowerCase())throw new BadRequestException('Delivery area unavailable for this address');
      const offers=await tx.offer.findMany({where:{id:{in:items.map(i=>i.offerId)},active:true,product:{approved:true},shop:{approved:true}},include:{product:true}});
      if(offers.length!==items.length)throw new BadRequestException('Some offers are unavailable');
      const groupValues=[...new Set(offers.map(o=>o.shopId))].map(shopId=>({shopId,subtotal:items.reduce((sum,item)=>{const o=offers.find(o=>o.id===item.offerId)!;return sum+(o.shopId===shopId?o.price*item.quantity:0)},0)}));
      let discount=0,discountCode:string|null=null,discountByShop:Record<string,number>={},valued=groupValues;
      const code=normalizeCode(d.discountCode);
      if(code){const dc=await tx.discountCode.findUnique({where:{code}});if(!dc||!dc.active||(dc.expiresAt&&dc.expiresAt<new Date()))throw new BadRequestException('Discount code invalid or expired');
        const used=await tx.discountCode.updateMany({where:dc.maxUses===null?{id:dc.id,active:true}:{id:dc.id,active:true,used:{lt:dc.maxUses}},data:{used:{increment:1}}});if(used.count!==1)throw new BadRequestException('Discount code invalid or expired');
        const applied=applyPercent(groupValues,dc.percent);discount=applied.reduce((n,g)=>n+g.discount,0);for(const g of applied)discountByShop[g.shopId]=g.discount;valued=applied.map(g=>({shopId:g.shopId,subtotal:g.subtotal}));discountCode=dc.code;}
      const groups=allocateShipping(area.fee,valued);const subtotal=groups.reduce((sum,g)=>sum+g.subtotal,0);
      if(subtotal+area.fee!==d.expectedTotal)throw new ConflictException('Basket total changed, review a fresh quote');
      for(const item of items){const o=offers.find(o=>o.id===item.offerId)!;const changed=await tx.offer.updateMany({where:{id:o.id,active:true,price:o.price,stock:{gte:item.quantity}},data:{stock:{decrement:item.quantity}}});if(changed.count!==1)throw new ConflictException('Price or stock changed, review basket');}
      const snapshot={label:address.label,city:address.city,details:address.details,phone:address.phone,deliveryArea:{id:area.id,city:area.city,area:area.area}};
      const c=await tx.checkout.create({data:{customerId:user.id,requestKey:d.requestKey,fingerprint,subtotal,discount,discountCode,originalDelivery:area.fee,delivery:area.fee,total:subtotal+area.fee,area:{id:area.id,city:area.city,area:area.area,fee:area.fee},address:snapshot}});
      for(const group of groups){const lines=items.filter(i=>offers.find(o=>o.id===i.offerId)!.shopId===group.shopId).map(i=>{const o=offers.find(o=>o.id===i.offerId)!;return {offerId:o.id,title:o.product.title,partNumber:o.product.partNumber,quantity:i.quantity,unitPrice:o.price};});await tx.order.create({data:{checkoutId:c.id,customerId:user.id,shopId:group.shopId,subtotal:group.subtotal,discount:discountByShop[group.shopId]||0,delivery:group.delivery,total:group.total,address:snapshot,note:d.note||'',requestKey:c.id+':'+group.shopId,payment:'TEST_COD',items:{create:lines},events:{create:{status:'PLACED'}}}});}
      await tx.financialAudit.create({data:{checkoutId:c.id,actorId:user.id,action:'CHECKOUT_CREATED',before:{},after:{groups,discount,discountCode,delivery:area.fee,total:c.total},reason:'Reviewed basket committed'}});
      return tx.checkout.findUniqueOrThrow({where:{id:c.id},include});
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:15000});}catch(e:any){if(['P2002','P2034'].includes(e.code)){const existing=await replay();if(existing)return existing;throw new ConflictException('Concurrent change, retry same request key');}throw e;}
  }
  async checkout(user: any, d: CheckoutDto) {
    requireRole(user, "CUSTOMER");
    if (process.env.TEST_CHECKOUT !== "true")
      throw new ForbiddenException(
        "Test checkout disabled; real ordering not configured",
      );
    const items = normalizeItems(d.items);
    try {
      return await this.db.$transaction(
        async (tx) => {
          const existing = await tx.order.findUnique({
            where: {
              customerId_requestKey: {
                customerId: user.id,
                requestKey: d.requestKey,
              },
            },
            include: { items: true, events: true, shop: true },
          });
          if (existing) return existing;
          const address = await tx.address.findFirst({
            where: { id: d.addressId, userId: user.id },
          });
          if (!address) throw new BadRequestException("Choose your address");
          const offers = await tx.offer.findMany({
            where: {
              id: { in: items.map((i) => i.offerId) },
              active: true,
              product: { approved: true },
              shop: { approved: true },
            },
            include: { product: true },
          });
          if (offers.length !== items.length)
            throw new BadRequestException("Some offers are unavailable");
          if (new Set(offers.map((o) => o.shopId)).size !== 1)
            throw new BadRequestException(
              "One shop per order. Place separate orders for other shops.",
            );
          let subtotal = 0;
          const lines = [];
          for (const item of items) {
            const o = offers.find((o) => o.id === item.offerId)!;
            const updated = await tx.offer.updateMany({
              where: {
                id: o.id,
                stock: { gte: item.quantity },
                active: true,
                price: o.price,
              },
              data: { stock: { decrement: item.quantity } },
            });
            if (updated.count !== 1)
              throw new ConflictException(
                "Stock or price changed. Refresh your cart.",
              );
            subtotal += o.price * item.quantity;
            lines.push({
              offerId: o.id,
              title: o.product.title,
              partNumber: o.product.partNumber,
              quantity: item.quantity,
              unitPrice: o.price,
            });
          }
          // Legacy fixed fee is restricted to the explicitly test-only checkout.
          let delivery=5000;
          let selectedArea: {id:string;city:string;area:string}|null=null;
          if(d.deliveryAreaId){
            const area=await tx.deliveryArea.findFirst({where:{id:d.deliveryAreaId,active:true}});
            if(!area||area.city.trim().toLocaleLowerCase()!==address.city.trim().toLocaleLowerCase())throw new BadRequestException('Delivery area does not serve this address city');
            delivery=area.fee;selectedArea={id:area.id,city:area.city,area:area.area};
          }
          if (d.expectedTotal !== subtotal + delivery)
            throw new ConflictException(
              "Price changed. Refresh your cart and review the new total.",
            );
          return tx.order.create({
            data: {
              customerId: user.id,
              shopId: offers[0].shopId,
              subtotal,
              delivery,
              total: subtotal + delivery,
              address: {
                label: address.label,
                city: address.city,
                details: address.details,
                phone: address.phone,
                ...(selectedArea?{deliveryArea:selectedArea}:{}),
              },
              note: d.note || "",
              requestKey: d.requestKey,
              payment: "TEST_COD",
              items: { create: lines },
              events: { create: { status: "PLACED" } },
            },
            include: { items: true, events: true, shop: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e: any) {
      if (["P2034", "P2002"].includes(e.code)) {
        const existing = await this.db.order.findUnique({
          where: {
            customerId_requestKey: {
              customerId: user.id,
              requestKey: d.requestKey,
            },
          },
          include: { items: true, events: true, shop: true },
        });
        if (existing) return existing;
        throw new ConflictException(
          "Concurrent update. Retry with the same request key.",
        );
      }
      throw e;
    }
  }
  async orders(user: any) {
    return this.db.order.findMany({
      where:
        user.role === "CUSTOMER"
          ? { customerId: user.id }
          : user.role === "MERCHANT"
            ? { shop: { ownerId: user.id } }
            : {},
      include: {
        cancellationReviews:{orderBy:{createdAt:'desc'}},
        returns:{orderBy:{createdAt:'desc'}},
        shippingEntries:{orderBy:{createdAt:'asc'}},
        items: { include: { offer: { select: { product: { select: { image: true } } } } } },
        events: { orderBy: { createdAt: "asc" } },
        shop: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  async settleShipping(user:any,id:string,d:any){
    requireRole(user,'ADMIN');
    return this.db.$transaction(async tx=>{
      const order=await tx.order.findUnique({where:{id},include:{shippingEntries:true}});
      if(!order||order.status!=='DELIVERED'||order.settlementFrozen)throw new ConflictException('Only delivered unfrozen shipping balances can settle');
      const reference='settlement:'+d.reference;
      const old=await tx.shippingEntry.findUnique({where:{reference}});
      if(old){if(old.orderId!==id||old.amount!==-d.amount||old.kind!==d.method||old.note!==d.note)throw new ConflictException('Reference already used for a different settlement');return old;}
      const balance=order.shippingEntries.reduce((n,e)=>n+e.amount,0);
      if(d.amount>balance)throw new BadRequestException('Settlement exceeds amount due to platform');
      const entry=await tx.shippingEntry.create({data:{orderId:id,amount:-d.amount,kind:d.method,reference,actorId:user.id,note:d.note}});
      if(order.checkoutId)await tx.financialAudit.create({data:{checkoutId:order.checkoutId,actorId:user.id,action:'SHIPPING_SETTLED',before:{orderId:id,balance},after:{orderId:id,balance:balance-d.amount,entryId:entry.id},reason:d.note}});
      return entry;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }
  async requestReturn(user:any,id:string,d:any){
    requireRole(user,'CUSTOMER');
    return this.db.$transaction(async tx=>{const order=await tx.order.findUnique({where:{id},include:{items:true,returns:true}});if(!order||order.customerId!==user.id)throw new ForbiddenException();if(order.status!=='DELIVERED'||order.settlementFrozen)throw new ConflictException('Returns require a delivered, unfrozen order');if(order.returns.some(r=>r.state==='PENDING'))throw new ConflictException('A return is already pending');
      const seen=new Set<string>();for(const line of d.items){if(seen.has(line.orderItemId))throw new BadRequestException('Duplicate return item');seen.add(line.orderItemId);const item=order.items.find(i=>i.id===line.orderItemId);if(!item)throw new BadRequestException('Item does not belong to order');const used=order.returns.filter(r=>r.state==='APPROVED').flatMap(r=>r.items as any[]).filter(r=>r.orderItemId===item.id).reduce((n,r)=>n+r.quantity,0);if(line.quantity>item.quantity-used)throw new BadRequestException('Return exceeds unreturned quantity');}
      const result=await tx.returnRequest.create({data:{orderId:id,items:d.items,reason:d.reason,requestedBy:user.id}});await tx.order.update({where:{id},data:{settlementFrozen:true}});if(order.checkoutId)await tx.financialAudit.create({data:{checkoutId:order.checkoutId,actorId:user.id,action:'RETURN_REQUESTED',before:{orderId:id},after:{returnId:result.id,items:d.items},reason:d.reason}});return result;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }
  async decideReturn(user:any,id:string,d:any){requireRole(user,'ADMIN');return this.db.$transaction(async tx=>{const r=await tx.returnRequest.findUnique({where:{id},include:{order:{include:{items:true}}}});if(!r||r.state!=='PENDING'||!r.order.settlementFrozen)throw new ConflictException('Return no longer pending');const lines=r.items as any[];const max=lines.reduce((n,l)=>n+r.order.items.find(i=>i.id===l.orderItemId)!.unitPrice*l.quantity,0);
      if(d.approve&&(!d.goodsReceived||d.refundAmount>max))throw new BadRequestException('Receipt of goods and refund within returned goods value required');if(!d.approve&&(d.restock||d.refundAmount!==0||d.goodsReceived))throw new BadRequestException('Rejected return cannot change stock or refund');if(d.restock&&!d.goodsReceived)throw new BadRequestException('Cannot restock goods not received');
      const changed=await tx.returnRequest.updateMany({where:{id,state:'PENDING'},data:{state:d.approve?'APPROVED':'REJECTED',decisionReason:d.reason,decidedBy:user.id,decidedAt:new Date(),goodsReceived:d.goodsReceived,restocked:d.restock,refundAmount:d.refundAmount}});if(changed.count!==1)throw new ConflictException('Return changed');if(d.approve&&d.restock)for(const l of lines){const item=r.order.items.find(i=>i.id===l.orderItemId)!;await tx.offer.update({where:{id:item.offerId},data:{stock:{increment:l.quantity}}});}await tx.order.update({where:{id:r.orderId},data:{settlementFrozen:false}});if(r.order.checkoutId)await tx.financialAudit.create({data:{checkoutId:r.order.checkoutId,actorId:user.id,action:d.approve?'RETURN_APPROVED':'RETURN_REJECTED',before:{returnId:id,state:r.state},after:{returnId:id,refundAmount:d.refundAmount,restocked:d.restock},reason:d.reason}});return {ok:true};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});}
  async refundEvidence(user:any,id:string,d:any){requireRole(user,'ADMIN');return this.db.$transaction(async tx=>{const r=await tx.returnRequest.findUnique({where:{id},include:{order:true}});if(!r||r.state!=='APPROVED'||r.refundAmount<=0||r.refundedAt)throw new ConflictException('Refund evidence cannot be recorded');const changed=await tx.returnRequest.updateMany({where:{id,refundedAt:null,state:'APPROVED'},data:{refundReference:d.reference,refundNote:d.note,refundedBy:user.id,refundedAt:new Date()}});if(changed.count!==1)throw new ConflictException('Refund already recorded');if(r.order.checkoutId)await tx.financialAudit.create({data:{checkoutId:r.order.checkoutId,actorId:user.id,action:'CASH_REFUND_EVIDENCE',before:{returnId:id,refundAmount:r.refundAmount},after:{returnId:id,reference:d.reference},reason:d.note}});return {ok:true,transferPerformed:false};},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});}
  async requestCancellation(user:any,id:string,reason:string){
    requireRole(user,'CUSTOMER');
    return this.db.$transaction(async tx=>{
      const order=await tx.order.findUnique({where:{id}});
      if(!order||order.customerId!==user.id)throw new ForbiddenException();
      if(order.status==='DELIVERED'||order.status==='CANCELLED')throw new ConflictException('Completed orders require a separate return/support process');
      const siblingStarted=order.checkoutId?await tx.order.count({where:{checkoutId:order.checkoutId,deliveryStartedAt:{not:null}}}):0;
      if(!order.deliveryStartedAt&&!siblingStarted)throw new ConflictException('Use direct cancellation before any delivery starts');
      const old=await tx.cancellationReview.findFirst({where:{orderId:id,state:'PENDING'}});if(old)return old;
      const claimed=await tx.order.updateMany({where:{id,status:order.status,settlementFrozen:false},data:{settlementFrozen:true}});
      if(claimed.count!==1)throw new ConflictException('Order is already under review');
      const review=await tx.cancellationReview.create({data:{orderId:id,reason,requestedBy:user.id}});
      if(order.checkoutId)await tx.financialAudit.create({data:{checkoutId:order.checkoutId,actorId:user.id,action:'CANCELLATION_REQUESTED',before:{orderId:id,settlementFrozen:false},after:{orderId:id,settlementFrozen:true,reviewId:review.id},reason}});
      return review;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }
  async decideCancellation(user:any,reviewId:string,d:any){
    requireRole(user,'ADMIN');
    return this.db.$transaction(async tx=>{
      const review=await tx.cancellationReview.findUnique({where:{id:reviewId},include:{order:{include:{items:true}}}});
      if(!review||review.state!=='PENDING')throw new ConflictException('Review no longer pending');
      const order=review.order;
      if(['DELIVERED','CANCELLED'].includes(order.status)||!order.settlementFrozen)throw new ConflictException('Order state changed');
      if(d.approve&&(d.shippingRetained===undefined||d.shippingRetained>order.delivery))throw new BadRequestException('Explicit retained shipping share required, within original share');
      const changed=await tx.cancellationReview.updateMany({where:{id:reviewId,state:'PENDING'},data:{state:d.approve?'APPROVED':'REJECTED',decisionReason:d.reason,decidedBy:user.id,decidedAt:new Date(),shippingRetained:d.approve?d.shippingRetained:null}});
      if(changed.count!==1)throw new ConflictException('Decision changed concurrently');
      if(!d.approve){await tx.order.update({where:{id:order.id},data:{settlementFrozen:false}});if(order.checkoutId)await tx.financialAudit.create({data:{checkoutId:order.checkoutId,actorId:user.id,action:'CANCELLATION_REJECTED',before:{orderId:order.id,settlementFrozen:true},after:{orderId:order.id,settlementFrozen:false,total:order.total,reviewId},reason:d.reason}});return {ok:true,state:'REJECTED'};}
      // After delivery starts, stock stays unavailable until a separate verified return.
      await tx.order.update({where:{id:order.id},data:{status:'CANCELLED',settlementFrozen:false,delivery:d.shippingRetained,total:d.shippingRetained}});
      await tx.orderEvent.create({data:{orderId:order.id,status:'CANCELLED'}});
      if(order.checkoutId){
        const children=await tx.order.findMany({where:{checkoutId:order.checkoutId}});
        const allCanceled=children.every(o=>o.status==='CANCELLED');
        if(allCanceled){for(const child of children)await tx.order.update({where:{id:child.id},data:{delivery:0,total:0}});await tx.checkout.update({where:{id:order.checkoutId},data:{subtotal:0,delivery:0,total:0,version:{increment:1}}});}
        else await tx.checkout.update({where:{id:order.checkoutId},data:{subtotal:{decrement:order.subtotal},delivery:{decrement:order.delivery-d.shippingRetained},total:{decrement:order.total-d.shippingRetained},version:{increment:1}}});
        await tx.financialAudit.create({data:{checkoutId:order.checkoutId,actorId:user.id,action:'CANCELLATION_APPROVED',before:{orderId:order.id,status:order.status,total:order.total,delivery:order.delivery},after:{orderId:order.id,status:'CANCELLED',total:allCanceled?0:d.shippingRetained,delivery:allCanceled?0:d.shippingRetained,reviewId,allCanceled},reason:d.reason}});
      }
      return {ok:true,state:'APPROVED'};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }
  async transition(user: any, id: string, status: any, trackingNumber?: string) {
    return this.db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { shop: true, items: true },
      });
      if (!order) throw new NotFoundException();
      if (user.role === "CUSTOMER") {
        if (
          order.customerId !== user.id ||
          status !== "CANCELLED" ||
          !["PLACED","ACCEPTED","PREPARING"].includes(order.status)
        )
          throw new ForbiddenException();
      } else if (user.role === "MERCHANT" && order.shop.ownerId !== user.id)
        throw new ForbiddenException();
      if(order.settlementFrozen)throw new ConflictException('Settlement/order frozen during cancellation review');
      if (!transitions[order.status]?.includes(status))
        throw new ConflictException("Invalid status transition");
      const result = await tx.order.updateMany({
        where: { id, status: order.status },
        data: { status,...(trackingNumber&&user.role!=='CUSTOMER'?{trackingNumber}:{}),...(status==='SHIPPED'?{deliveryStartedAt:new Date(),deliveryStartedBy:user.id}:{}) },
      });
      if (result.count !== 1)
        throw new ConflictException("Order changed, refresh");
      if (status === "CANCELLED") {
        for (const i of order.items)
          await tx.offer.update({
            where: { id: i.offerId },
            data: { stock: { increment: i.quantity } },
          });
      }
      if(status==='CANCELLED'&&order.checkoutId){
        const checkout=await tx.checkout.findUniqueOrThrow({where:{id:order.checkoutId},include:{orders:true}});
        const started=checkout.orders.some(o=>o.deliveryStartedAt!==null);
        if(started){
          throw new ConflictException('Another shop already started delivery; administrative cancellation handling required');
        }else{
          const active=checkout.orders.filter(o=>o.status!=='CANCELLED');
          const allocation=active.length?allocateShipping(checkout.originalDelivery,active.map(o=>({shopId:o.shopId,subtotal:o.subtotal}))):[];
          for(const child of checkout.orders){const share=allocation.find(g=>g.shopId===child.shopId);await tx.order.update({where:{id:child.id},data:{delivery:share?.delivery||0,total:child.status==='CANCELLED'?0:child.subtotal+(share?.delivery||0)}});}
          const subtotal=active.reduce((sum,o)=>sum+o.subtotal,0);const delivery=active.length?checkout.originalDelivery:0;
          await tx.checkout.update({where:{id:checkout.id},data:{subtotal,delivery,total:subtotal+delivery,version:{increment:1}}});
        }
        const after=await tx.checkout.findUniqueOrThrow({where:{id:checkout.id},include:{orders:{select:{id:true,shopId:true,status:true,delivery:true,total:true}}}});
        await tx.financialAudit.create({data:{checkoutId:checkout.id,actorId:user.id,action:'PRE_DELIVERY_CANCELLATION',before:{total:checkout.total,delivery:checkout.delivery,orders:checkout.orders.map(o=>({id:o.id,delivery:o.delivery,status:o.status}))},after:{total:after.total,delivery:after.delivery,orders:after.orders},reason:'Shop order canceled before its delivery started'}});
      }
      if(status==='DELIVERED'&&order.delivery>0)await tx.shippingEntry.create({data:{orderId:id,amount:order.delivery,kind:'COLLECTED_FOR_PLATFORM',reference:'delivery:'+id,actorId:user.id,note:'Shipping share collected on platform behalf at delivery'}});
      await tx.orderEvent.create({ data: { orderId: id, status } });
      return tx.order.findUnique({
        where: { id },
        include: { items: true, events: true },
      });
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:15000});
  }
}
