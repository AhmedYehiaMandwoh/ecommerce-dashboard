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
  @Get('vehicle-catalog') async vehicleCatalog(){const rows=await this.db.fitment.findMany({where:{product:{approved:true}},select:{make:true,model:true,fromYear:true,toYear:true,engine:true}});const t:Record<string,Record<string,{from:number;to:number;engines:string[]}>>={};for(const f of rows){const m=(t[f.make]??={});const e=(m[f.model]??={from:f.fromYear,to:f.toYear,engines:[]});e.from=Math.min(e.from,f.fromYear);e.to=Math.max(e.to,f.toYear);if(f.engine&&!e.engines.includes(f.engine))e.engines.push(f.engine);}return {makes:Object.entries(t).map(([make,models])=>({make,models:Object.entries(models).map(([model,v])=>({model,...v}))}))};}
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
