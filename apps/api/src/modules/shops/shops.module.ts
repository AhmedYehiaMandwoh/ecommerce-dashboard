import { Module } from "@nestjs/common";
import { DashboardModule } from "../dashboard/dashboard.module";
import { MerchantController } from "./merchant.controller";
import { ShopProfileController } from "./shop-profile.controller";
import { ShopsService } from "./shops.service";

@Module({
  imports: [DashboardModule],
  controllers: [MerchantController, ShopProfileController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
