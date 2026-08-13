import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PRODUCT_IMAGE_BUCKET,
  buildImagePath,
  extensionForMimeType,
  publicImageUrl,
} from "@/lib/admin/storage";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, validateImageFile } from "@/lib/admin/schemas";

const root = fileURLToPath(new URL("../..", import.meta.url));
const migration = readFileSync(
  join(root, "supabase/migrations/20260812000400_storage.sql"),
  "utf8",
);

/*
  Storage sözleşmesi testleri.

  Kova adı, boyut sınırı ve izinli MIME türleri İKİ YERDE yazılıdır: migrasyonda
  (Storage API'sinin uyguladığı gerçek kısıt) ve TypeScript'te (kullanıcıya
  anlaşılır mesaj veren katman). İkisi ayrışırsa panel bir dosyayı kabul eder,
  Storage reddeder ve kullanıcı sebebini anlamayan bir hata görür. Aşağıdaki
  testler bu ayrışmayı imkânsız kılar.
*/

describe("kova sözleşmesi kod ve migrasyon arasında aynı", () => {
  it("kova adı eşleşir", () => {
    expect(migration).toContain(`'${PRODUCT_IMAGE_BUCKET}'`);
  });

  it("boyut sınırı eşleşir", () => {
    expect(migration).toContain(String(MAX_IMAGE_BYTES));
  });

  it("izinli MIME türleri eşleşir", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      expect(migration, `${type} migrasyonda da izinli olmalı`).toContain(`'${type}'`);
    }
  });

  it("okuma herkese açık, yazma yalnız yöneticiye", () => {
    expect(migration).toMatch(/for select/);
    // Üç yazma fiilinin üçü de is_admin() ile korunur.
    const writePolicies = migration.match(/for (insert|update|delete)/g) ?? [];
    expect(writePolicies).toHaveLength(3);
    expect(migration.match(/is_admin\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });
});

describe("yol üretimi kullanıcı girdisi taşımaz", () => {
  /*
    Dosya adı saldırgan girdisidir: yol geçişi (`../`), Unicode hileleri ve çok
    uzun adlar taşır. Yol tamamen bizim ürettiğimiz değerlerden kurulur.
  */
  it("ürettiği yol yalnız ürün kimliği, UUID ve uzantı içerir", () => {
    const path = buildImagePath("11111111-2222-3333-4444-555555555555", "image/png");
    expect(path).toMatch(
      /^products\/11111111-2222-3333-4444-555555555555\/[0-9a-f-]{36}\.png$/,
    );
  });

  it("aynı ürün için iki çağrı farklı yol üretir", () => {
    const a = buildImagePath("abc", "image/webp");
    const b = buildImagePath("abc", "image/webp");
    expect(a).not.toBe(b);
  });

  it("bilinmeyen MIME türü tahmin edilmez", () => {
    expect(extensionForMimeType("application/x-msdownload")).toBe("bin");
  });

  it("izinli her tür için bir uzantı vardır", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      expect(extensionForMimeType(type)).not.toBe("bin");
    }
  });
});

describe("herkese açık URL", () => {
  it("kova adını içerir ve public yolu kullanır", () => {
    const url = publicImageUrl("https://example.supabase.co", "products/a/b.webp");
    expect(url).toBe(
      `https://example.supabase.co/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/products/a/b.webp`,
    );
  });
});

describe("dosya doğrulaması", () => {
  function fakeFile(size: number, type: string): File {
    // Gerçek içerik üretmeden boyut/tür beyanını taklit eder.
    const file = new File([""], "deneme", { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  }

  it("boş dosya reddedilir", () => {
    expect(validateImageFile(fakeFile(0, "image/png")).ok).toBe(false);
  });

  it("sınırın üstündeki dosya reddedilir", () => {
    const result = validateImageFile(fakeFile(MAX_IMAGE_BYTES + 1, "image/png"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/MB/);
  });

  it("sınırdaki dosya kabul edilir", () => {
    expect(validateImageFile(fakeFile(MAX_IMAGE_BYTES, "image/png")).ok).toBe(true);
  });

  it("izinsiz tür reddedilir", () => {
    expect(validateImageFile(fakeFile(1000, "image/gif")).ok).toBe(false);
    expect(validateImageFile(fakeFile(1000, "application/pdf")).ok).toBe(false);
  });

  it("izinli türlerin hepsi kabul edilir", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      expect(validateImageFile(fakeFile(1000, type)).ok, type).toBe(true);
    }
  });
});
