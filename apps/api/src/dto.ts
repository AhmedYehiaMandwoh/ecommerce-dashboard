import { Type } from "class-transformer";
import {
  IsEmail,
  IsObject,
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsOptional,
  IsIn,
  IsBoolean,
  Matches,
} from "class-validator";
export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(10) @MaxLength(128) password!: string;
}
export class ChangePasswordDto {
  @IsString() @MinLength(10) @MaxLength(128) currentPassword!: string;
  @IsString() @MinLength(12) @MaxLength(128) newPassword!: string;
}
export class RegisterDto extends LoginDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
}
export class AddressDto {
  @IsString() @MaxLength(50) label!: string;
  @IsString() @MinLength(2) @MaxLength(80) city!: string;
  @IsString() @MinLength(8) @MaxLength(500) details!: string;
  @IsString() @Matches(/^\+?[0-9]{8,15}$/) phone!: string;
}
export class VehicleDto {
  @IsString() @MaxLength(60) make!: string;
  @IsString() @MaxLength(60) model!: string;
  @IsInt() @Min(1950) @Max(2100) year!: number;
  @IsString() @MaxLength(60) engine!: string;
}
export class ItemDto {
  @IsString() offerId!: string;
  @IsInt() @Min(1) @Max(100) quantity!: number;
}
export class DeliveryAreaDto {
 @IsString() @MinLength(2) @MaxLength(80) city!: string;
 @IsString() @MinLength(2) @MaxLength(120) area!: string;
 @IsInt() @Min(0) @Max(10000000) fee!: number;
 @IsBoolean() active!: boolean;
}
export class QuoteDto {
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({each:true}) @Type(()=>ItemDto) items!: ItemDto[];
 @IsString() addressId!: string;
 @IsString() deliveryAreaId!: string;
 @IsOptional() @IsString() @MaxLength(32) discountCode?: string;
}
export class CheckoutDto {
  @IsOptional() @IsString() deliveryAreaId?: string;
  @IsInt() @Min(1) @Max(2000000000) expectedTotal!: number;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items!: ItemDto[];
  @IsString() addressId!: string;
  @IsString() @MinLength(8) @MaxLength(80) requestKey!: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
export class ShopDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsString() @MinLength(2) @MaxLength(80) city!: string;
}
export class OfferDto {
  @IsString() productId!: string;
  @IsString() @MinLength(1) @MaxLength(100) sku!: string;
  @IsInt() @Min(1) @Max(100000000) price!: number;
  @IsInt() @Min(0) @Max(1000000) stock!: number;
}
export class OfferUpdateDto {
  @IsInt() @Min(1) @Max(100000000) price!: number;
  @IsInt() @Min(0) @Max(1000000) stock!: number;
  @IsBoolean() active!: boolean;
}
export class StatusDto {
  @IsIn(["ACCEPTED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"])
  status!: any;
  @IsOptional() @IsString() @Matches(/^[A-Za-z0-9\-_.\/ ]{3,40}$/) trackingNumber?: string;
}
export class ApprovalDto {
  @IsBoolean() approved!: boolean;
}
export class ProductDto {
  @IsString() @MinLength(1) @MaxLength(80) brand!: string;
  @IsString() @MinLength(1) @MaxLength(100) partNumber!: string;
  @IsString() @MinLength(2) @MaxLength(150) title!: string;
  @IsString() @MaxLength(80) category!: string;
  @IsString() @MaxLength(3000) description!: string;
}
export class ImportDto {
  @IsOptional() @IsString() @MaxLength(80) previewId?:string;
  @IsString() @MaxLength(2000000) csv!: string;
  @IsBoolean() commit!: boolean;
}

export class GroupCheckoutDto extends QuoteDto {
 @IsString() @MinLength(8) @MaxLength(80) requestKey!: string;
 @IsInt() @Min(1) @Max(2000000000) expectedTotal!: number;
 @IsOptional() @IsString() @MaxLength(500) note?: string;
}
export class CancellationRequestDto {
 @IsString() @MinLength(5) @MaxLength(180) reason!: string;
}
export class CancellationDecisionDto {
 @IsBoolean() approve!: boolean;
 @IsString() @MinLength(5) @MaxLength(180) reason!: string;
 @IsOptional() @IsInt() @Min(0) @Max(10000000) shippingRetained?: number;
}

export class ShippingSettlementDto {
 @IsInt() @Min(1) @Max(10000000) amount!: number;
 @IsIn(['REMITTANCE','OFFSET']) method!: string;
 @IsString() @MinLength(8) @MaxLength(120) reference!: string;
 @IsString() @MinLength(5) @MaxLength(180) note!: string;
}

export class ShopApplicationDto {
 @IsString() @MinLength(2) @MaxLength(100) name!: string;
 @IsString() @MinLength(2) @MaxLength(80) city!: string;
 @IsString() @MinLength(8) @MaxLength(180) address!: string;
 @IsString() @Matches(/^\+?[0-9]{8,15}$/) phone!: string;
 @IsString() @MinLength(10) @MaxLength(180) details!: string;
}
export class ShopApplicationDecisionDto {
 @IsBoolean() approve!: boolean;
 @IsString() @MinLength(5) @MaxLength(180) reason!: string;
}

export class StartPhoneDto {
 @IsString() @Matches(/^\+[1-9][0-9]{7,14}$/) phone!: string;
 @IsString() @MinLength(2) @MaxLength(80) deviceLabel!: string;
}
export class CheckPhoneDto {
 @IsString() @MaxLength(80) challengeId!: string;
 @IsString() @Matches(/^[0-9]{4,10}$/) code!: string;
 @IsString() @MinLength(2) @MaxLength(80) name!: string;
}
export class DeviceRefreshDto {
 @IsString() @Matches(/^[0-9a-f]{64}$/) deviceToken!: string;
}

export class PasskeyVerifyDto {
 @IsString() @MaxLength(80) challengeId!:string;
 @IsObject() response!:Record<string,any>;
}

export class ReturnItemDto {
 @IsString() orderItemId!:string;
 @IsInt() @Min(1) @Max(100) quantity!:number;
}
export class ReturnRequestDto {
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({each:true}) @Type(()=>ReturnItemDto) items!:ReturnItemDto[];
 @IsString() @MinLength(5) @MaxLength(180) reason!:string;
}
export class ReturnDecisionDto {
 @IsBoolean() approve!:boolean;
 @IsBoolean() goodsReceived!:boolean;
 @IsBoolean() restock!:boolean;
 @IsInt() @Min(0) @Max(100000000) refundAmount!:number;
 @IsString() @MinLength(5) @MaxLength(180) reason!:string;
}
export class RefundEvidenceDto {
 @IsString() @MinLength(8) @MaxLength(120) reference!:string;
 @IsString() @MinLength(5) @MaxLength(180) note!:string;
}

export class CatalogEditDto {
 @IsString() @MinLength(2) @MaxLength(150) title!:string;
 @IsString() @MinLength(1) @MaxLength(80) category!:string;
 @IsString() @MaxLength(3000) description!:string;
}
export class MerchantFitmentDto {
 @IsString() @MinLength(1) @MaxLength(60) make!:string;
 @IsString() @MinLength(1) @MaxLength(60) model!:string;
 @IsInt() @Min(1950) @Max(2100) fromYear!:number;
 @IsInt() @Min(1950) @Max(2100) toYear!:number;
 @IsString() @MinLength(1) @MaxLength(60) engine!:string;
}
export class FitmentDto {
 @IsString() @MinLength(1) @MaxLength(60) make!:string;
 @IsString() @MinLength(1) @MaxLength(60) model!:string;
 @IsInt() @Min(1950) @Max(2100) fromYear!:number;
 @IsInt() @Min(1950) @Max(2100) toYear!:number;
 @IsString() @MinLength(1) @MaxLength(60) engine!:string;
 @IsBoolean() verified!:boolean;
}

export class ProfileDto {
 @IsString() @MinLength(2) @MaxLength(80) name!:string;
}
export class TicketDto {
 @IsString() @MinLength(5) @MaxLength(120) subject!:string;
 @IsString() @MinLength(10) @MaxLength(2000) message!:string;
 @IsOptional() @IsString() @MaxLength(1600000) attachment?:string;
}
export class TicketReplyDto {
 @IsString() @MinLength(5) @MaxLength(2000) reply!:string;
 @IsIn(['OPEN','CLOSED']) state!:string;
}
