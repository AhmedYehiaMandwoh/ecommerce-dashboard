import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { OrdersModule } from "../orders/orders.module";
import { ShopsModule } from "../shops/shops.module";
import { AdminController } from "./admin.controller";

@Module({
  imports: [CatalogModule, OrdersModule, ShopsModule],
  controllers: [AdminController],
})
export class AdminModule {}
