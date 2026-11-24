import {
  scrypt as scryptCallback,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Db } from "./db";
const scrypt = promisify(scryptCallback);
export async function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${((await scrypt(value, salt, 64)) as Buffer).toString("hex")}`;
}
export async function verifyPassword(value: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const actual = (await scrypt(value, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const digest = (v: string) =>
  createHash("sha256").update(v).digest("hex");
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private db: Db) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    if (!token) throw new UnauthorizedException();
    const s = await this.db.session.findUnique({
      where: { id: digest(token) },
      include: { user: true },
    });
    if (!s || s.expiresAt < new Date()) throw new UnauthorizedException();
    if(s.deviceId){const device=await this.db.deviceSession.findUnique({where:{id:s.deviceId}});if(!device||device.revokedAt||device.expiresAt<new Date())throw new UnauthorizedException();}
    req.user = {
      id: s.user.id,
      role: s.user.role,
      name: s.user.name,
      email: s.user.email,
      phone:s.user.phone,
    };
    return true;
  }
}
export function requireRole(user: any, ...roles: string[]) {
  if (!roles.includes(user.role)) throw new ForbiddenException();
}
