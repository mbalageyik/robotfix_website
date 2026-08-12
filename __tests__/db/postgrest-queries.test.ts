import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Client } from "pg";
import { connect } from "./helpers/db";
import { getProductBySlug, getRelatedProducts, listProducts } from "@/lib/data/products";

/*
  PostgREST SORGU ANLAMI testleri.

  NEDEN AYRI BİR DOSYA: `rls.test.ts` doğrudan Postgres'e bağlanır ve SQL
  düzeyinde politika davranışını ölçer. Ama veri katmanı Postgres'e değil
  PostgREST'e konuşur; ikisinin sorgu anlamı AYNI DEĞİLDİR.

  Somut örnek (bu dosyanın var oluş sebebi): gömülü kaynağa yazılan
  `.eq('categories.slug', x)` filtresi SQL sezgisinin aksine üst satırları
  ELEMEZ — gömme `!inner` olmadıkça yalnız gömülü nesneyi `null` yapar.
  Sorgu tüm ürünleri döndürür ve sayaç yanlış olur. Doğrudan Postgres'e
  bakan bir test bunu ASLA yakalayamaz.

  Bu testler anon anahtarıyla, gerçek HTTP üzerinden gider.
*/

const configured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const FILTRE_KATEGORI = "ornek-filtreler";
const ROBOROCK = "roborock";

let client: Client;

/*
  Anon istemci yalnız `active` satırları görür; tohum verisi ise `draft`'tır.
  Bu yüzden testler süresince demo satırlar geçici olarak yayına alınır ve
  SONUNDA MUTLAKA geri çekilir (afterAll test patlasa da çalışır).

  Aynı korumayı dev_activate_demo.sql da uygular: veritabanında gerçek
  (demo olmayan) katalog satırı varsa bu testler çalıştırılmaz.
*/
async function setDemoStatus(status: "active" | "draft"): Promise<void> {
  for (const table of ["brands", "categories", "device_models", "products", "services"]) {
    await client.query(`update public.${table} set status = $1 where is_demo`, [status]);
  }
}

beforeAll(async () => {
  client = await connect();

  const { rows } = await client.query<{ real_rows: string }>(
    `select (
       (select count(*) from public.products   where not is_demo) +
       (select count(*) from public.brands     where not is_demo) +
       (select count(*) from public.categories where not is_demo) +
       (select count(*) from public.services   where not is_demo)
     )::text as real_rows`,
  );

  if (Number(rows[0].real_rows) > 0) {
    throw new Error(
      `Bu testler yalnız demo veri içeren YEREL bir veritabanında çalışır; ` +
        `${rows[0].real_rows} adet gerçek katalog satırı bulundu. Testler durduruldu.`,
    );
  }

  await setDemoStatus("active");
});

afterAll(async () => {
  // Sızıntı önleme: demo veri hiçbir koşulda yayında bırakılmaz.
  if (client) {
    await setDemoStatus("draft");
    await client.end();
  }
});

describe.skipIf(!configured)("PostgREST sorgu anlamı", () => {
  it("kategori filtresi ÜST satırları eler (gömülü filtre tuzağı)", async () => {
    const all = await listProducts({});
    const filtered = await listProducts({ categorySlug: FILTRE_KATEGORI });

    expect(all.ok).toBe(true);
    expect(filtered.ok).toBe(true);
    if (!all.ok || !filtered.ok) return;

    // Regresyon çıpası: filtre uygulanmazsa bu sayı tüm ürünlere eşit olurdu.
    expect(filtered.data.items.length).toBeLessThan(all.data.items.length);
    expect(filtered.data.items.length).toBeGreaterThan(0);

    for (const item of filtered.data.items) {
      expect(item.category?.slug).toBe(FILTRE_KATEGORI);
    }
  });

  it("kategori filtresinde `total` sayacı da filtrelenmiş olur", async () => {
    const all = await listProducts({});
    const filtered = await listProducts({ categorySlug: FILTRE_KATEGORI });
    if (!all.ok || !filtered.ok) throw new Error("sorgu başarısız");

    expect(filtered.data.total).toBe(filtered.data.items.length);
    expect(filtered.data.total).toBeLessThan(all.data.total);
  });

  it("marka filtresi ÜST satırları eler", async () => {
    const filtered = await listProducts({ brandSlug: ROBOROCK });
    expect(filtered.ok).toBe(true);
    if (!filtered.ok) return;

    expect(filtered.data.items.length).toBeGreaterThan(0);
    for (const item of filtered.data.items) {
      expect(item.brand?.slug).toBe(ROBOROCK);
    }
  });

  it("filtre YOKKEN markasız/kategorisiz ürünler listeden düşmez", async () => {
    // `!inner` yalnız filtre varken uygulanmalı; aksi hâlde bu sayı azalırdı.
    const all = await listProducts({}, "manual", { perPage: 100 });
    if (!all.ok) throw new Error("sorgu başarısız");

    const { rows } = await client.query<{ count: string }>(
      "select count(*)::text as count from public.products where is_demo",
    );
    expect(all.data.total).toBe(Number(rows[0].count));
  });

  it("bulunabilirlik filtresi yalnız istenen durumu döndürür", async () => {
    const result = await listProducts({ availability: ["out_of_stock"] });
    if (!result.ok) throw new Error("sorgu başarısız");

    expect(result.data.items.length).toBeGreaterThan(0);
    for (const item of result.data.items) {
      expect(item.availability).toBe("out_of_stock");
    }
  });

  it("eşleşmeyen arama HATA değil, boş sonuç döner", async () => {
    const result = await listProducts({ search: "zzzz-eslesmeyen-arama-zzzz" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);
    expect(result.data.total).toBe(0);
  });

  it("var olmayan sütun sessizce yutulmaz — ok:false döner", async () => {
    // `DataResult` sözleşmesinin canlı kanıtı: hata boş diziye çevrilmez.
    const result = await getProductBySlug("kesinlikle-olmayan-bir-slug");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("not_found");
  });

  it("fiyatsız ürünler fiyat sıralamasında SONA gider", async () => {
    // Tohum verisinin tamamı fiyatsız olduğundan sıralama ancak geçici bir
    // fiyatla ölçülebilir. Fiyat testin sonunda NULL'a geri çekilir.
    await client.query(
      `update public.products set price_minor = 9900
       where is_demo and slug = 'ornek-su-haznesi'`,
    );

    try {
      const asc = await listProducts({}, "price_asc", { perPage: 100 });
      if (!asc.ok) throw new Error("sorgu başarısız");

      const prices = asc.data.items.map((item) => item.priceMinor);
      const firstNullIndex = prices.indexOf(null);
      const lastPricedIndex = prices.map((p) => p !== null).lastIndexOf(true);

      expect(prices[0]).toBe(9900);
      expect(lastPricedIndex).toBeLessThan(firstNullIndex);
    } finally {
      await client.query(
        `update public.products set price_minor = null
         where is_demo and slug = 'ornek-su-haznesi'`,
      );
    }
  });

  it("elle seçilmiş ilgili ürünler yöneticinin SIRASINI korur", async () => {
    const product = await getProductBySlug("ornek-ana-firca-modulu");
    if (!product.ok) throw new Error("ürün bulunamadı");

    const related = await getRelatedProducts(product.data.id, product.data.category?.slug ?? null);
    if (!related.ok) throw new Error("ilgili ürün sorgusu başarısız");

    const { rows } = await client.query<{ slug: string }>(
      `select p2.slug
         from public.related_products rp
         join public.products p2 on p2.id = rp.related_product_id
        where rp.product_id = $1
        order by rp.display_order`,
      [product.data.id],
    );

    expect(related.data.map((item) => item.slug)).toEqual(rows.map((row) => row.slug));
  });

  it("elle ilişkisi olmayan ürünün ilgili ürünleri AYNI kategoriden türetilir", async () => {
    const product = await getProductBySlug("ornek-hepa-filtre");
    if (!product.ok) throw new Error("ürün bulunamadı");

    const related = await getRelatedProducts(product.data.id, product.data.category?.slug ?? null);
    if (!related.ok) throw new Error("ilgili ürün sorgusu başarısız");

    expect(related.data.length).toBeGreaterThan(0);
    for (const item of related.data) {
      expect(item.category?.slug).toBe(product.data.category?.slug);
      // Ürün kendini önermez.
      expect(item.id).not.toBe(product.data.id);
    }
  });

  it("ana görsel `is_primary` ile seçilir, yoksa ilk görsele düşer", async () => {
    const withPrimary = await getProductBySlug("ornek-ana-firca-modulu");
    if (!withPrimary.ok) throw new Error("ürün bulunamadı");
    expect(withPrimary.data.primaryImage?.storagePath).toBe("demo/yer-tutucu/ana-firca-1.webp");
    // Görseller display_order'a göre sıralanmalı (tohumda karışık girilmiştir).
    expect(withPrimary.data.images.map((i) => i.storagePath)).toEqual([
      "demo/yer-tutucu/ana-firca-1.webp",
      "demo/yer-tutucu/ana-firca-2.webp",
      "demo/yer-tutucu/ana-firca-3.webp",
    ]);

    const noPrimary = await getProductBySlug("ornek-lityum-batarya");
    if (!noPrimary.ok) throw new Error("ürün bulunamadı");
    expect(noPrimary.data.images.length).toBeGreaterThan(0);
    expect(noPrimary.data.primaryImage).not.toBeNull();

    const noImages = await getProductBySlug("ornek-hepa-filtre");
    if (!noImages.ok) throw new Error("ürün bulunamadı");
    expect(noImages.data.images).toHaveLength(0);
    expect(noImages.data.primaryImage).toBeNull();
  });

  it("pasif pazaryeri bağlantısı hiç dönmez", async () => {
    const product = await getProductBySlug("ornek-ana-firca-modulu");
    if (!product.ok) throw new Error("ürün bulunamadı");

    await client.query(
      `update public.product_marketplace_links set is_active = false
        where product_id = $1`,
      [product.data.id],
    );

    try {
      const again = await getProductBySlug("ornek-ana-firca-modulu");
      if (!again.ok) throw new Error("ürün bulunamadı");
      expect(again.data.marketplaceLinks).toHaveLength(0);
    } finally {
      await client.query(
        `update public.product_marketplace_links set is_active = true
          where product_id = $1`,
        [product.data.id],
      );
    }
  });
});
