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
import { PasskeyService } from "../auth/passkey.service";
import { PhoneAuthService } from "../auth/phone-auth.service";
import { AuthService } from "../auth/auth.service";

@Controller("api")
@UseGuards(AuthGuard)
export class AccountController {
  constructor(
    private db: Db,
    private phoneAuth: PhoneAuthService,
    private passkeys: PasskeyService,
    private authSvc: AuthService,
  ) {}
  @Post('auth/passkeys/register/options') registerOptions(@Req() r:any){return this.passkeys.registerOptions(r.user);}
  @Post('auth/passkeys/register/verify') registerPasskey(@Req() r:any,@Body() d:D.PasskeyVerifyDto){return this.passkeys.register(r.user,d);}
  @Get('auth/passkeys') passkeyList(@Req() r:any){return this.passkeys.list(r.user);}
  @Delete('auth/passkeys/:id') revokePasskey(@Req() r:any,@Param('id') id:string){return this.passkeys.revoke(r.user,id);}
  @Get('auth/devices') devices(@Req() r:any){return this.phoneAuth.list(r.user);}
  @Delete('auth/devices/:id') revokeDevice(@Req() r:any,@Param('id') id:string){return this.phoneAuth.revoke(r.user,id);}
  @Patch('me') updateProfile(@Req() r:any,@Body() d:D.ProfileDto){return this.db.user.update({where:{id:r.user.id},data:{name:d.name.trim()},select:{id:true,name:true,email:true,phone:true,role:true}});}
  @Get('favorites') async favorites(@Req() r:any){const saved=await this.db.favorite.findMany({where:{userId:r.user.id},orderBy:{createdAt:'desc'}});return this.db.product.findMany({where:{id:{in:saved.map(f=>f.productId)},approved:true},select:{id:true,title:true,brand:true,partNumber:true,image:true,category:true}});}
  @Post('favorites/:id') async favorite(@Req() r:any,@Param('id') id:string){const product=await this.db.product.findFirst({where:{id,approved:true}});if(!product)throw new BadRequestException('Product unavailable');return this.db.favorite.upsert({where:{userId_productId:{userId:r.user.id,productId:id}},create:{userId:r.user.id,productId:id},update:{}});}
  @Delete('favorites/:id') unfavorite(@Req() r:any,@Param('id') id:string){return this.db.favorite.deleteMany({where:{userId:r.user.id,productId:id}});}
  @Get('support-tickets') tickets(@Req() r:any){return this.db.supportTicket.findMany({where:r.user.role==='ADMIN'?{}:{userId:r.user.id},orderBy:{createdAt:'desc'},take:100});}
  @Post('support-tickets') ticket(@Req() r:any,@Body() d:D.TicketDto){if(d.attachment&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(d.attachment))throw new BadRequestException('Attachment must be a PNG, JPEG or WebP image');return this.db.supportTicket.create({data:{...d,userId:r.user.id,reply:''}});}
  @Get('vehicle-catalog') async vehicleCatalog(){const rows=await this.db.fitment.findMany({select:{make:true,model:true,fromYear:true,toYear:true,engine:true}});const t:Record<string,Record<string,{from:number;to:number;engines:string[]}>>={};for(const f of rows){const m=(t[f.make]??={});const e=(m[f.model]??={from:f.fromYear,to:f.toYear,engines:[]});e.from=Math.min(e.from,f.fromYear);e.to=Math.max(e.to,f.toYear);if(f.engine&&!e.engines.includes(f.engine))e.engines.push(f.engine);}return {makes:Object.entries(t).map(([make,models])=>({make,models:Object.entries(models).map(([model,v])=>({model,...v}))}))};}
  @Get("me") me(@Req() r: any) {
    return r.user;
  }
  @Post("auth/logout") async logout(@Req() r: any) {
    await this.db.session.deleteMany({
      where: { id: digest(r.headers.authorization.replace(/^Bearer /, "")) },
    });
    return { ok: true };
  }
  @Post("auth/password") password(@Req() r:any,@Body() d:D.ChangePasswordDto){return this.authSvc.changePassword(r.user,d);}
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
}
