import { describe, expect, it } from "vitest";
import { decrypt, encrypt, hashPassword, recipientToken, verifyPassword } from "@/lib/crypto";
import { fillTemplate } from "@/lib/letters";
import { normalisePhone } from "@/lib/format";
import { capacity, priceForPacks, slotsForPacks } from "@/lib/pricing";

describe("letter encryption", () => {
  it("round-trips unicode text", () => {
    const text = "प्रिय माँ,\nThe papers are in the steel almirah. ₹ and all.";
    const sealed = encrypt(text);
    expect(sealed).not.toContain("almirah");
    expect(decrypt(sealed)).toBe(text);
  });

  it("refuses tampered ciphertext", () => {
    const sealed = encrypt("hello");
    const parts = sealed.split(".");
    parts[3] = Buffer.from("jello").toString("base64url");
    expect(() => decrypt(parts.join("."))).toThrow();
  });
});

describe("passwords", () => {
  it("verifies the right password only", async () => {
    const hash = await hashPassword("a long enough secret");
    expect(await verifyPassword("a long enough secret", hash)).toBe(true);
    expect(await verifyPassword("a long enough secreT", hash)).toBe(false);
    expect(await verifyPassword("anything", "garbage")).toBe(false);
  });
});

describe("recipient tokens", () => {
  it("are stable for the same release and differ between releases", () => {
    const at = new Date("2026-03-01T00:00:00Z");
    expect(recipientToken("r1", at)).toBe(recipientToken("r1", at));
    expect(recipientToken("r1", at)).not.toBe(recipientToken("r2", at));
    expect(recipientToken("r1", at)).not.toBe(recipientToken("r1", new Date(at.getTime() + 1)));
  });
});

describe("templates", () => {
  it("fills names", () => {
    expect(fillTemplate("Dear {name}, love {my_name}. {name}!", { name: "Asha", myName: "Ravi" })).toBe("Dear Asha, love Ravi. Asha!");
  });
});

describe("phone numbers", () => {
  it("normalises Indian numbers and keeps international ones", () => {
    expect(normalisePhone("98123 45678")).toBe("+919812345678");
    expect(normalisePhone("098123-45678")).toBe("+919812345678");
    expect(normalisePhone("+44 7700 900123")).toBe("+447700900123");
    expect(normalisePhone("0044 7700 900123")).toBe("+447700900123");
    expect(normalisePhone("12")).toBeNull();
  });
});

describe("pricing", () => {
  it("gives 3 free and 20 per ₹20 pack", () => {
    expect(capacity(0)).toBe(3);
    expect(capacity(slotsForPacks(2))).toBe(43);
    expect(priceForPacks(2)).toBe(40);
  });
});
