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
export class CatalogService {
  constructor(private db: Db) {}
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
  async deliveryAreas(){return this.db.deliveryArea.findMany({where:{active:true},orderBy:[{city:'asc'},{area:'asc'}]});}
  async saveDeliveryArea(user:any,data:any){
    requireRole(user,'ADMIN');
    const normalized={...data,city:data.city.trim(),area:data.area.trim()};
    if(normalized.city.length<2||normalized.area.length<2)throw new BadRequestException('City and area required');
    return this.db.deliveryArea.upsert({where:{city_area:{city:normalized.city,area:normalized.area}},create:normalized,update:{fee:normalized.fee,active:normalized.active}});
  }
}
