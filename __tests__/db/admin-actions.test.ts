import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { connect } from "./helpers/db";

/*
  ============================================================================
  UÇTAN UCA YÖNETİM PANELİ AKSİYONLARI — GERÇEK VERİTABANINA KARŞI
  ============================================================================

  Bu dosya sunucu aksiyonlarının GERÇEK gövdesini çalıştırır: zod doğrulaması,
  veritabanının `slugify()` fonksiyonu, PostgREST yazmaları, alt tablo
  eşitlemesi, Storage yükleme — hepsi RLS AÇIKKEN.

  DEĞİŞTİRİLEN TEK ŞEY oturumun nereden geldiğidir: `getServerClient()` normalde
  çerezden okur; burada programatik olarak giriş yapmış gerçek bir Supabase
  istemcisi döner. Yani yetkilendirme hattı (auth.uid() → is_admin() → RLS)
  olduğu gibi çalışır; yalnız çerez taşıyıcısı devre dışıdır.

  NEDEN ÖNEMLİ: `requireAdminAction()` çağrısının VARLIĞINI statik test
  doğruluyor (__tests__/admin/security-hygiene.test.ts). Burada ise o kontrolün
  gerçekten ETKİLİ olduğu, yani yönetici olmayan bir oturumun yazamadığı
  doğrulanır.
*/

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Yerel geliştirme yöneticisi (supabase/dev_create_admin.sql ile oluşturulur). */
const ADMIN_EMAIL = "admin@robotfix.local";
const ADMIN_PASSWORD = "RobotFixDev!2026";

/** Bu test dosyasının oluşturduğu yönetici OLMAYAN kullanıcı. */
const PLAIN_EMAIL = "faz3-plain@robotfix.local";
const PLAIN_PASSWORD = "Faz3PlainUser!2026";

/*
  Mock'ların okuduğu değişken. `vi.mock` fabrikası modül yüklenirken çalıştığı
  için doğrudan bir istemciyi kapatamayız; bunun yerine bu tutucuya bakılır ve
  testler arasında değiştirilebilir.
*/
const holder: { client: SupabaseClient | null } = { client: null };

vi.mock("@/lib/supabase/server-client", () => ({
  getServerClient: async () => {
    if (!holder.client) throw new Error("Test istemcisi ayarlanmadı.");
    return holder.client;
  },
}));

/** `revalidatePath` Next.js istek bağlamı ister; testte anlamsızdır. */
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

/** Yönlendirmeyi yakalanabilir bir istisnaya çevirir (gerçekte de istisnadır). */
class TestRedirect extends Error {
  constructor(public readonly path: string) {
    super(`REDIRECT:${path}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new TestRedirect(path);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

/** `redirect()` atan aksiyonları çalıştırır ve hedef yolu döner. */
async function expectRedirect(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof TestRedirect) return error.path;
    throw error;
  }
  throw new Error("Yönlendirme bekleniyordu ama gerçekleşmedi.");
}

async function signIn(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Giriş başarısız (${email}): ${error.message}`);
  return client;
}

let pg: Client;
let adminClient: SupabaseClient;
const createdProductIds: string[] = [];
let originalSettings: { key: string; value: string | null }[] = [];

beforeAll(async () => {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY tanımsız — yerel yığın çalışıyor mu?");
  }

  pg = await connect();

  /*
    Yönetici OLMAYAN kullanıcıyı oluştur (parola ile giriş yapabilsin).

    `auth.users.email` üzerinde düz bir benzersizlik kısıtı YOKTUR (Supabase
    e-postayı instance ve provider ile birlikte benzersiz tutar), bu yüzden
    `on conflict` kullanılamaz. Önceki koşudan kalmış olabilecek satır önce
    silinir — böylece test tekrar tekrar çalıştırılabilir.
  */
  await pg.query("delete from auth.users where email = $1", [PLAIN_EMAIL]);
  /*
    Jeton sütunları BOŞ DİZE olmalıdır, NULL değil: GoTrue bunları NULL kabul
    etmeyen Go `string` alanlarına okur ve NULL bırakılırsa giriş 500 döner
    ("Database error querying schema"). Aynı tuzak supabase/dev_create_admin.sql
    içinde de açıklanmıştır.
  */
  await pg.query(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change, email_change_token_new,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token)
     values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
        'authenticated', $1, crypt($2, gen_salt('bf')), now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
        '', '', '', '', '', '', '', '')`,
    [PLAIN_EMAIL, PLAIN_PASSWORD],
  );

  const { rows } = await pg.query<{ id: string }>(
    "select id from auth.users where email = $1",
    [PLAIN_EMAIL],
  );
  // Her kullanım açıkça dönüştürülür; aksi hâlde Postgres $1 için hem uuid hem
  // text çıkarsamaya çalışır ve "inconsistent types deduced" hatası verir.
  await pg.query(
    `insert into auth.identities (id, user_id, provider_id, provider, identity_data,
        last_sign_in_at, created_at, updated_at)
     values (gen_random_uuid(), $1::uuid, $1::text, 'email',
        jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
        now(), now(), now())
     on conflict (provider, provider_id) do nothing`,
    [rows[0].id, PLAIN_EMAIL],
  );

  // Site ayarlarının özgün hâlini sakla; testler bunları değiştirecek.
  const settings = await pg.query<{ key: string; value: string | null }>(
    "select key, value from site_settings",
  );
  originalSettings = settings.rows;

  adminClient = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
  holder.client = adminClient;
});

afterAll(async () => {
  // Bu dosyanın ürettiği her şeyi geri al — testler kalıcı kir bırakmaz.
  for (const id of createdProductIds) {
    await pg.query("delete from products where id = $1", [id]);
  }
  for (const setting of originalSettings) {
    await pg.query("update site_settings set value = $2 where key = $1", [
      setting.key,
      setting.value,
    ]);
  }
  await pg.query("delete from auth.users where email = $1", [PLAIN_EMAIL]);
  await pg.end();
});

/** Ürün formunun gerektirdiği tüm alanları taşıyan FormData. */
function productForm(overrides: Record<string, string> = {}): FormData {
  const base: Record<string, string> = {
    name: "Faz3 Test Ürünü",
    slug: "",
    brandId: "",
    categoryId: "",
    sku: "",
    shortDescription: "Test için oluşturuldu.",
    longDescription: "",
    price: "",
    compareAtPrice: "",
    availability: "in_stock",
    isOriginal: "unknown",
    boxContents: "",
    installationNotes: "",
    displayOrder: "0",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    specs: "[]",
    compatibleModelIds: "[]",
    marketplaceLinks: "[]",
    relatedProductIds: "[]",
  };

  const form = new FormData();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    form.set(key, value);
  }
  return form;
}

// ===========================================================================
// 1. Ürün yaşam döngüsü: oluştur → düzenle → yayımla → arşivle
// ===========================================================================

describe("ürün yaşam döngüsü (yönetici oturumu)", () => {
  let productId: string;

  it("ürün oluşturur ve slug'ı veritabanı üretir", async () => {
    const { saveProductAction } = await import("@/lib/admin/product-actions");

    const path = await expectRedirect(() =>
      saveProductAction(
        { status: "idle", message: null, fieldErrors: {} },
        productForm({ name: "Faz3 Fırça Modülü ÇĞİÖŞÜ" }),
      ),
    );

    expect(path).toMatch(/^\/admin\/urunler\/[0-9a-f-]{36}\?kaydedildi=1$/);
    productId = path.slice("/admin/urunler/".length).split("?")[0];
    createdProductIds.push(productId);

    const { rows } = await pg.query<{ slug: string; status: string; price_minor: string | null }>(
      "select slug, status, price_minor from products where id = $1",
      [productId],
    );

    // Türkçe harfler veritabanının slugify()'ı ile çevrilir (tek kaynak).
    expect(rows[0].slug).toBe("faz3-firca-modulu-cgiosu");
    expect(rows[0].status).toBe("draft");
    // Fiyat boş bırakıldı → NULL (0 DEĞİL).
    expect(rows[0].price_minor).toBeNull();
  });

  it("sıfır fiyatı reddeder ve ne yapılacağını söyler", async () => {
    const { saveProductAction } = await import("@/lib/admin/product-actions");

    const result = await saveProductAction(
      { status: "idle", message: null, fieldErrors: {} },
      productForm({ id: productId, price: "0" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors.priceMinor).toMatch(/boş/i);
  });

  it("güncel fiyat olmadan eski fiyatı reddeder", async () => {
    const { saveProductAction } = await import("@/lib/admin/product-actions");

    const result = await saveProductAction(
      { status: "idle", message: null, fieldErrors: {} },
      productForm({ id: productId, price: "", compareAtPrice: "1000" }),
    );

    expect(result.status).toBe("error");
  });

  it("fiyatı ve alt kayıtları günceller", async () => {
    const { saveProductAction } = await import("@/lib/admin/product-actions");

    const result = await saveProductAction(
      { status: "idle", message: null, fieldErrors: {} },
      productForm({
        id: productId,
        name: "Faz3 Fırça Modülü ÇĞİÖŞÜ",
        price: "1.249,90",
        compareAtPrice: "1.499,00",
        availability: "limited",
        specs: JSON.stringify([
          { label: "Malzeme", value: "Silikon" },
          { label: "Renk", value: "Siyah" },
        ]),
        marketplaceLinks: JSON.stringify([
          {
            marketplace: "trendyol",
            customLabel: "",
            url: "https://www.trendyol.com/deneme",
            linkTarget: "product",
            isActive: true,
          },
        ]),
      }),
    );

    expect(result.status).toBe("success");

    const product = await pg.query<{
      price_minor: string;
      compare_at_price_minor: string;
      availability: string;
    }>(
      "select price_minor, compare_at_price_minor, availability from products where id = $1",
      [productId],
    );
    expect(Number(product.rows[0].price_minor)).toBe(124_990);
    expect(Number(product.rows[0].compare_at_price_minor)).toBe(149_900);
    expect(product.rows[0].availability).toBe("limited");

    const specs = await pg.query("select label from product_specs where product_id = $1", [
      productId,
    ]);
    expect(specs.rowCount).toBe(2);

    const links = await pg.query(
      "select url from product_marketplace_links where product_id = $1",
      [productId],
    );
    expect(links.rowCount).toBe(1);
  });

  it("alt kayıtları yeniden yazarken eskiyi bırakmaz", async () => {
    const { saveProductAction } = await import("@/lib/admin/product-actions");

    await saveProductAction(
      { status: "idle", message: null, fieldErrors: {} },
      productForm({
        id: productId,
        price: "1.249,90",
        specs: JSON.stringify([{ label: "Malzeme", value: "Kauçuk" }]),
        marketplaceLinks: "[]",
      }),
    );

    const specs = await pg.query<{ value: string }>(
      "select value from product_specs where product_id = $1",
      [productId],
    );
    expect(specs.rowCount).toBe(1);
    expect(specs.rows[0].value).toBe("Kauçuk");

    const links = await pg.query(
      "select url from product_marketplace_links where product_id = $1",
      [productId],
    );
    expect(links.rowCount).toBe(0);
  });

  it("yayımlar", async () => {
    const { setProductStatusAction } = await import("@/lib/admin/product-actions");
    const form = new FormData();
    form.set("id", productId);
    form.set("status", "active");

    const result = await setProductStatusAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("success");

    const { rows } = await pg.query<{ status: string }>(
      "select status from products where id = $1",
      [productId],
    );
    expect(rows[0].status).toBe("active");
  });

  it("yayındaki ürün anonim istemciye görünür", async () => {
    const anon = createClient(SUPABASE_URL, ANON_KEY);
    const { data } = await anon.from("products").select("id").eq("id", productId);
    expect(data).toHaveLength(1);
  });

  it("arşivler — kayıt SİLİNMEZ", async () => {
    const { setProductStatusAction } = await import("@/lib/admin/product-actions");
    const form = new FormData();
    form.set("id", productId);
    form.set("status", "archived");

    const result = await setProductStatusAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("success");

    const { rows } = await pg.query<{ status: string }>(
      "select status from products where id = $1",
      [productId],
    );
    // Satır hâlâ orada — arşivleme kalıcı silmenin yerine geçer.
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("archived");
  });

  it("arşivlenen ürün anonim istemciye görünmez", async () => {
    const anon = createClient(SUPABASE_URL, ANON_KEY);
    const { data } = await anon.from("products").select("id").eq("id", productId);
    expect(data).toHaveLength(0);
  });

  /*
    Arşivleme GERİ ALINABİLİR olmalı — kalıcı silmenin yerine geçmesinin tek
    sebebi budur. Arşivden dönüş test edilmezse "silme yerine arşivliyoruz"
    savunması kanıtsız kalır.
  */
  it("arşivden tekrar aktife alınabilir", async () => {
    const { setProductStatusAction } = await import("@/lib/admin/product-actions");
    const form = new FormData();
    form.set("id", productId);
    form.set("status", "active");

    const result = await setProductStatusAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("success");

    const { rows } = await pg.query<{ status: string }>(
      "select status from products where id = $1",
      [productId],
    );
    expect(rows[0].status).toBe("active");
  });

  it("tekrar aktife alınan ürün anonim istemciye YENİDEN görünür", async () => {
    const anon = createClient(SUPABASE_URL, ANON_KEY);
    const { data } = await anon.from("products").select("id").eq("id", productId);
    // Arşiv → aktif dönüşü RLS tarafında da gerçekten geri alınıyor.
    expect(data).toHaveLength(1);
  });

  it("kopyalayarak çoğaltır — kopya taslak ve SKU'suz", async () => {
    const { saveProductAction, duplicateProductAction } = await import(
      "@/lib/admin/product-actions"
    );

    // Kopyalanacak, SKU'lu ve yayında bir kaynak ürün.
    const sourcePath = await expectRedirect(() =>
      saveProductAction(
        { status: "idle", message: null, fieldErrors: {} },
        productForm({ name: "Faz3 Kopya Kaynağı", sku: "FAZ3-SRC-1", status: "active" }),
      ),
    );
    const sourceId = sourcePath.slice("/admin/urunler/".length).split("?")[0];
    createdProductIds.push(sourceId);

    const form = new FormData();
    form.set("id", sourceId);
    const copyPath = await expectRedirect(() =>
      duplicateProductAction({ status: "idle", message: null, fieldErrors: {} }, form),
    );

    expect(copyPath).toMatch(/\?kopyalandi=1$/);
    const copyId = copyPath.slice("/admin/urunler/".length).split("?")[0];
    createdProductIds.push(copyId);

    const { rows } = await pg.query<{
      name: string;
      sku: string | null;
      status: string;
      is_demo: boolean;
      slug: string;
    }>("select name, sku, status, is_demo, slug from products where id = $1", [copyId]);

    expect(rows[0].name).toBe("Faz3 Kopya Kaynağı (kopya)");
    expect(rows[0].sku).toBeNull(); // benzersiz alan kopyalanmaz
    expect(rows[0].status).toBe("draft"); // kopya daima taslak doğar
    expect(rows[0].is_demo).toBe(false);
    expect(rows[0].slug).not.toBe("faz3-kopya-kaynagi");
  });
});

// ===========================================================================
// 1b. Slug çakışması
// ===========================================================================

/*
  Slug benzersizliği veritabanı kısıtıyla (unique index) korunur; uygulama onu
  Postgres'in `23505` koduna bakarak ANLAŞILIR bir alan hatasına çevirir.

  Bu blok çakışmayı GERÇEKTEN üretir — kısıtın varlığını varsaymaz. Kendi iki
  ürününü oluşturur, böylece diğer blokların sırasına bağlı değildir.
*/
describe("slug çakışması", () => {
  const TAKEN_SLUG = "faz3-cakisan-slug";

  it("çakışan slug'ı anlaşılır bir ALAN hatasıyla reddeder", async () => {
    const { saveProductAction } = await import("@/lib/admin/product-actions");
    const idle = { status: "idle" as const, message: null, fieldErrors: {} };

    // İlk ürün slug'ı kapar.
    const firstPath = await expectRedirect(() =>
      saveProductAction(idle, productForm({ name: "Faz3 Çakışan Slug", slug: TAKEN_SLUG })),
    );
    createdProductIds.push(firstPath.slice("/admin/urunler/".length).split("?")[0]);

    // İkinci ürün AYNI slug'ı elle ister → reddedilmeli.
    const result = await saveProductAction(
      idle,
      productForm({ name: "Faz3 Çakışan Slug İkinci", slug: TAKEN_SLUG }),
    );

    expect(result.status).toBe("error");
    // Hata GENEL bir mesaj değil, slug ALANINA bağlıdır ki form onu doğru
    // alanın altında gösterebilsin (Field bileşeni aria-describedby ile bağlar).
    expect(result.fieldErrors.slug).toMatch(/zaten kullanılıyor/i);

    // Ve ikinci kayıt gerçekten YAZILMAMIŞ olmalı — mesaj doğru ama satır
    // sızmış olsaydı test yanlış nedenle geçerdi.
    const { rows } = await pg.query<{ count: string }>(
      "select count(*)::text as count from products where slug = $1",
      [TAKEN_SLUG],
    );
    expect(rows[0].count).toBe("1");
  });
});

// ===========================================================================
// 2. Görsel yükleme (Storage + RLS)
// ===========================================================================

describe("görsel yükleme", () => {
  /** 1x1 saydam PNG — gerçek bir görsel; Storage tür kontrolünden geçer. */
  const PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  function pngFile(name = "deneme.png"): File {
    const binary = Buffer.from(PNG_BASE64, "base64");
    return new File([binary], name, { type: "image/png" });
  }

  let productId: string;
  let storagePath: string;

  beforeAll(async () => {
    const { saveProductAction } = await import("@/lib/admin/product-actions");
    const path = await expectRedirect(() =>
      saveProductAction(
        { status: "idle", message: null, fieldErrors: {} },
        productForm({ name: "Faz3 Görselli Ürün" }),
      ),
    );
    productId = path.slice("/admin/urunler/".length).split("?")[0];
    createdProductIds.push(productId);
  });

  it("görsel yükler ve ilkini ana görsel yapar", async () => {
    const { uploadProductImageAction } = await import("@/lib/admin/image-actions");

    const form = new FormData();
    form.set("productId", productId);
    form.set("file", pngFile());
    form.set("altText", "Test görseli");

    const result = await uploadProductImageAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("success");

    const { rows } = await pg.query<{
      storage_path: string;
      is_primary: boolean;
      alt_text: string;
    }>("select storage_path, is_primary, alt_text from product_images where product_id = $1", [
      productId,
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].is_primary).toBe(true);
    expect(rows[0].alt_text).toBe("Test görseli");
    storagePath = rows[0].storage_path;
  });

  it("yol kullanıcının dosya adını TAŞIMAZ", async () => {
    const { uploadProductImageAction } = await import("@/lib/admin/image-actions");

    const form = new FormData();
    form.set("productId", productId);
    // Yol geçişi denemesi içeren düşmanca dosya adı.
    form.set("file", pngFile("../../../etc/passwd.png"));
    form.set("altText", "");

    const result = await uploadProductImageAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("success");

    const { rows } = await pg.query<{ storage_path: string }>(
      "select storage_path from product_images where product_id = $1",
      [productId],
    );

    for (const row of rows) {
      expect(row.storage_path).not.toContain("passwd");
      expect(row.storage_path).not.toContain("..");
      expect(row.storage_path).toMatch(
        new RegExp(`^products/${productId}/[0-9a-f-]{36}\\.png$`),
      );
    }
  });

  it("dosya gerçekten kovada ve herkese açık okunabilir", async () => {
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
  });

  it("ikinci görsel ana görsel OLMAZ", async () => {
    const { rows } = await pg.query<{ count: string }>(
      "select count(*)::text from product_images where product_id = $1 and is_primary",
      [productId],
    );
    expect(Number(rows[0].count)).toBe(1);
  });

  it("ana görsel değiştirilebilir", async () => {
    const { setPrimaryImageAction } = await import("@/lib/admin/image-actions");

    const images = await pg.query<{ id: string; is_primary: boolean }>(
      "select id, is_primary from product_images where product_id = $1 order by display_order",
      [productId],
    );
    const secondary = images.rows.find((row) => !row.is_primary)!;

    const form = new FormData();
    form.set("imageId", secondary.id);
    form.set("productId", productId);

    const result = await setPrimaryImageAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("success");

    const after = await pg.query<{ count: string }>(
      "select count(*)::text from product_images where product_id = $1 and is_primary",
      [productId],
    );
    // Tek ana görsel kısıtı korunur.
    expect(Number(after.rows[0].count)).toBe(1);
  });

  it("görseli siler ve dosyayı kovadan kaldırır", async () => {
    const { deleteImageAction } = await import("@/lib/admin/image-actions");

    const images = await pg.query<{ id: string; storage_path: string }>(
      "select id, storage_path from product_images where product_id = $1 limit 1",
      [productId],
    );
    const target = images.rows[0];

    const form = new FormData();
    form.set("imageId", target.id);
    form.set("productId", productId);

    const result = await deleteImageAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("success");

    const remaining = await pg.query(
      "select id from product_images where id = $1",
      [target.id],
    );
    expect(remaining.rowCount).toBe(0);

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/product-images/${target.storage_path}`,
    );
    expect(response.status).toBe(400);
  });
});

// ===========================================================================
// 3. Site ayarları — E.164 normalizasyonu
// ===========================================================================

describe("site ayarları", () => {
  function settingsForm(overrides: Record<string, string> = {}): FormData {
    const base: Record<string, string> = {
      whatsapp_phone: "",
      phone_display: "",
      address_line: "",
      working_hours: "",
      maps_url: "",
      store_amazon_url: "",
      store_hepsiburada_url: "",
      store_trendyol_url: "",
      store_pazarama_url: "",
      whatsapp_template_product: "",
      whatsapp_template_service: "",
    };
    const form = new FormData();
    for (const [key, value] of Object.entries({ ...base, ...overrides })) {
      form.set(key, value);
    }
    return form;
  }

  it("yerel biçimdeki numarayı E.164'e çevirerek saklar", async () => {
    const { saveSiteSettingsAction } = await import("@/lib/admin/settings-actions");

    const result = await saveSiteSettingsAction(
      { status: "idle", message: null, fieldErrors: {} },
      // Yerel biçim: 0 + 10 hane.
      settingsForm({ whatsapp_phone: "0532 111 22 33" }),
    );

    expect(result.status).toBe("success");

    const { rows } = await pg.query<{ value: string }>(
      "select value from site_settings where key = 'whatsapp_phone'",
    );
    expect(rows[0].value).toBe("+905321112233");
  });

  it("geçersiz numarayı reddeder ve kabul edilen biçimleri anlatır", async () => {
    const { saveSiteSettingsAction } = await import("@/lib/admin/settings-actions");

    const result = await saveSiteSettingsAction(
      { status: "idle", message: null, fieldErrors: {} },
      settingsForm({ whatsapp_phone: "123" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors.whatsapp_phone).toBeTruthy();
    expect(result.fieldErrors.whatsapp_phone).toMatch(/boş bırakın/i);
  });

  it("http:// mağaza bağlantısını reddeder", async () => {
    const { saveSiteSettingsAction } = await import("@/lib/admin/settings-actions");

    const result = await saveSiteSettingsAction(
      { status: "idle", message: null, fieldErrors: {} },
      settingsForm({ store_trendyol_url: "http://trendyol.com/magaza" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors.store_trendyol_url).toMatch(/https/i);
  });

  it("boş bırakılan alan NULL olur (sitede hiç gösterilmez)", async () => {
    const { saveSiteSettingsAction } = await import("@/lib/admin/settings-actions");

    const result = await saveSiteSettingsAction(
      { status: "idle", message: null, fieldErrors: {} },
      settingsForm({ whatsapp_phone: "+90 532 111 22 33" }),
    );
    expect(result.status).toBe("success");

    const { rows } = await pg.query<{ value: string | null }>(
      "select value from site_settings where key = 'store_amazon_url'",
    );
    expect(rows[0].value).toBeNull();
  });

  it("ayarlar anonim istemciye okunabilir (sır saklanmaz)", async () => {
    const anon = createClient(SUPABASE_URL, ANON_KEY);
    const { data, error } = await anon.from("site_settings").select("key, value");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// 4. YETKİLENDİRME — yönetici olmayan kimliği doğrulanmış kullanıcı
// ===========================================================================

describe("yönetici olmayan kimliği doğrulanmış kullanıcı", () => {
  beforeAll(async () => {
    /*
      Modüller sıfırlanır: `lib/auth/dal.ts` React `cache()` kullanır ve önceki
      bloklarda yönetici kimliği hesaplanmış olabilir. Sıfırlamadan yapılan bir
      test YANLIŞ NEDENLE geçebilirdi.
    */
    vi.resetModules();
    holder.client = await signIn(PLAIN_EMAIL, PLAIN_PASSWORD);
  });

  afterAll(() => {
    holder.client = adminClient;
  });

  it("oturumu gerçekten açıktır (test yanlış nedenle geçmesin)", async () => {
    const { data } = await holder.client!.auth.getUser();
    expect(data.user?.email).toBe(PLAIN_EMAIL);
  });

  it("is_admin() false döner", async () => {
    const { data } = await holder.client!.rpc("is_admin");
    expect(data).toBe(false);
  });

  it("ürün oluşturamaz", async () => {
    const { saveProductAction } = await import("@/lib/admin/product-actions");

    const before = await pg.query<{ count: string }>("select count(*)::text from products");

    const result = await saveProductAction(
      { status: "idle", message: null, fieldErrors: {} },
      productForm({ name: "Yetkisiz kullanıcı ürünü" }),
    );

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/yetki/i);

    const after = await pg.query<{ count: string }>("select count(*)::text from products");
    // Hiçbir satır yazılmadı.
    expect(after.rows[0].count).toBe(before.rows[0].count);
  });

  it("ürün durumunu değiştiremez", async () => {
    const { setProductStatusAction } = await import("@/lib/admin/product-actions");
    const form = new FormData();
    form.set("id", createdProductIds[0]);
    form.set("status", "active");

    const result = await setProductStatusAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("error");
  });

  it("marka oluşturamaz", async () => {
    const { saveBrandAction } = await import("@/lib/admin/taxonomy-actions");
    const form = new FormData();
    form.set("name", "Yetkisiz Marka");
    form.set("slug", "");
    form.set("description", "");
    form.set("displayOrder", "0");
    form.set("status", "draft");

    const result = await saveBrandAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("error");
  });

  it("site ayarlarını değiştiremez", async () => {
    const { saveSiteSettingsAction } = await import("@/lib/admin/settings-actions");
    const form = new FormData();
    form.set("whatsapp_phone", "0532 999 88 77");
    for (const key of [
      "phone_display",
      "address_line",
      "working_hours",
      "maps_url",
      "store_amazon_url",
      "store_hepsiburada_url",
      "store_trendyol_url",
      "store_pazarama_url",
      "whatsapp_template_product",
      "whatsapp_template_service",
    ]) {
      form.set(key, "");
    }

    const result = await saveSiteSettingsAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("error");

    const { rows } = await pg.query<{ value: string }>(
      "select value from site_settings where key = 'whatsapp_phone'",
    );
    expect(rows[0].value).not.toBe("+905329998877");
  });

  it("görsel yükleyemez", async () => {
    const { uploadProductImageAction } = await import("@/lib/admin/image-actions");
    const form = new FormData();
    form.set("productId", createdProductIds[0]);
    form.set(
      "file",
      new File([Buffer.from("iVBORw0KGgo=", "base64")], "x.png", { type: "image/png" }),
    );
    form.set("altText", "");

    const result = await uploadProductImageAction(
      { status: "idle", message: null, fieldErrors: {} },
      form,
    );
    expect(result.status).toBe("error");
  });
});
