import {
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Module,
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
import {FileInterceptor} from '@nestjs/platform-express';
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { Db } from "./db";
import {PasskeyService} from './passkey.service';
import {PhoneAuthService} from './phone-auth.service';
import { MarketService } from "./market.service";
import { AuthGuard, digest, requireRole } from "./security";
import * as D from "./dto";
@Controller("api")
class PublicController {
  constructor(
    private s: MarketService,
    private db: Db,
    private phoneAuth:PhoneAuthService,
    private passkeys:PasskeyService,
  ) {}
  @Get("health") async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { ok: true, checkout: "TEST_ONLY" };
  }
  @Post('auth/passkeys/login/options') passkeyOptions(){return this.passkeys.loginOptions();}
  @Post('auth/passkeys/login/verify') passkeyLogin(@Body() d:D.PasskeyVerifyDto){return this.passkeys.login(d);}
  @Post('auth/phone/start') startPhone(@Body() d:D.StartPhoneDto){return this.phoneAuth.start(d);}
  @Post('auth/phone/check') checkPhone(@Body() d:D.CheckPhoneDto){return this.phoneAuth.check(d);}
  @Post('auth/device/refresh') refreshDevice(@Body() d:D.DeviceRefreshDto){return this.phoneAuth.refresh(d.deviceToken);}
  @Post("auth/register") register(@Body() d: D.RegisterDto) {
    return this.s.register(d);
  }
  @Post("auth/login") login(@Body() d: D.LoginDto) {
    return this.s.login(d);
  }
  @Get("products") catalog(@Query() q: any) {
    return this.s.catalog(q);
  }
  @Get("products/:id") product(@Param("id") id: string) {
    return this.s.product(id);
  }
  @Get("shops") shops() {
    return this.db.shop.findMany({
      where: { approved: true },
      select: { id: true, name: true, city: true },
    });
  }
  @Get("delivery-areas") deliveryAreas(){return this.s.deliveryAreas();}
  @Get("categories") async categories() {
    const x = await this.db.product.findMany({
      where: { approved: true },
      select: { category: true },
      distinct: ["category"],
    });
    return x.map((v) => v.category);
  }
}
@Controller("api")
@UseGuards(AuthGuard)
class PrivateController {
  constructor(
    private s: MarketService,
    private db: Db,
    private phoneAuth:PhoneAuthService,
    private passkeys:PasskeyService,
  ) {}
  @Post('auth/passkeys/register/options') registerOptions(@Req() r:any){return this.passkeys.registerOptions(r.user);}
  @Post('auth/passkeys/register/verify') registerPasskey(@Req() r:any,@Body() d:D.PasskeyVerifyDto){return this.passkeys.register(r.user,d);}
  @Get('auth/passkeys') passkeyList(@Req() r:any){return this.passkeys.list(r.user);}
  @Delete('auth/passkeys/:id') revokePasskey(@Req() r:any,@Param('id') id:string){return this.passkeys.revoke(r.user,id);}
  @Get('auth/devices') devices(@Req() r:any){return this.phoneAuth.list(r.user);}
  @Delete('auth/devices/:id') revokeDevice(@Req() r:any,@Param('id') id:string){return this.phoneAuth.revoke(r.user,id);}
  @Get('shop-application') shopApplication(@Req() r:any){return this.db.shopApplication.findUnique({where:{userId:r.user.id}});}
  @Post('shop-applications') applyShop(@Req() r:any,@Body() d:D.ShopApplicationDto){return this.s.applyShop(r.user,d);}
  @Post('admin/shop-applications/:id/decision') decideShopApplication(@Req() r:any,@Param('id') id:string,@Body() d:D.ShopApplicationDecisionDto){return this.s.decideShopApplication(r.user,id,d);}
  @Patch('me') updateProfile(@Req() r:any,@Body() d:D.ProfileDto){return this.db.user.update({where:{id:r.user.id},data:{name:d.name.trim()},select:{id:true,name:true,email:true,phone:true,role:true}});}
  @Get('favorites') async favorites(@Req() r:any){const saved=await this.db.favorite.findMany({where:{userId:r.user.id},orderBy:{createdAt:'desc'}});return this.db.product.findMany({where:{id:{in:saved.map(f=>f.productId)},approved:true},select:{id:true,title:true,brand:true,partNumber:true,image:true,category:true}});}
  @Post('favorites/:id') async favorite(@Req() r:any,@Param('id') id:string){const product=await this.db.product.findFirst({where:{id,approved:true}});if(!product)throw new BadRequestException('Product unavailable');return this.db.favorite.upsert({where:{userId_productId:{userId:r.user.id,productId:id}},create:{userId:r.user.id,productId:id},update:{}});}
  @Delete('favorites/:id') unfavorite(@Req() r:any,@Param('id') id:string){return this.db.favorite.deleteMany({where:{userId:r.user.id,productId:id}});}
  @Get('support-tickets') tickets(@Req() r:any){return this.db.supportTicket.findMany({where:r.user.role==='ADMIN'?{}:{userId:r.user.id},orderBy:{createdAt:'desc'},take:100});}
  @Post('support-tickets') ticket(@Req() r:any,@Body() d:D.TicketDto){return this.db.supportTicket.create({data:{...d,userId:r.user.id,reply:''}});}
  @Patch('admin/support-tickets/:id') ticketReply(@Req() r:any,@Param('id') id:string,@Body() d:D.TicketReplyDto){requireRole(r.user,'ADMIN');return this.db.supportTicket.update({where:{id},data:{...d,repliedBy:r.user.id,repliedAt:new Date()}});}
  @Get("me") me(@Req() r: any) {
    return r.user;
  }
  @Post("auth/logout") async logout(@Req() r: any) {
    await this.db.session.deleteMany({
      where: { id: digest(r.headers.authorization.replace(/^Bearer /, "")) },
    });
    return { ok: true };
  }
  @Post("auth/password") password(@Req() r:any,@Body() d:D.ChangePasswordDto){return this.s.changePassword(r.user,d);}
  @Get("addresses") addresses(@Req() r: any) {
    return this.db.address.findMany({ where: { userId: r.user.id } });
  }
  @Post("addresses") address(@Req() r: any, @Body() d: D.AddressDto) {
    return this.db.address.create({ data: { ...d, userId: r.user.id } });
  }
  @Delete("addresses/:id") async deleteAddress(
    @Req() r: any,
    @Param("id") id: string,
  ) {
    return this.db.address.deleteMany({ where: { id, userId: r.user.id } });
  }
  @Get("vehicles") vehicles(@Req() r: any) {
    return this.db.vehicle.findMany({ where: { userId: r.user.id } });
  }
  @Post("vehicles") vehicle(@Req() r: any, @Body() d: D.VehicleDto) {
    return this.db.vehicle.create({ data: { ...d, userId: r.user.id } });
  }
  @Post('orders/quote') quote(@Req() r:any,@Body() d:D.QuoteDto){return this.s.quote(r.user,d);}
  @Post('admin/delivery-areas') deliveryArea(@Req() r:any,@Body() d:D.DeliveryAreaDto){return this.s.saveDeliveryArea(r.user,d);}
  @Post('checkouts') groupedCheckout(@Req() r:any,@Body() d:D.GroupCheckoutDto){return this.s.groupedCheckout(r.user,d);}
  @Post("orders") checkout(@Req() r: any, @Body() d: D.CheckoutDto) {
    return this.s.checkout(r.user, d);
  }
  @Get("orders") orders(@Req() r: any) {
    return this.s.orders(r.user);
  }
  @Post('admin/orders/:id/shipping-settlements') settleShipping(@Req() r:any,@Param('id') id:string,@Body() d:D.ShippingSettlementDto){return this.s.settleShipping(r.user,id,d);}
  @Post('orders/:id/returns') requestReturn(@Req() r:any,@Param('id') id:string,@Body() d:D.ReturnRequestDto){return this.s.requestReturn(r.user,id,d);}
  @Post('admin/returns/:id/decision') decideReturn(@Req() r:any,@Param('id') id:string,@Body() d:D.ReturnDecisionDto){return this.s.decideReturn(r.user,id,d);}
  @Post('admin/returns/:id/refund-evidence') refundEvidence(@Req() r:any,@Param('id') id:string,@Body() d:D.RefundEvidenceDto){return this.s.refundEvidence(r.user,id,d);}
  @Post('orders/:id/cancellation-requests') requestCancellation(@Req() r:any,@Param('id') id:string,@Body() d:D.CancellationRequestDto){return this.s.requestCancellation(r.user,id,d.reason);}
  @Post('admin/cancellation-requests/:id/decision') decideCancellation(@Req() r:any,@Param('id') id:string,@Body() d:D.CancellationDecisionDto){return this.s.decideCancellation(r.user,id,d);}
  @Patch("orders/:id/status") status(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.StatusDto,
  ) {
    return this.s.transition(r.user, id, d.status);
  }
  @Get("dashboard") dashboard(@Req() r: any) {
    return this.s.dashboard(r.user);
  }
  @Post("shops") shop(@Req() r: any, @Body() d: D.ShopDto) {
    return this.s.createShop(r.user, d);
  }
  @Post("shops/:id/offers") offer(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.OfferDto,
  ) {
    return this.s.offer(r.user, id, d);
  }
  @Patch("offers/:id") updateOffer(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.OfferUpdateDto,
  ) {
    return this.s.updateOffer(r.user, id, d);
  }
  @Patch('admin/products/:id/details') async editProduct(@Req() r:any,@Param('id') id:string,@Body() d:D.CatalogEditDto){requireRole(r.user,'ADMIN');return this.db.product.update({where:{id},data:{...d,approved:false}});}
  @Post('admin/products/:id/fitments') async addFitment(@Req() r:any,@Param('id') id:string,@Body() d:D.FitmentDto){requireRole(r.user,'ADMIN');if(d.fromYear>d.toYear)throw new BadRequestException('Year range is invalid');return this.db.fitment.create({data:{...d,productId:id}});}
  @Delete('admin/fitments/:id') async deleteFitment(@Req() r:any,@Param('id') id:string){requireRole(r.user,'ADMIN');return this.db.fitment.delete({where:{id}});}
  @Post('admin/products/:id/image')
  @UseInterceptors(FileInterceptor('image',{limits:{fileSize:5242880,files:1}}))
  async productImage(@Req() r:any,@Param('id') id:string,@UploadedFile() file:Express.Multer.File){requireRole(r.user,'ADMIN');if(!file||!['image/jpeg','image/png','image/webp'].includes(file.mimetype))throw new BadRequestException('Use JPEG, PNG or WebP under 5MB');await this.db.product.findUniqueOrThrow({where:{id}});let buffer:Buffer;try{buffer=await sharp(file.buffer,{limitInputPixels:25000000}).rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();}catch{throw new BadRequestException('Invalid image content');}const name=randomUUID()+'.webp';const folder=resolve(process.env.MEDIA_DIR||'media');await mkdir(folder,{recursive:true});await writeFile(join(folder,name),buffer,{flag:'wx'});return this.db.product.update({where:{id},data:{image:'/api/media/'+name,approved:false}});}
  @Post("products") product(@Req() r: any, @Body() d: D.ProductDto) {
    return this.s.createProduct(r.user, d);
  }
  @Get("shops/:id/imports") importHistory(@Req() r:any,@Param("id") id:string){return this.s.importHistory(r.user,id);}
  @Post("shops/:id/import") import(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.ImportDto,
  ) {
    return this.s.importCsv(r.user, id, d.csv, d.commit,d.previewId);
  }
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
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
  controllers: [PublicController, PrivateController],
  providers: [
    Db,
    MarketService,
    PhoneAuthService,
    PasskeyService,
    AuthGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
