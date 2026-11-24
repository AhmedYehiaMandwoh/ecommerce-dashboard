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

export const publicUser = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});

@Injectable()
export class AuthService {
  constructor(private db: Db) {}
  async session(user: any) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 12 * 3600000);
    await this.db.session.create({
      data: { id: digest(token), userId: user.id, expiresAt },
    });
    return { token, expiresAt, user: publicUser(user) };
  }
  async register(data: any) {
    const email = data.email.trim().toLowerCase();
    const passwordHash = await hashPassword(data.password);
    try {
      return this.session(
        await this.db.user.create({
          data: {
            email,
            name: data.name.trim(),
            passwordHash,
            role: "CUSTOMER",
          },
        }),
      );
    } catch (e: any) {
      if (e.code === "P2002")
        throw new ConflictException("Email already registered");
      throw e;
    }
  }
  async login(data: any) {
    const u = await this.db.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });
    const valid = await verifyPassword(
      data.password,
      u?.passwordHash || "00000000000000000000000000000000:" + "00".repeat(64),
    );
    if (!u || !valid) throw new UnauthorizedException("Invalid login");
    return this.session(u);
  }
  async changePassword(user: any, data: {currentPassword: string; newPassword: string}) {
    const account = await this.db.user.findUniqueOrThrow({where:{id:user.id}});
    if (!await verifyPassword(data.currentPassword,account.passwordHash||'')) throw new UnauthorizedException("Current password is incorrect");
    if (data.currentPassword===data.newPassword) throw new BadRequestException("Choose a different password");
    const passwordHash=await hashPassword(data.newPassword);
    await this.db.$transaction(async tx=>{
      const updated=await tx.user.updateMany({where:{id:user.id,passwordHash:account.passwordHash},data:{passwordHash}});
      if(updated.count!==1)throw new ConflictException("Account changed, sign in again");
      await tx.session.deleteMany({where:{userId:user.id}});
      await tx.deviceSession.updateMany({where:{userId:user.id,revokedAt:null},data:{revokedAt:new Date()}});
    });
    return {ok:true,signInRequired:true};
  }
}
