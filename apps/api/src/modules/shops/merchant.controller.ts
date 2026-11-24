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
