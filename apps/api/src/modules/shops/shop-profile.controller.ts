import {
  BadRequestException, ConflictException, Controller, Delete, ForbiddenException, Get, Body, Param, Patch, Post, Req, Res,
  UploadedFile, UseGuards, UseInterceptors, NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import sharp from "sharp";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { Db } from "../../db";
import { AuthGuard, requireRole } from "../../security";
import * as D from "../../dto";

const MAX_PHOTOS = 6;
const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"];
const DOC_KINDS = ["REGISTRATION", "TAX", "ID", "OTHER"];
const DOC_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
// Photos are public (shown on the shop page). Documents are private: stored outside the public media folder and only readable by the applicant and admins.
const isDemo = () => process.env.NODE_ENV !== "production";
const mediaDir = () => resolve(process.env.MEDIA_DIR || "media");
const privateDir = () => resolve(process.env.PRIVATE_DOCS_DIR || "private-docs");

@Controller("api")
@UseGuards(AuthGuard)
export class ShopProfileController {
  constructor(private db: Db) {}

  private async pendingApplication(user: any) {
    const a = await this.db.shopApplication.findUnique({ where: { userId: user.id } });
    if (!a) throw new NotFoundException("No shop application");
    if (a.state === "APPROVED" || a.state === "SUSPENDED") throw new ConflictException("Application is closed; edit the shop profile instead");
    return a;
  }
  private async ownShop(user: any) {
    requireRole(user, "MERCHANT");
    const s = await this.db.shop.findFirst({ where: { ownerId: user.id } });
    if (!s) throw new NotFoundException("No shop");
    return s;
  }
  private async storePhoto(file: Express.Multer.File) {
    if (!file || !PHOTO_MIME.includes(file.mimetype)) throw new BadRequestException("Use JPEG, PNG or WebP under 5MB");
    let buffer: Buffer;
    try { buffer = await sharp(file.buffer, { limitInputPixels: 25000000 }).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(); }
    catch { throw new BadRequestException("Invalid image content"); }
    const name = randomUUID() + ".webp";
    await mkdir(mediaDir(), { recursive: true });
    await writeFile(join(mediaDir(), name), buffer, { flag: "wx" });
    return "/api/media/" + name;
  }
  private role(body: any) { return body?.role === "COVER" ? "COVER" : "GALLERY"; }
  private async addPhoto(where: { applicationId?: string; shopId?: string }, file: Express.Multer.File, body: any) {
    const count = await this.db.shopPhoto.count({ where });
    if (count >= MAX_PHOTOS) throw new BadRequestException("Up to " + MAX_PHOTOS + " photos");
    const url = await this.storePhoto(file);
    const role = this.role(body);
    if (role === "COVER") await this.db.shopPhoto.updateMany({ where: { ...where, role: "COVER" }, data: { role: "GALLERY" } });
    return this.db.shopPhoto.create({ data: { ...where, role, url, demo: isDemo() } });
  }

  @Patch("shop-application") async editApplication(@Req() r: any, @Body() d: D.ShopApplicationDto) {
    requireRole(r.user, "CUSTOMER");
    const a = await this.pendingApplication(r.user);
    return this.db.shopApplication.update({ where: { id: a.id }, data: { ...d, state: "PENDING" } });
  }
  @Post("shop-application/photos")
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: 5242880, files: 1 } }))
  async applicationPhoto(@Req() r: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    requireRole(r.user, "CUSTOMER");
    const a = await this.pendingApplication(r.user);
    return this.addPhoto({ applicationId: a.id }, file, body);
  }
  @Delete("shop-application/photos/:id") async deleteApplicationPhoto(@Req() r: any, @Param("id") id: string) {
    requireRole(r.user, "CUSTOMER");
    const a = await this.pendingApplication(r.user);
    const done = await this.db.shopPhoto.deleteMany({ where: { id, applicationId: a.id } });
    if (!done.count) throw new NotFoundException("Photo not found");
    return { deleted: true };
  }
  @Post("shop-application/documents")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5242880, files: 1 } }))
  async applicationDocument(@Req() r: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    requireRole(r.user, "CUSTOMER");
    const a = await this.pendingApplication(r.user);
    const kind = String(body?.kind || "");
    if (!DOC_KINDS.includes(kind)) throw new BadRequestException("Unknown document kind");
    if (!file || !DOC_MIME.includes(file.mimetype)) throw new BadRequestException("Use PDF, JPEG, PNG or WebP under 5MB");
    const head = file.buffer.subarray(0, 5).toString("latin1");
    const okMagic = file.mimetype === "application/pdf" ? head.startsWith("%PDF") : true;
    if (!okMagic) throw new BadRequestException("Invalid document content");
    if (file.mimetype !== "application/pdf") { try { await sharp(file.buffer, { limitInputPixels: 50000000 }).metadata(); } catch { throw new BadRequestException("Invalid image content"); } }
    const ext = file.mimetype === "application/pdf" ? ".pdf" : file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    const name = randomUUID() + ext;
    await mkdir(privateDir(), { recursive: true });
    await writeFile(join(privateDir(), name), file.buffer, { flag: "wx" });
    const old = await this.db.shopDocument.findMany({ where: { applicationId: a.id, kind } });
    for (const o of old) { await unlink(join(privateDir(), o.file)).catch(() => {}); }
    await this.db.shopDocument.deleteMany({ where: { applicationId: a.id, kind } });
    const original = (file.originalname || "document").replace(/[^\w.\- \u0600-\u06FF]/g, "_").slice(0, 120);
    const row = await this.db.shopDocument.create({ data: { applicationId: a.id, kind, file: name, originalName: original, mime: file.mimetype, size: file.size } });
    return { id: row.id, kind: row.kind, originalName: row.originalName, mime: row.mime, size: row.size, createdAt: row.createdAt };
  }
  @Delete("shop-application/documents/:id") async deleteApplicationDocument(@Req() r: any, @Param("id") id: string) {
    requireRole(r.user, "CUSTOMER");
    const a = await this.pendingApplication(r.user);
    const d = await this.db.shopDocument.findFirst({ where: { id, applicationId: a.id } });
    if (!d) throw new NotFoundException("Document not found");
    await this.db.shopDocument.delete({ where: { id } });
    await unlink(join(privateDir(), d.file)).catch(() => {});
    return { deleted: true };
  }
  // Private: only the applicant or an admin can read a submitted document.
  @Get("shop-documents/:id") async documentFile(@Req() r: any, @Param("id") id: string, @Res() res: any) {
    const d = await this.db.shopDocument.findUnique({ where: { id } });
    if (!d) throw new NotFoundException("Document not found");
    if (r.user.role !== "ADMIN") {
      const a = await this.db.shopApplication.findUnique({ where: { id: d.applicationId } });
      if (!a || a.userId !== r.user.id) throw new ForbiddenException("Not allowed");
    }
    const buf = await readFile(join(privateDir(), d.file));
    res.setHeader("Content-Type", d.mime);
    res.setHeader("Content-Disposition", "attachment");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(buf);
  }

  // Approved shop owner: public profile fields and photos.
  @Get("merchant/shop") async myShop(@Req() r: any) {
    const s = await this.ownShop(r.user);
    const photos = await this.db.shopPhoto.findMany({ where: { shopId: s.id }, orderBy: { createdAt: "asc" } });
    return { ...s, photos };
  }
  @Patch("merchant/shop") async editShop(@Req() r: any, @Body() d: D.ShopProfileDto) {
    const s = await this.ownShop(r.user);
    return this.db.shop.update({ where: { id: s.id }, data: d });
  }
  @Post("merchant/shop/photos")
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: 5242880, files: 1 } }))
  async shopPhoto(@Req() r: any, @UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const s = await this.ownShop(r.user);
    return this.addPhoto({ shopId: s.id }, file, body);
  }
  @Delete("merchant/shop/photos/:id") async deleteShopPhoto(@Req() r: any, @Param("id") id: string) {
    const s = await this.ownShop(r.user);
    const done = await this.db.shopPhoto.deleteMany({ where: { id, shopId: s.id } });
    if (!done.count) throw new NotFoundException("Photo not found");
    return { deleted: true };
  }
}
