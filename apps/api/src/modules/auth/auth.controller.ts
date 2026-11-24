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
import { PasskeyService } from "./passkey.service";
import { PhoneAuthService } from "./phone-auth.service";
import { AuthService } from "./auth.service";

@Controller("api")
export class AuthController {
  constructor(
    private phoneAuth: PhoneAuthService,
    private passkeys: PasskeyService,
    private authSvc: AuthService,
  ) {}
  @Post('auth/passkeys/login/options') passkeyOptions(){return this.passkeys.loginOptions();}
  @Post('auth/passkeys/login/verify') passkeyLogin(@Body() d:D.PasskeyVerifyDto){return this.passkeys.login(d);}
  @Post('auth/phone/start') startPhone(@Body() d:D.StartPhoneDto){return this.phoneAuth.start(d);}
  @Post('auth/phone/check') checkPhone(@Body() d:D.CheckPhoneDto){return this.phoneAuth.check(d);}
  @Post('auth/device/refresh') refreshDevice(@Body() d:D.DeviceRefreshDto){return this.phoneAuth.refresh(d.deviceToken);}
  @Post("auth/register") register(@Body() d: D.RegisterDto) {
    return this.authSvc.register(d);
  }
  @Post("auth/login") login(@Body() d: D.LoginDto) {
    return this.authSvc.login(d);
  }
}
