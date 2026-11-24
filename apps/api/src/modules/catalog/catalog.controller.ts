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
import { CatalogService } from "./catalog.service";

@Controller("api")
export class CatalogController {
  constructor(
    private db: Db,
    private catalogSvc: CatalogService,
  ) {}
  @Get("products") catalog(@Query() q: any) {
    return this.catalogSvc.catalog(q);
  }
  @Get("products/:id") product(@Param("id") id: string) {
    return this.catalogSvc.product(id);
  }
  @Get("shops") shops() {
    return this.db.shop.findMany({
      where: { approved: true },
      select: { id: true, name: true, city: true },
    });
  }
  @Get("delivery-areas") deliveryAreas(){return this.catalogSvc.deliveryAreas();}
  @Get("categories") async categories() {
    const x = await this.db.product.findMany({
      where: { approved: true },
      select: { category: true },
      distinct: ["category"],
    });
    return x.map((v) => v.category);
  }
}
