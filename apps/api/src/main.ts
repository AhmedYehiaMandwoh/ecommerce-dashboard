import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import express from "express";
import {resolve} from "node:path";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { Errors } from "./errors";
async function main() {
  if(process.env.OTP_MODE==='static-test'&&process.env.NODE_ENV==='production')throw Error('Static OTP is forbidden in production');
  const app = await NestFactory.create(AppModule,{bodyParser:false});
  app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
  app.use(express.json({limit:'2100kb'}));
  app.use('/api/media',express.static(resolve(process.env.MEDIA_DIR||'media'),{dotfiles:'deny',index:false,fallthrough:false,immutable:true,maxAge:'30d'}));
  app.useGlobalFilters(new Errors());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || "http://localhost:3000").split(","),
    credentials: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix("");
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 4000), "0.0.0.0");
  new Logger("Bootstrap").log("API running. Ordering is test-only.");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
