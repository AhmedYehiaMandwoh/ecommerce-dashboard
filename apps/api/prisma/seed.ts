import "dotenv/config";
import { Db } from "../src/db";
import { hashPassword } from "../src/security";
async function main() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ALLOW_DEMO_SEED !== "true"
  )
    throw Error("Demo seed requires ALLOW_DEMO_SEED=true outside production");
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12)
    throw Error("Provide DEMO_PASSWORD, 12+ characters");
  const db = new Db();
  try {
    const hash = await hashPassword(password);
    for (const [email, name, role] of [
      ["admin@example.test", "إدارة تجريبية", "ADMIN"],
      ["merchant@example.test", "تاجر تجريبي", "MERCHANT"],
      ["customer@example.test", "عميل تجريبي", "CUSTOMER"],
    ] as const)
      await db.user.upsert({
        where: { email },
        create: { email, name, role, passwordHash: hash },
        update: { passwordHash: hash },
      });
    const owner = await db.user.findUniqueOrThrow({
      where: { email: "merchant@example.test" },
    });
    const shop = await db.shop.upsert({
      where: { id: "demo-shop" },
      create: {
        id: "demo-shop",
        name: "أوتو بارتس • متجر تجريبي",
        city: "القاهرة",
        ownerId: owner.id,
        approved: true,
      },
      update: {},
    });
    await db.discountCode.upsert({ where: { code: "GHIYAR10" }, create: { code: "GHIYAR10", percent: 10 }, update: {} });
    const examples = [
      [
        "BOSCH",
        "DEMO-BRAKE-01",
        "مجموعة ديسك وفرامل توضيحية",
        "فرامل",
        85000,
        "brakes",
      ],
      ["MANN", "DEMO-FILTER-02", "فلتر زيت محرك", "فلاتر", 24000, "filter"],
      ["DEMO", "DEMO-PLUG-03", "طقم بوجيهات", "كهرباء", 62000, "plug"],
      ["DEMO", "DEMO-OIL-04", "زيت محرك 5W-30 • ٤ لتر", "زيوت", 165000, "oil"],
      ["DEMO", "DEMO-SHOCK-05", "مساعد تعليق", "تعليق", 145000, "belt"],
      ["DEMO", "DEMO-PLUG-06", "بوجيه مفرد", "كهرباء", 18000, "plug"],
    ];
    for (const [brand, partNumber, title, category, price, asset] of examples) {
      const p = await db.product.upsert({
        where: {
          brand_partNumber: {
            brand: String(brand),
            partNumber: String(partNumber),
          },
        },
        create: {
          brand: String(brand),
          partNumber: String(partNumber),
          title: String(title),
          category: String(category),
          description:
            "منتج توضيحي لتجربة المنصة فقط. ليس عرض بيع حقيقي. لم يتم تأكيد توافقه مع أي سيارة.",
          approved: true,
          image: `/assets/${asset}.png`,
        },
        update: {},
      });
      if (!(await db.fitment.count({ where: { productId: p.id } })))
        await db.fitment.createMany({ data: [
          ["Toyota", "Corolla", 2014, 2022, "1.6L"], ["Hyundai", "Elantra", 2016, 2023, "1.6L"],
          ["Kia", "Cerato", 2014, 2021, "1.6L"], ["Nissan", "Sunny", 2013, 2022, "1.5L"],
        ].map(([make, model, fromYear, toYear, engine]) => ({ productId: p.id, make: String(make), model: String(model), fromYear: Number(fromYear), toYear: Number(toYear), engine: String(engine), verified: false })) });
      await db.offer.upsert({
        where: { shopId_sku: { shopId: shop.id, sku: String(partNumber) } },
        create: {
          shopId: shop.id,
          productId: p.id,
          sku: String(partNumber),
          price: Number(price),
          stock: 30,
        },
        update: {},
      });
    }
    console.log(
      "Seeded fictional catalog and example.test accounts. Password is the DEMO_PASSWORD you supplied.",
    );
  } finally {
    await db.$disconnect();
  }
}
main();
