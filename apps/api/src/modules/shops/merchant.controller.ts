import {
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Delete,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { Db } from "../../db";
import { AuthGuard, digest, requireRole } from "../../security";
import * as D from "../../dto";
import { ShopsService } from "../shops/shops.service";
import { DashboardService } from "../dashboard/dashboard.service";

@Controller("api")
@UseGuards(AuthGuard)
export class MerchantController {
  constructor(
    private db: Db,
    private shopsSvc: ShopsService,
    private dashboardSvc: DashboardService,
  ) {}
  @Get('shop-application') shopApplication(@Req() r:any){return this.db.shopApplication.findUnique({where:{userId:r.user.id}});}
  @Post('shop-applications') applyShop(@Req() r:any,@Body() d:D.ShopApplicationDto){return this.shopsSvc.applyShop(r.user,d);}
  @Get("dashboard") dashboard(@Req() r: any) {
    return this.dashboardSvc.dashboard(r.user);
  }
  @Post("shops") shop(@Req() r: any, @Body() d: D.ShopDto) {
    return this.shopsSvc.createShop(r.user, d);
  }
  @Post("shops/:id/offers") offer(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.OfferDto,
  ) {
    return this.shopsSvc.offer(r.user, id, d);
  }
  @Patch("offers/:id") updateOffer(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.OfferUpdateDto,
  ) {
    return this.shopsSvc.updateOffer(r.user, id, d);
  }
  private async ownPending(user:any,id:string){requireRole(user,'MERCHANT');const p=await this.db.product.findUnique({where:{id}});if(!p||p.submittedBy!==user.id)throw new ForbiddenException('Only your own submitted product can be edited');if(p.approved)throw new ConflictException('Approved products can only be changed by the admin');return p;}
  @Post('products/:id/fitments') async merchantFitment(@Req() r:any,@Param('id') id:string,@Body() d:D.MerchantFitmentDto){await this.ownPending(r.user,id);if(d.fromYear>d.toYear)throw new BadRequestException('Year range is invalid');if(await this.db.fitment.count({where:{productId:id}})>=20)throw new BadRequestException('Maximum 20 fitment rows per product');return this.db.fitment.create({data:{...d,productId:id,verified:false}});}
  @Delete('products/:id/fitments/:fid') async merchantFitmentDelete(@Req() r:any,@Param('id') id:string,@Param('fid') fid:string){await this.ownPending(r.user,id);return this.db.fitment.deleteMany({where:{id:fid,productId:id}});}
  @Post('products/:id/image')
  @UseInterceptors(FileInterceptor('image',{limits:{fileSize:5242880,files:1}}))
  async merchantProductImage(@Req() r:any,@Param('id') id:string,@UploadedFile() file:Express.Multer.File){await this.ownPending(r.user,id);if(!file||!['image/jpeg','image/png','image/webp'].includes(file.mimetype))throw new BadRequestException('Use JPEG, PNG or WebP under 5MB');let buffer:Buffer;try{buffer=await sharp(file.buffer,{limitInputPixels:25000000}).rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();}catch{throw new BadRequestException('Invalid image content');}const name=randomUUID()+'.webp';const folder=resolve(process.env.MEDIA_DIR||'media');await mkdir(folder,{recursive:true});await writeFile(join(folder,name),buffer,{flag:'wx'});return this.db.product.update({where:{id},data:{image:'/api/media/'+name}});}
  @Post("products") product(@Req() r: any, @Body() d: D.ProductDto) {
    return this.shopsSvc.createProduct(r.user, d);
  }
  @Get("shops/:id/imports") importHistory(@Req() r:any,@Param("id") id:string){return this.shopsSvc.importHistory(r.user,id);}
  @Post("shops/:id/import") import(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.ImportDto,
  ) {
    return this.shopsSvc.importCsv(r.user, id, d.csv, d.commit,d.previewId);
  }
}
