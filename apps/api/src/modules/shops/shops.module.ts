import { Module } from "@nestjs/common";
import { DashboardModule } from "../dashboard/dashboard.module";
import { MerchantController } from "./merchant.controller";
import { ShopsService } from "./shops.service";

@Module({
  imports: [DashboardModule],
  controllers: [MerchantController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
