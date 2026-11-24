import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, digest } from "../src/security";
import { normalizeItems, transitions } from "../src/market.service";
test("password hashing salts each password and rejects incorrect values", async () => {
  const a = await hashPassword("Temporary.Test.123");
  const b = await hashPassword("Temporary.Test.123");
  assert.notEqual(a, b);
  assert(await verifyPassword("Temporary.Test.123", a));
  assert.equal(await verifyPassword("wrong-password", a), false);
});
test("session token digest deterministic and not plaintext", () => {
  assert.equal(digest("abc"), digest("abc"));
  assert.notEqual(digest("abc"), "abc");
});
test("duplicate cart lines aggregate and reject over-limit quantities", () => {
  assert.deepEqual(
    normalizeItems([
      { offerId: "a", quantity: 2 },
      { offerId: "a", quantity: 3 },
    ]),
    [{ offerId: "a", quantity: 5 }],
  );
  assert.throws(() =>
    normalizeItems([
      { offerId: "a", quantity: 99 },
      { offerId: "a", quantity: 2 },
    ]),
  );
});
test("terminal statuses cannot transition, shipped cannot cancel", () => {
  assert.deepEqual(transitions.CANCELLED, []);
  assert.deepEqual(transitions.DELIVERED, []);
  assert(!transitions.SHIPPED.includes("CANCELLED"));
});
