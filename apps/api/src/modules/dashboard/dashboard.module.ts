import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [OrdersModule],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
