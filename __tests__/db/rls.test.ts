import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  asAnon,
  asAuthenticated,
  connect,
  createAdminUser,
  createPlainUser,
  inRollback,
} from "./helpers/db";

/*
  ============================================================================
  RLS POLİTİKA TESTLERİ
  ============================================================================

  Bu testler POLİTİKANIN KENDİSİNİ sınar, uygulama filtresini değil: SQL
  doğrudan veritabanına gider, `lib/data/*` hiç devreye girmez. Veri katmanı
  `status = 'active'` yazmayı unutsa bile bu testler geçmelidir.

  Her test bir işlem içinde çalışır ve geri alınır.
  Çalıştırma: npm run test:db   (yerel Supabase ayakta olmalı)
*/

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await client?.end();
});

/** Durum taşıyan ana tablolar. */
const STATUS_TABLES = ["brands", "categories", "device_models", "products", "services"] as const;

/** Ürüne bağlı alt tablolar. */
const CHILD_TABLES = [
  "product_images",
  "product_specs",
  "product_compatibility",
  "product_marketplace_links",
] as const;

/** Test için tek bir aktif ürün ve bağlı kayıtlarını kurar. */
async function seedActiveProduct(c: Client, status = "active") {
  const brand = await c.query<{ id: string }>(
    `insert into public.brands (name, slug, status) values ('Test Marka', 'test-marka-rls', $1) returning id`,
    [status],
  );
  const category = await c.query<{ id: string }>(
    `insert into public.categories (name, slug, status) values ('Test Kategori', 'test-kategori-rls', $1) returning id`,
    [status],
  );
  const model = await c.query<{ id: string }>(
    `insert into public.device_models (brand_id, name, slug, status) values ($1, 'Test Model', 'test-model-rls', $2) returning id`,
    [brand.rows[0].id, status],
  );
  const product = await c.query<{ id: string }>(
    `insert into public.products (name, slug, brand_id, category_id, status)
     values ('Test Ürün', 'test-urun-rls', $1, $2, $3) returning id`,
    [brand.rows[0].id, category.rows[0].id, status],
  );

  const productId = product.rows[0].id;

  await c.query(
    `insert into public.product_images (product_id, storage_path, alt_text, is_primary)
     values ($1, 'test/gorsel.webp', 'Test görseli', true)`,
    [productId],
  );
  await c.query(
    `insert into public.product_specs (product_id, label, value) values ($1, 'Malzeme', 'Test')`,
    [productId],
  );
  await c.query(
    `insert into public.product_compatibility (product_id, device_model_id) values ($1, $2)`,
    [productId, model.rows[0].id],
  );
  await c.query(
    `insert into public.product_marketplace_links (product_id, marketplace, url, link_target)
     values ($1, 'amazon', 'https://example.com/x', 'product')`,
    [productId],
  );

  // services ürüne bağlı değildir ama STATUS_TABLES kapsamındadır.
  await c.query(
    `insert into public.services (name, slug, status) values ('Test Hizmet', 'test-hizmet-rls', $1)`,
    [status],
  );

  return { productId, brandId: brand.rows[0].id, modelId: model.rows[0].id };
}

describe("anonim okuma — yalnız 'active'", () => {
  it.each(["draft", "passive", "archived"])(
    "'%s' durumundaki satırlar anonime DÖNMEZ",
    async (status) => {
      await inRollback(client, async (c) => {
        await seedActiveProduct(c, status);

        for (const table of STATUS_TABLES) {
          const result = await asAnon(
            c,
            `select count(*)::int as n from public.${table} where slug like 'test-%-rls'`,
          );
          expect(result.rows[0].n, `${table} tablosunda ${status} satır sızdı`).toBe(0);
        }
      });
    },
  );

  it("'active' satırlar anonime DÖNER", async () => {
    await inRollback(client, async (c) => {
      await seedActiveProduct(c, "active");

      for (const table of STATUS_TABLES) {
        const result = await asAnon(
          c,
          `select count(*)::int as n from public.${table} where slug like 'test-%-rls'`,
        );
        expect(result.rows[0].n, `${table} aktif satırı görünmeli`).toBeGreaterThan(0);
      }
    });
  });
});

describe("alt tablolar ürünün durumunu miras alır", () => {
  it("ürün draft iken görsel/özellik/uyumluluk/pazaryeri satırları sızmaz", async () => {
    await inRollback(client, async (c) => {
      const { productId } = await seedActiveProduct(c, "draft");

      for (const table of CHILD_TABLES) {
        const result = await asAnon(
          c,
          `select count(*)::int as n from public.${table} where product_id = $1`,
          [productId],
        );
        expect(result.rows[0].n, `${table} draft ürünün satırını sızdırdı`).toBe(0);
      }
    });
  });

  it("ürün active olunca alt satırlar görünür", async () => {
    await inRollback(client, async (c) => {
      const { productId } = await seedActiveProduct(c, "active");

      for (const table of CHILD_TABLES) {
        const result = await asAnon(
          c,
          `select count(*)::int as n from public.${table} where product_id = $1`,
          [productId],
        );
        expect(result.rows[0].n, `${table} aktif ürünün satırını göstermeli`).toBe(1);
      }
    });
  });

  it("ürün active'den passive'e çekilince alt satırlar da kaybolur", async () => {
    await inRollback(client, async (c) => {
      const { productId } = await seedActiveProduct(c, "active");

      const before = await asAnon(
        c,
        `select count(*)::int as n from public.product_images where product_id = $1`,
        [productId],
      );
      expect(before.rows[0].n).toBe(1);

      await c.query(`update public.products set status = 'passive' where id = $1`, [productId]);

      const after = await asAnon(
        c,
        `select count(*)::int as n from public.product_images where product_id = $1`,
        [productId],
      );
      expect(after.rows[0].n).toBe(0);
    });
  });
});

describe("related_products — iki taraf da aktif olmalı", () => {
  it("karşı ürün draft ise ilişki dönmez", async () => {
    await inRollback(client, async (c) => {
      const { productId } = await seedActiveProduct(c, "active");
      const other = await c.query<{ id: string }>(
        `insert into public.products (name, slug, status) values ('Gizli', 'gizli-urun-rls', 'draft') returning id`,
      );
      await c.query(
        `insert into public.related_products (product_id, related_product_id) values ($1, $2)`,
        [productId, other.rows[0].id],
      );

      const result = await asAnon(
        c,
        `select count(*)::int as n from public.related_products where product_id = $1`,
        [productId],
      );
      expect(result.rows[0].n).toBe(0);
    });
  });
});

describe("site_settings", () => {
  it("anonim role tamamen okunabilir (sır saklanmaz)", async () => {
    await inRollback(client, async (c) => {
      const result = await asAnon(c, `select count(*)::int as n from public.site_settings`);
      expect(result.rows[0].n).toBeGreaterThan(0);
    });
  });
});

describe("anonim YAZMA tamamen kapalı", () => {
  it.each([
    ["insert", `insert into public.products (name, slug) values ('Saldiri', 'saldiri-rls')`],
    ["update", `update public.products set name = 'Degisti' where slug = 'test-urun-rls'`],
    ["delete", `delete from public.products where slug = 'test-urun-rls'`],
  ])("anonim %s reddedilir", async (_label, sql) => {
    await inRollback(client, async (c) => {
      await seedActiveProduct(c, "active");
      await expect(asAnon(c, sql)).rejects.toThrow();
    });
  });
});

describe("yönetici olmayan authenticated kullanıcı yazamaz", () => {
  it("insert RLS tarafından reddedilir", async () => {
    await inRollback(client, async (c) => {
      const userId = await createPlainUser(c);
      await expect(
        asAuthenticated(
          c,
          userId,
          `insert into public.products (name, slug) values ('Yetkisiz', 'yetkisiz-rls')`,
        ),
      ).rejects.toThrow(/row-level security/i);
    });
  });

  it("draft satırları okuyamaz", async () => {
    await inRollback(client, async (c) => {
      const userId = await createPlainUser(c);
      await seedActiveProduct(c, "draft");

      const result = await asAuthenticated(
        c,
        userId,
        `select count(*)::int as n from public.products where slug = 'test-urun-rls'`,
      );
      expect(result.rows[0].n).toBe(0);
    });
  });
});

describe("yönetici tam yetkili", () => {
  it("yazabilir ve draft satırları okuyabilir", async () => {
    await inRollback(client, async (c) => {
      const adminId = await createAdminUser(c);
      await seedActiveProduct(c, "draft");

      const read = await asAuthenticated(
        c,
        adminId,
        `select count(*)::int as n from public.products where slug = 'test-urun-rls'`,
      );
      expect(read.rows[0].n, "yönetici draft ürünü görmeli").toBe(1);

      const write = await asAuthenticated(
        c,
        adminId,
        `insert into public.products (name, slug) values ('Yonetici Urunu', 'yonetici-urunu-rls') returning id`,
      );
      expect(write.rowCount).toBe(1);
    });
  });
});

describe("tohum verisi anonime tamamen kapalı", () => {
  it("seed'deki hiçbir demo satır anonime görünmez", async () => {
    // İşlem İÇİNDE olmalı: `set local role` işlem dışında etkisizdir ve test
    // yanlış nedenle (postgres rolüyle, RLS atlanarak) geçerdi.
    await inRollback(client, async (c) => {
      for (const table of STATUS_TABLES) {
        const result = await asAnon(
          c,
          `select count(*)::int as n from public.${table} where is_demo = true`,
        );
        expect(result.rows[0].n, `${table} demo satırı sızdırdı`).toBe(0);
      }
    });
  });

  it("demo satırlar veritabanında GERÇEKTEN var (test yanlış nedenle geçmiyor)", async () => {
    const result = await client.query<{ n: number }>(
      `select count(*)::int as n from public.products where is_demo = true`,
    );
    expect(result.rows[0].n).toBeGreaterThan(0);
  });
});

describe("admin_users — yetki yükseltme yüzeyi", () => {
  /*
    Bu tablo yetki yükseltmenin tek kapısıdır, bu yüzden diğerlerinden DAHA DAR
    korunur. İki bağımsız hat olmalıdır:
      1. Grant hattı — anon'un tabloda hiçbir hakkı yok.
      2. RLS hattı  — insert politikası yok, satır yazılamaz.

    Denetimde bulunan durum: tablo yalnız 2. hatta korunuyordu (Supabase'in
    varsayılan yetkileri anon'a insert/update/delete vermiş, RLS migrasyonundaki
    revoke döngüsü bu tabloyu kapsamıyordu). Sömürülebilir değildi ama biri
    ileride dikkatsiz bir politika eklerse grant hazır bekliyordu.
  */

  it("anon'un admin_users üzerinde HİÇBİR yetkisi yoktur (grant hattı)", async () => {
    const result = await client.query<{ privilege_type: string }>(
      `select privilege_type from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'admin_users' and grantee = 'anon'`,
    );
    expect(result.rows.map((r) => r.privilege_type)).toEqual([]);
  });

  it("authenticated YALNIZ select alır — insert/update/delete verilmez", async () => {
    const result = await client.query<{ privilege_type: string }>(
      `select privilege_type from information_schema.role_table_grants
        where table_schema = 'public' and table_name = 'admin_users'
          and grantee = 'authenticated'`,
    );
    expect(result.rows.map((r) => r.privilege_type).sort()).toEqual(["SELECT"]);
  });

  it("force row level security açıktır (tablo sahibi de RLS'e tabidir)", async () => {
    const result = await client.query<{ forced: boolean }>(
      `select c.relforcerowsecurity as forced
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'admin_users'`,
    );
    expect(result.rows[0].forced).toBe(true);
  });

  it("yönetici OLMAYAN bir kullanıcı kendini yönetici yapamaz", async () => {
    await inRollback(client, async (c) => {
      const userId = await createPlainUser(c);
      await expect(
        asAuthenticated(
          c,
          userId,
          `insert into public.admin_users (user_id, email) values ($1, 'saldirgan@ornek.com')`,
          [userId],
        ),
      ).rejects.toThrow();
    });
  });

  it("anonim kullanıcı yönetici listesini OKUYAMAZ", async () => {
    await inRollback(client, async (c) => {
      await createAdminUser(c);
      // Grant hattı devrede: sorgu yetki hatasıyla düşmeli.
      await expect(asAnon(c, "select * from public.admin_users")).rejects.toThrow();
    });
  });
});
