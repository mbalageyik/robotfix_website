import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  .env.example bir ŞABLONDUR. İçinde gerçek anahtar bulunması, sırların git'e sızması demektir.
  Bu test her sır alanının BOŞ kaldığını doğrular — kazara doldurulup commit edilmesini engeller.
*/

const envExample = readFileSync(fileURLToPath(new URL("../.env.example", import.meta.url)), "utf8");

/** `KEY=value` satırlarını ayrıştırır; yorum ve boş satırları atlar. */
function parseEnv(source: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    entries.set(trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim());
  }
  return entries;
}

/** Değeri asla şablonda bulunmaması gereken alanlar. */
const SECRET_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
];

describe(".env.example", () => {
  const env = parseEnv(envExample);

  it("beklenen tüm anahtarları tanımlar", () => {
    for (const key of [...SECRET_KEYS, "NEXT_PUBLIC_SITE_URL"]) {
      expect(env.has(key), `${key} .env.example içinde tanımlı olmalı`).toBe(true);
    }
  });

  it.each(SECRET_KEYS)("%s değerini boş bırakır", (key) => {
    expect(env.get(key)).toBe("");
  });

  it("servis rol anahtarını tarayıcıya açmaz", () => {
    expect(envExample).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("hiçbir alan JWT benzeri gerçek anahtar içermez", () => {
    // Supabase anahtarları `eyJ...` (JWT) veya `sb_...` biçimindedir.
    expect(envExample).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
    expect(envExample).not.toMatch(/\bsb_(publishable|secret)_[A-Za-z0-9_-]{10,}/);
  });

  it("gerçek Postgres bağlantı dizesi içermez", () => {
    expect(envExample).not.toMatch(/postgres(ql)?:\/\/[^\s]+/);
  });

  it("demo ürün bayrağı tanımlı ve üretimde kapatılması gerektiği yazılı", () => {
    expect(env.has("NEXT_PUBLIC_SHOW_DEMO_PRODUCTS")).toBe(true);
    expect(envExample).toMatch(/[Üü]retimde/);
  });
});
