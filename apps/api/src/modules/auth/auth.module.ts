import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AccountController } from "./account.controller";
import { AuthService } from "./auth.service";
import { PhoneAuthService } from "./phone-auth.service";
import { PasskeyService } from "./passkey.service";

@Module({
  controllers: [AuthController, AccountController],
  providers: [AuthService, PhoneAuthService, PasskeyService],
  exports: [AuthService],
})
export class AuthModule {}
