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
import { AuthGuard, digest, requireRole } from "../../security";
import * as D from "../../dto";
import { OrdersService } from "./orders.service";

@Controller("api")
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(
    private ordersSvc: OrdersService,
  ) {}
  @Post('orders/quote') quote(@Req() r:any,@Body() d:D.QuoteDto){return this.ordersSvc.quote(r.user,d);}
  @Post('checkouts') groupedCheckout(@Req() r:any,@Body() d:D.GroupCheckoutDto){return this.ordersSvc.groupedCheckout(r.user,d);}
  @Post("orders") checkout(@Req() r: any, @Body() d: D.CheckoutDto) {
    return this.ordersSvc.checkout(r.user, d);
  }
  @Get("orders") orders(@Req() r: any) {
    return this.ordersSvc.orders(r.user);
  }
  @Post('orders/:id/returns') requestReturn(@Req() r:any,@Param('id') id:string,@Body() d:D.ReturnRequestDto){return this.ordersSvc.requestReturn(r.user,id,d);}
  @Post('orders/:id/cancellation-requests') requestCancellation(@Req() r:any,@Param('id') id:string,@Body() d:D.CancellationRequestDto){return this.ordersSvc.requestCancellation(r.user,id,d.reason);}
  @Patch("orders/:id/status") status(
    @Req() r: any,
    @Param("id") id: string,
    @Body() d: D.StatusDto,
  ) {
    return this.ordersSvc.transition(r.user, id, d.status);
  }
}
