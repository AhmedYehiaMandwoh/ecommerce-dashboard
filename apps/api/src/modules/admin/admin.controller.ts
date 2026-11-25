import {
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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
import { CatalogService } from "../catalog/catalog.service";
import { ShopsService } from "../shops/shops.service";
import { OrdersService } from "../orders/orders.service";

@Controller("api")
@UseGuards(AuthGuard)
export class AdminController {
  constructor(
    private db: Db,
    private catalogSvc: CatalogService,
    private shopsSvc: ShopsService,
    private ordersSvc: OrdersService,
  ) {}
  @Post('admin/shop-applications/:id/suspension') suspendShop(@Req() r:any,@Param('id') id:string,@Body() d:D.ShopSuspensionDto){return this.shopsSvc.suspendShop(r.user,id,d);}
  @Post('admin/shop-applications/:id/decision') decideShopApplication(@Req() r:any,@Param('id') id:string,@Body() d:D.ShopApplicationDecisionDto){return this.shopsSvc.decideShopApplication(r.user,id,d);}
  @Patch('admin/support-tickets/:id') ticketReply(@Req() r:any,@Param('id') id:string,@Body() d:D.TicketReplyDto){requireRole(r.user,'ADMIN');return this.db.supportTicket.update({where:{id},data:{...d,repliedBy:r.user.id,repliedAt:new Date()}});}
  @Post('admin/delivery-areas') deliveryArea(@Req() r:any,@Body() d:D.DeliveryAreaDto){return this.catalogSvc.saveDeliveryArea(r.user,d);}
  @Post('admin/orders/:id/shipping-settlements') settleShipping(@Req() r:any,@Param('id') id:string,@Body() d:D.ShippingSettlementDto){return this.ordersSvc.settleShipping(r.user,id,d);}
  @Post('admin/returns/:id/decision') decideReturn(@Req() r:any,@Param('id') id:string,@Body() d:D.ReturnDecisionDto){return this.ordersSvc.decideReturn(r.user,id,d);}
  @Post('admin/returns/:id/refund-evidence') refundEvidence(@Req() r:any,@Param('id') id:string,@Body() d:D.RefundEvidenceDto){return this.ordersSvc.refundEvidence(r.user,id,d);}
  @Post('admin/cancellation-requests/:id/decision') decideCancellation(@Req() r:any,@Param('id') id:string,@Body() d:D.CancellationDecisionDto){return this.ordersSvc.decideCancellation(r.user,id,d);}
  @Patch('admin/products/:id/details') async editProduct(@Req() r:any,@Param('id') id:string,@Body() d:D.CatalogEditDto){requireRole(r.user,'ADMIN');return this.db.product.update({where:{id},data:{...d,approved:false}});}
  @Post('admin/products/:id/fitments') async addFitment(@Req() r:any,@Param('id') id:string,@Body() d:D.FitmentDto){requireRole(r.user,'ADMIN');if(d.fromYear>d.toYear)throw new BadRequestException('Year range is invalid');return this.db.fitment.create({data:{...d,productId:id}});}
  @Delete('admin/fitments/:id') async deleteFitment(@Req() r:any,@Param('id') id:string){requireRole(r.user,'ADMIN');return this.db.fitment.delete({where:{id}});}
  @Post('admin/products/:id/image')
  @UseInterceptors(FileInterceptor('image',{limits:{fileSize:5242880,files:1}}))
  async productImage(@Req() r:any,@Param('id') id:string,@UploadedFile() file:Express.Multer.File){requireRole(r.user,'ADMIN');if(!file||!['image/jpeg','image/png','image/webp'].includes(file.mimetype))throw new BadRequestException('Use JPEG, PNG or WebP under 5MB');await this.db.product.findUniqueOrThrow({where:{id}});let buffer:Buffer;try{buffer=await sharp(file.buffer,{limitInputPixels:25000000}).rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();}catch{throw new BadRequestException('Invalid image content');}const name=randomUUID()+'.webp';const folder=resolve(process.env.MEDIA_DIR||'media');await mkdir(folder,{recursive:true});await writeFile(join(folder,name),buffer,{flag:'wx'});return this.db.product.update({where:{id},data:{image:'/api/media/'+name,approved:false}});}
  @Patch("admin/shops/:id") approveShop(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.ApprovalDto,
  ) {
    requireRole(r.user, "ADMIN");
    return this.db.shop.update({ where: { id }, data: d });
  }
  @Patch("admin/products/:id") approveProduct(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.ApprovalDto,
  ) {
    requireRole(r.user, "ADMIN");
    return this.db.product.update({ where: { id }, data: d });
  }
  @Patch("admin/users/:id/merchant") merchant(
    @Req() r: any,
    @Param("id") id: string,
  ) {
    requireRole(r.user, "ADMIN");
    return this.db.user.update({
      where: { id },
      data: { role: "MERCHANT" },
      select: { id: true, role: true, name: true },
    });
  }
}
