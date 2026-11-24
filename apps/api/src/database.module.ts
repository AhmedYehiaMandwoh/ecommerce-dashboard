import { Global, Module } from "@nestjs/common";
import { Db } from "./db";
import { AuthGuard } from "./security";

@Global()
@Module({ providers: [Db, AuthGuard], exports: [Db, AuthGuard] })
export class DatabaseModule {}
