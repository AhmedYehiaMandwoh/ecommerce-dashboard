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
import { Prisma } from "../../generated/prisma/client";

@Injectable()
export class ShopsService {
  constructor(private db: Db) {}
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
    const prod = await this.db.product.findUnique({ where: { id: data.productId } });
    if (!prod) throw new NotFoundException();
    if (!prod.approved) throw new ConflictException("Product is not approved yet");
    const existing = await this.db.offer.findUnique({
      where: { shopId_sku: { shopId: shop.id, sku: data.sku } },
    });
    if (existing && existing.productId !== data.productId)
      throw new ConflictException("SKU belongs to another product");
    const saved = await this.db.offer.upsert({
      where: { shopId_sku: { shopId: shop.id, sku: data.sku } },
      create: { ...data, shopId: shop.id },
      update: { price: data.price, stock: data.stock },
    });
    await this.db.productProposal.deleteMany({ where: { productId: data.productId, ownerId: user.id } });
    return saved;
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
    const { proposedPrice, proposedStock, ...rest } = data;
    if ((proposedPrice === undefined) !== (proposedStock === undefined))
      throw new BadRequestException("Send both proposedPrice (piasters) and proposedStock, or neither");
    if (proposedPrice !== undefined && user.role !== "MERCHANT")
      throw new BadRequestException("Only a merchant can propose a price and stock");
    const product = await this.db.product.create({
      data: {
        ...rest,
        brand: data.brand.trim().toUpperCase(),
        partNumber: data.partNumber.trim().toUpperCase(),
        approved: false,
        submittedBy: user.id,
      },
    });
    if (proposedPrice !== undefined && proposedStock !== undefined)
      await this.db.productProposal.create({ data: { productId: product.id, ownerId: user.id, price: proposedPrice, stock: proposedStock } });
    return product;
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
