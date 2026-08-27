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

  Bu dosya veritabanını DEĞİŞTİRİR (durum, fiyat, pazaryeri bayrağı). Bu
  yüzden nereye bağlandığını doğrulamadan çalışmaz — koruma aşağıda,
  `beforeAll` içinde.
*/
async function setDemoStatus(status: "active" | "draft"): Promise<void> {
  for (const table of ["brands", "categories", "device_models", "products", "services"]) {
    await client.query(`update public.${table} set status = $1 where is_demo`, [status]);
  }
}

beforeAll(async () => {
  client = await connect();

  /*
    1. KATMAN: bağlantı YEREL mi?

    Bu süit veritabanına YAZAR (`setDemoStatus`, geçici fiyat güncellemesi).
    `SUPABASE_DB_URL` dışarıdan verilebildiği için önce nereye bağlandığımıza
    bakılır. Aynı kontrol `supabase/dev_upload_demo_images.sh` içinde de var.

    Bu katman olmadan aşağıdaki yönetici kontrolü FAIL-OPEN olurdu: yönetici
    tablosu henüz doldurulmamış uzak bir veritabanı kontrolden geçer ve süit
    oraya yazmaya başlardı.
  */
  const dbUrl = process.env.SUPABASE_DB_URL ?? "";
  const host = (() => {
    try {
      return new URL(dbUrl).hostname;
    } catch {
      return "";
    }
  })();

  if (!["127.0.0.1", "localhost", "0.0.0.0", "::1"].includes(host)) {
    throw new Error(
      `Bu testler veritabanını DEĞİŞTİRİR ve yalnız YEREL yığında çalışır; ` +
        `SUPABASE_DB_URL yerel olmayan bir adrese işaret ediyor (${host || "çözümlenemedi"}). ` +
        `Testler durduruldu.`,
    );
  }

  /*
    2. KATMAN: burası gerçek bir kurulum mu?

    ÖNCEKİ ÖLÇÜT ÇÜRÜKTÜ. Eskiden "demo olmayan tek bir katalog satırı varsa
    dur" deniyordu. Bu ölçüt yalnız bugünü değil GELECEĞİ de kapatıyordu:
    işletme panelden ilk gerçek ürününü girdiği an bu süit bir daha hiç
    çalışmayacaktı. Oysa katalog dolduktan sonra sorgu anlamını doğrulamak
    daha da önemli hâle gelir.

    Doğru soru "veritabanı dolu mu" değil, "burası gerçek bir kurulum mu".
    Yerel yığında `dev_create_admin.sql` her zaman `...@robotfix.local`
    üretir; gerçek bir kurulumda yönetici e-postası gerçektir. Aynı ölçüt
    `supabase/dev_activate_demo.sql` içinde de kullanılır — iki yerin aynı
    soruyu sorması bilinçlidir.
  */
  const { rows } = await client.query<{ foreign_admins: string }>(
    `select count(*)::text as foreign_admins
       from public.admin_users
      where email is null or email not like '%.local'`,
  );

  if (Number(rows[0].foreign_admins) > 0) {
    throw new Error(
      `Bu testler veritabanını DEĞİŞTİRİR ve yalnız yerel geliştirme yığınında ` +
        `çalışır; ${rows[0].foreign_admins} adet yerel olmayan yönetici hesabı ` +
        `bulundu. Testler durduruldu.`,
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

    /*
      Beklenen sayı ANON İSTEMCİNİN GÖREBİLDİĞİ ürünlerdir, yalnız demo
      satırlar değil. İkisi eskiden aynı şeydi; geliştirici panelden bir ürün
      oluşturur oluşturmaz ayrıldılar ve test kırılıyordu — oysa ölçtüğü şey
      hiç bozulmamıştı.

      `status = 'active'` tam olarak RLS'in anonime açtığı kümedir. Regresyon
      çıpası korunur: `!inner` filtresiz sorguya sızarsa markasız/kategorisiz
      satırlar düşer ve bu sayı tutmaz.
    */
    const { rows } = await client.query<{ count: string }>(
      "select count(*)::text as count from public.products where status = 'active'",
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

  it("SON SAYFANIN ÖTESİ hata değil, doğru toplamlı boş sayfadır", async () => {
    /*
      REGRESYON ÇIPASI (canlı gözlenen hata).

      PostgREST, OFFSET satır sayısını aşınca 416/PGRST103 döner. Eskiden bu
      `query_failed` sayılıyor ve katalog sayfası "Ürünler şu anda
      listelenemiyor" alarmını basıyordu — veritabanı gayet sağlıklıyken.
      8 ürünlü katalogda `?sayfa=2` yazmak yetiyordu.

      Bu durum bir ARIZA DEĞİLDİR: yer imi, arama motoru veya sayfa açıkken
      katalogdan ürün çıkarılması bunu üretir. Beklenen cevap boş bir liste,
      ama DOĞRU `total` ve `pageCount` ile — arayüz kullanıcıyı geri
      yönlendirebilsin diye.
    */
    const firstPage = await listProducts({}, "manual", { perPage: 2, page: 1 });
    if (!firstPage.ok) throw new Error("sorgu başarısız");
    expect(firstPage.data.total).toBeGreaterThan(0);

    const beyond = await listProducts({}, "manual", { perPage: 2, page: 5000 });

    expect(beyond.ok).toBe(true);
    if (!beyond.ok) return;

    expect(beyond.data.items).toHaveLength(0);
    // Kritik nokta: toplam KAYBOLMAZ. Sıfır dönseydi arayüz "katalog boş" derdi.
    expect(beyond.data.total).toBe(firstPage.data.total);
    expect(beyond.data.pageCount).toBe(firstPage.data.pageCount);
    expect(beyond.data.page).toBe(5000);
  });

  it("aralık dışı sayfada FİLTRELER sayaca da uygulanır", async () => {
    // Sayaç ikinci bir sorguyla alınır; filtreleri unutursa toplam şişerdi.
    const filtered = await listProducts({ brandSlug: ROBOROCK }, "manual", { perPage: 1, page: 1 });
    const beyond = await listProducts({ brandSlug: ROBOROCK }, "manual", { perPage: 1, page: 4000 });
    if (!filtered.ok || !beyond.ok) throw new Error("sorgu başarısız");

    expect(beyond.data.total).toBe(filtered.data.total);

    const all = await listProducts({}, "manual", { perPage: 1, page: 1 });
    if (!all.ok) throw new Error("sorgu başarısız");
    expect(beyond.data.total).toBeLessThan(all.data.total);
  });

  it("arama terimindeki dilbilgisi karakterleri filtreyi ETKİSİZLEŞTİRMEZ", async () => {
    /*
      REGRESYON ÇIPASI (canlı gözlenen hata).

      Terim `or=(...)` metnine kaçırılmadan giriyordu. `?ara=)` grubu erken
      kapatıp filtreyi düşürüyor ve TÜM katalogu "arama sonucu" diye
      döndürüyordu. Bu test o davranışın geri gelmesini engeller.
    */
    const all = await listProducts({}, "manual", { perPage: 100 });
    if (!all.ok) throw new Error("sorgu başarısız");

    for (const term of [")", "(", "()", "a)))", "a),id.gt.0,(name.ilike.", '"', "\\"]) {
      const result = await listProducts({ search: term }, "manual", { perPage: 100 });

      expect(result.ok, `"${term}" sorgusu hata verdi`).toBe(true);
      if (!result.ok) continue;

      // Hiçbir ürün adı/kodu bu dizgileri içermiyor → sonuç boş olmalı.
      expect(result.data.items, `"${term}" tüm katalogu döndürdü`).toHaveLength(0);
      expect(result.data.total).toBeLessThan(all.data.total);
    }
  });

  it("gerçek terim aranabilir — kaçış arama kalitesini bozmaz", async () => {
    const result = await listProducts({ search: "fırça" }, "manual", { perPage: 100 });
    if (!result.ok) throw new Error("sorgu başarısız");

    expect(result.data.items.length).toBeGreaterThan(0);
    for (const item of result.data.items) {
      expect(item.name.toLocaleLowerCase("tr")).toContain("fırça");
    }
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

  it("KAPAK GÖRSELİ istekten isteğe DEĞİŞMEZ", async () => {
    /*
      REGRESYON ÇIPASI.

      Gömülü kaynak sırasız döner; eski kod `find(is_primary) ?? images[0]`
      diyordu ve `images[0]` Postgres'in o anki planına bağlıydı. Tohumdaki
      `ornek-lityum-batarya` bu tuzağın tam örneğidir: iki görseli vardır ve
      HİÇBİRİ `is_primary` değildir — kapağı tamamen rastlantısaldı.

      Sıra artık kodda açıkça kurulur (is_primary → display_order →
      storage_path). Tekrarlı sorgu aynı kapağı vermelidir.
    */
    const covers = new Set<string>();
    for (let i = 0; i < 8; i += 1) {
      const result = await listProducts({}, "manual", { perPage: 100 });
      if (!result.ok) throw new Error("sorgu başarısız");

      const item = result.data.items.find((p) => p.slug === "ornek-lityum-batarya");
      expect(item, "ornek-lityum-batarya listede yok").toBeDefined();
      covers.add(item?.primaryImage?.storagePath ?? "(yok)");
    }

    expect(covers.size, `kapak görseli değişti: ${[...covers].join(", ")}`).toBe(1);
    expect(covers.has("(yok)")).toBe(false);
  });

  it("ana görsel işaretliyse display_order'a BAKILMAKSIZIN kapak olur", async () => {
    // `ana-firca-1` işaretlidir; sıralama ölçütlerinin önceliği bu sırayla olmalı.
    const result = await listProducts({}, "manual", { perPage: 100 });
    if (!result.ok) throw new Error("sorgu başarısız");

    const item = result.data.items.find((p) => p.slug === "ornek-ana-firca-modulu");
    expect(item?.primaryImage?.storagePath).toBe("demo/yer-tutucu/ana-firca-1.webp");
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
