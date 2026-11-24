import { Controller, Get } from "@nestjs/common";
import { Db } from "../../db";

@Controller("api")
export class HealthController {
  constructor(private db: Db) {}
  @Get("health")
  async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { ok: true, checkout: "TEST_ONLY" };
  }
}
