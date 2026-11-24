import "dotenv/config";
import { Db } from "../src/db";
import { hashPassword } from "../src/security";
async function main() {
  const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
  if (
    !ADMIN_EMAIL ||
    !ADMIN_NAME ||
    !ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < 14
  )
    throw Error(
      "Set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD (14+ characters), do not commit them",
    );
  const db = new Db();
  try {
    await db.user.create({
      data: {
        email: ADMIN_EMAIL.toLowerCase(),
        name: ADMIN_NAME,
        passwordHash: await hashPassword(ADMIN_PASSWORD),
        role: "ADMIN",
      },
    });
    console.log("Admin created.");
  } finally {
    await db.$disconnect();
  }
}
main();
