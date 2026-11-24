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
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class DashboardService {
  constructor(private db: Db, private ordersService: OrdersService) {}
  async dashboard(user: any) {
    requireRole(user, "MERCHANT", "ADMIN");
    const where = user.role === "ADMIN" ? {} : { ownerId: user.id };
    const shops = await this.db.shop.findMany({
      where,
      include: { offers: { include: { product: true } } },
    });
    const orders = await this.ordersService.orders(user);
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
}
