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
import { Db } from "./db";
import { hashPassword, verifyPassword, digest, requireRole } from "./security";
import { CheckoutDto, OfferDto, OfferUpdateDto, ProductDto } from "./dto";
import { allocateShipping } from "./shipping";
import { Prisma } from "./generated/prisma/client";
const publicUser = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});
export const transitions: Record<string, string[]> = {
  PLACED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
export function normalizeItems(items: { offerId: string; quantity: number }[]) {
  const map = new Map<string, number>();
  for (const i of items) {
    const n = (map.get(i.offerId) || 0) + i.quantity;
    if (n > 100) throw new BadRequestException("Maximum 100 units per offer");
    map.set(i.offerId, n);
  }
  return [...map]
    .map(([offerId, quantity]) => ({ offerId, quantity }))
    .sort((a, b) => a.offerId.localeCompare(b.offerId));
}
@Injectable()
export class MarketService {
  constructor(private db: Db) {}
  async session(user: any) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 12 * 3600000);
    await this.db.session.create({
      data: { id: digest(token), userId: user.id, expiresAt },
    });
    return { token, expiresAt, user: publicUser(user) };
  }
  async register(data: any) {
    const email = data.email.trim().toLowerCase();
    const passwordHash = await hashPassword(data.password);
    try {
      return this.session(
        await this.db.user.create({
          data: {
            email,
            name: data.name.trim(),
            passwordHash,
            role: "CUSTOMER",
          },
        }),
      );
    } catch (e: any) {
      if (e.code === "P2002")
        throw new ConflictException("Email already registered");
      throw e;
    }
  }
  async login(data: any) {
    const u = await this.db.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });
    const valid = await verifyPassword(
      data.password,
      u?.passwordHash || "00000000000000000000000000000000:" + "00".repeat(64),
    );
    if (!u || !valid) throw new UnauthorizedException("Invalid login");
    return this.session(u);
  }
  async changePassword(user: any, data: {currentPassword: string; newPassword: string}) {
    const account = await this.db.user.findUniqueOrThrow({where:{id:user.id}});
    if (!await verifyPassword(data.currentPassword,account.passwordHash||'')) throw new UnauthorizedException("Current password is incorrect");
    if (data.currentPassword===data.newPassword) throw new BadRequestException("Choose a different password");
    const passwordHash=await hashPassword(data.newPassword);
    await this.db.$transaction(async tx=>{
      const updated=await tx.user.updateMany({where:{id:user.id,passwordHash:account.passwordHash},data:{passwordHash}});
      if(updated.count!==1)throw new ConflictException("Account changed, sign in again");
      await tx.session.deleteMany({where:{userId:user.id}});
      await tx.deviceSession.updateMany({where:{userId:user.id,revokedAt:null},data:{revokedAt:new Date()}});
    });
    return {ok:true,signInRequired:true};
  }
  async catalog(q: any) {
    const page = Math.min(10000, Math.max(1, Math.floor(Number(q.page) || 1)));
    const take = 24;
    const where: any = { approved: true };
    if (q.search)
      where.OR = ["title", "partNumber", "brand"].map((key) => ({
        [key]: { contains: String(q.search).slice(0, 100) },
      }));
    if (q.category) where.category = String(q.category);
    if (q.shopId)
      where.offers = {
        some: {
          shopId: String(q.shopId),
          active: true,
          shop: { approved: true },
        },
      };
    if (q.make && q.model) {
      const f: any = {
        verified: true,
        make: String(q.make),
        model: String(q.model),
      };
      if (q.year && Number.isInteger(Number(q.year))) {
        f.fromYear = { lte: Number(q.year) };
        f.toYear = { gte: Number(q.year) };
      }
      if (q.engine) f.engine = String(q.engine);
      where.fitments = { some: f };
    }
    const [items, total] = await this.db.$transaction([
      this.db.product.findMany({
        where,
        include: {
          fitments: { where: { verified: true } },
          offers: {
            where: { active: true, shop: { approved: true } },
            include: { shop: { select: { id: true, name: true, city: true } } },
          },
        },
        orderBy: { title: "asc" },
        skip: (page - 1) * take,
        take,
      }),
      this.db.product.count({ where }),
    ]);
    return { items, total, page, pages: Math.ceil(total / take) };
  }
  async product(id: string) {
    const p = await this.db.product.findFirst({
      where: { id, approved: true },
      include: {
        fitments: { where: { verified: true } },
        offers: {
          where: { active: true, shop: { approved: true } },
          include: { shop: { select: { id: true, name: true, city: true } } },
        },
      },
    });
    if (!p) throw new NotFoundException();
    return p;
  }
  async shopFor(user: any, id?: string) {
    requireRole(user, "MERCHANT", "ADMIN");
    const shop = await this.db.shop.findFirst({
      where: id ? { id } : user.role === "ADMIN" ? {} : { ownerId: user.id },
    });
    if (!shop) throw new NotFoundException("Shop not found");
    if (user.role !== "ADMIN" && shop.ownerId !== user.id)
      throw new ForbiddenException();
    return shop;
  }
  async createShop(user: any, data: any) {
    requireRole(user, "MERCHANT", "ADMIN");
    return this.db.shop.create({
      data: { ...data, ownerId: user.id, approved: false },
    });
  }
  async offer(user: any, shopId: string, data: OfferDto) {
    const shop = await this.shopFor(user, shopId);
    if (!(await this.db.product.findUnique({ where: { id: data.productId } })))
      throw new NotFoundException();
    const existing = await this.db.offer.findUnique({
      where: { shopId_sku: { shopId: shop.id, sku: data.sku } },
    });
    if (existing && existing.productId !== data.productId)
      throw new ConflictException("SKU belongs to another product");
    return this.db.offer.upsert({
      where: { shopId_sku: { shopId: shop.id, sku: data.sku } },
      create: { ...data, shopId: shop.id },
      update: { price: data.price, stock: data.stock },
    });
  }
  async updateOffer(user: any, id: string, data: OfferUpdateDto) {
    const o = await this.db.offer.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!o) throw new NotFoundException();
    if (user.role !== "ADMIN" && o.shop.ownerId !== user.id)
      throw new ForbiddenException();
    requireRole(user, "MERCHANT", "ADMIN");
    return this.db.offer.update({ where: { id }, data });
  }
  async createProduct(user: any, data: ProductDto) {
    requireRole(user, "ADMIN", "MERCHANT");
    return this.db.product.create({
      data: {
        ...data,
        brand: data.brand.trim().toUpperCase(),
        partNumber: data.partNumber.trim().toUpperCase(),
        approved: false,
      },
    });
  }
  async applyShop(user:any,d:any){
    requireRole(user,'CUSTOMER');
    const old=await this.db.shopApplication.findUnique({where:{userId:user.id}});
    if(old&&old.state!=='REJECTED')throw new ConflictException('An application already exists');
    return this.db.shopApplication.upsert({where:{userId:user.id},create:{...d,userId:user.id},update:{...d,state:'PENDING',reviewReason:'',reviewedAt:null,reviewedBy:null}});
  }
  async decideShopApplication(user:any,id:string,d:any){
    requireRole(user,'ADMIN');
    return this.db.$transaction(async tx=>{
      const application=await tx.shopApplication.findUnique({where:{id}});
      if(!application||application.state!=='PENDING')throw new ConflictException('Application no longer pending');
      const claimed=await tx.shopApplication.updateMany({where:{id,state:'PENDING'},data:{state:d.approve?'APPROVED':'REJECTED',reviewReason:d.reason,reviewedBy:user.id,reviewedAt:new Date()}});
      if(claimed.count!==1)throw new ConflictException('Application changed');
      if(d.approve){await tx.user.update({where:{id:application.userId},data:{role:'MERCHANT'}});await tx.shop.create({data:{ownerId:application.userId,name:application.name,city:application.city,approved:true}});}
      return tx.shopApplication.findUniqueOrThrow({where:{id}});
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }
  async deliveryAreas(){return this.db.deliveryArea.findMany({where:{active:true},orderBy:[{city:'asc'},{area:'asc'}]});}
  async saveDeliveryArea(user:any,data:any){
    requireRole(user,'ADMIN');
    const normalized={...data,city:data.city.trim(),area:data.area.trim()};
    if(normalized.city.length<2||normalized.area.length<2)throw new BadRequestException('City and area required');
    return this.db.deliveryArea.upsert({where:{city_area:{city:normalized.city,area:normalized.area}},create:normalized,update:{fee:normalized.fee,active:normalized.active}});
  }
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
    return {groups:allocateShipping(area.fee,groups),subtotal,delivery:area.fee,total:subtotal+area.fee,currency:'EGP',payment:'CASH_ON_DELIVERY',deliveryArea:{id:area.id,city:area.city,area:area.area},testOnly:true,checkoutSupported:true,shippingAllocationRequired:false};
  }
  async groupedCheckout(user:any,d:any){
    requireRole(user,'CUSTOMER');
    if(process.env.TEST_CHECKOUT!=='true')throw new ForbiddenException('Test checkout disabled');
    const items=normalizeItems(d.items);
    const fingerprint=digest(JSON.stringify({items,addressId:d.addressId,deliveryAreaId:d.deliveryAreaId,note:d.note||'',expectedTotal:d.expectedTotal}));
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
      const groups=allocateShipping(area.fee,groupValues);const subtotal=groups.reduce((sum,g)=>sum+g.subtotal,0);
      if(subtotal+area.fee!==d.expectedTotal)throw new ConflictException('Basket total changed, review a fresh quote');
      for(const item of items){const o=offers.find(o=>o.id===item.offerId)!;const changed=await tx.offer.updateMany({where:{id:o.id,active:true,price:o.price,stock:{gte:item.quantity}},data:{stock:{decrement:item.quantity}}});if(changed.count!==1)throw new ConflictException('Price or stock changed, review basket');}
      const snapshot={label:address.label,city:address.city,details:address.details,phone:address.phone,deliveryArea:{id:area.id,city:area.city,area:area.area}};
      const c=await tx.checkout.create({data:{customerId:user.id,requestKey:d.requestKey,fingerprint,subtotal,originalDelivery:area.fee,delivery:area.fee,total:subtotal+area.fee,area:{id:area.id,city:area.city,area:area.area,fee:area.fee},address:snapshot}});
      for(const group of groups){const lines=items.filter(i=>offers.find(o=>o.id===i.offerId)!.shopId===group.shopId).map(i=>{const o=offers.find(o=>o.id===i.offerId)!;return {offerId:o.id,title:o.product.title,partNumber:o.product.partNumber,quantity:i.quantity,unitPrice:o.price};});await tx.order.create({data:{checkoutId:c.id,customerId:user.id,shopId:group.shopId,subtotal:group.subtotal,delivery:group.delivery,total:group.total,address:snapshot,note:d.note||'',requestKey:c.id+':'+group.shopId,payment:'TEST_COD',items:{create:lines},events:{create:{status:'PLACED'}}}});}
      await tx.financialAudit.create({data:{checkoutId:c.id,actorId:user.id,action:'CHECKOUT_CREATED',before:{},after:{groups,delivery:area.fee,total:c.total},reason:'Reviewed basket committed'}});
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
  async transition(user: any, id: string, status: any) {
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
        data: { status,...(status==='SHIPPED'?{deliveryStartedAt:new Date(),deliveryStartedBy:user.id}:{}) },
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
  async dashboard(user: any) {
    requireRole(user, "MERCHANT", "ADMIN");
    const where = user.role === "ADMIN" ? {} : { ownerId: user.id };
    const shops = await this.db.shop.findMany({
      where,
      include: { offers: { include: { product: true } } },
    });
    const orders = await this.orders(user);
    return {
      shops,
      orders,
      summary: {
        orders: orders.length,
        revenue: orders
          .filter((o) => o.status === "DELIVERED")
          .reduce((s, o) => s + o.total, 0),
        offers: shops.reduce((s, v) => s + v.offers.length, 0),
      },
      ...(user.role === "ADMIN"
        ? {
            products: await this.db.product.findMany({
              take: 100,
              orderBy: { title: "asc" },include:{fitments:true},
            }),
            shopApplications:await this.db.shopApplication.findMany({orderBy:{createdAt:'desc'},take:100}),
            deliveryAreas:await this.db.deliveryArea.findMany({orderBy:[{city:'asc'},{area:'asc'}]}),
            users: await this.db.user.findMany({
              select: { id: true, name: true, email: true, role: true },
              take: 100,
            }),
          }
        : {}),
    };
  }
  async importHistory(user:any,shopId:string){await this.shopFor(user,shopId);return this.db.inventoryImport.findMany({where:{shopId},select:{id:true,actorId:true,fileHash:true,state:true,total:true,invalid:true,createdAt:true,expiresAt:true,committedAt:true},orderBy:{createdAt:'desc'},take:50});}
  async importCsv(user:any,shopId:string,csv:string,commit:boolean,previewId?:string){
    await this.shopFor(user,shopId);const fileHash=digest(csv);
    if(commit){if(!previewId)throw new BadRequestException('Preview this exact file before committing');return this.db.$transaction(async tx=>{const job=await tx.inventoryImport.findUnique({where:{id:previewId}});if(!job||job.shopId!==shopId||job.actorId!==user.id||job.fileHash!==fileHash)throw new ConflictException('Preview does not match this shop, actor or file');if(job.state==='COMMITTED')return {committed:true,previewId:job.id,fileHash,total:job.total,invalid:0,replayed:true};if(job.invalid||job.expiresAt<new Date()||job.state!=='PREVIEW')throw new ConflictException('Preview expired or contains errors');const rows=job.snapshot as any[];
      for(const r of rows){const product=await tx.product.findUnique({where:{id:r.productId}});if(!product||!product.approved)throw new ConflictException('Catalog changed; preview again');if(r.old){const changed=await tx.offer.updateMany({where:{id:r.old.id,shopId,productId:r.productId,updatedAt:new Date(r.old.updatedAt),price:r.old.price,stock:r.old.stock},data:{price:r.price,stock:r.stock}});if(changed.count!==1)throw new ConflictException('Inventory changed since preview; preview again');}else{const exists=await tx.offer.findFirst({where:{shopId,OR:[{sku:r.sku},{productId:r.productId}]}});if(exists)throw new ConflictException('Offer mapping changed; preview again');await tx.offer.create({data:{shopId,productId:r.productId,sku:r.sku,price:r.price,stock:r.stock}});}}
      await tx.inventoryImport.update({where:{id:job.id},data:{state:'COMMITTED',committedAt:new Date()}});return {committed:true,previewId:job.id,fileHash,total:job.total,invalid:0};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:60000});}
    let rows:any[];try{rows=parse(csv,{columns:true,skip_empty_lines:true,bom:true,trim:true,max_record_size:10000});}catch{throw new BadRequestException('Invalid CSV');}if(!rows.length||rows.length>1000)throw new BadRequestException('Use 1 to 1000 rows per batch');
    const products=await this.db.product.findMany({where:{OR:rows.map(r=>({brand:String(r.brand||'').toUpperCase(),partNumber:String(r.part_number||'').toUpperCase()}))},select:{id:true,brand:true,partNumber:true,approved:true}});
    const oldOffers=await this.db.offer.findMany({where:{shopId,OR:[{sku:{in:rows.map(r=>String(r.sku||''))}},{productId:{in:products.map(p=>p.id)}}]}});const seenSku=new Set();const seenProduct=new Set();
    const results=rows.map((r,i)=>{const errors:string[]=[];const sku=String(r.sku||'');if(!sku||sku.length>100||seenSku.has(sku))errors.push('Missing, long or duplicate sku');seenSku.add(sku);if(!/^\d+$/.test(r.price_minor||'')||Number(r.price_minor)<1||Number(r.price_minor)>100000000)errors.push('price_minor must be positive integer piastres');if(!/^\d+$/.test(r.stock||'')||Number(r.stock)>1000000)errors.push('Invalid stock');const p=products.find(p=>p.brand===String(r.brand||'').toUpperCase()&&p.partNumber===String(r.part_number||'').toUpperCase());if(!p||!p.approved)errors.push('Unknown or unapproved brand/part_number');if(p&&seenProduct.has(p.id))errors.push('Duplicate catalog product in batch');if(p)seenProduct.add(p.id);const old=oldOffers.find(o=>o.sku===sku);if(old&&old.productId!==p?.id)errors.push('SKU already mapped to different product');if(p&&oldOffers.some(o=>o.productId===p.id&&o.sku!==sku))errors.push('Catalog product already has a different shop SKU');return {row:i+2,sku,productId:p?.id||null,price:Number(r.price_minor)||0,stock:Number(r.stock)||0,old:old?{id:old.id,price:old.price,stock:old.stock,updatedAt:old.updatedAt.toISOString()}:null,errors};});
    const invalid=results.filter(r=>r.errors.length).length;const job=await this.db.inventoryImport.create({data:{shopId,actorId:user.id,fileHash,total:rows.length,invalid,snapshot:results,expiresAt:new Date(Date.now()+1800000)}});return {committed:false,previewId:job.id,fileHash,rows:results,total:rows.length,invalid,semantics:'ABSOLUTE_STOCK_SNAPSHOT',expiresAt:job.expiresAt};
  }
}
