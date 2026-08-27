import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  ============================================================================
  Robot Fix Seçkisi — adlandırma ve keşfedilebilirlik bekçileri
  ============================================================================

  Bu testlerin koruduğu şey bir davranış değil, BULUNABİLİRLİK. Alan teknik
  olarak hep çalışıyordu; yönetici onu panelde bulamıyordu çünkü:

    - sitede "Robot Fix Seçkisi" olan kavram, panelde "Öne çıkan ürün"du,
    - kutucuk sekiz bölümlük formun en alt bölümündeydi ve açıklaması yoktu,
    - panel gezinmesinde seçkiye giden bir bağlantı yoktu.

  Bu üç kusur da sessizce geri gelebilir (bir etiket "sadeleştirilir", bir nav
  girdisi bir yeniden düzenlemede düşer) ve hiçbir davranış testi kırılmaz.
  Bu yüzden kaynak denetlenir — güvenlik bekçileriyle aynı gerekçe.
*/

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (relativePath: string) => readFileSync(join(root, relativePath), "utf8");

const productForm = read("components/admin/ProductForm.tsx");
const adminNav = read("components/admin/AdminNav.tsx");
const featuredActions = read("lib/admin/featured-actions.ts");
const featuredManager = read("components/admin/FeaturedProductsManager.tsx");
const featuredPage = read("app/admin/secki/page.tsx");
const homeSection = read("components/home/FeaturedProductsSection.tsx");

// ---------------------------------------------------------------------------
// 1. Panel ve site aynı adı kullanır
// ---------------------------------------------------------------------------

describe("seçki adlandırması", () => {
  it("ana sayfadaki bölümün adı hâlâ “Robot Fix Seçkisi”", () => {
    // Panel metinleri bu ada göre yazıldı; ad değişirse burası önce kırılmalı.
    expect(homeSection).toContain('title="Robot Fix Seçkisi"');
  });

  it("ürün formundaki kutucuk site adıyla etiketlenir", () => {
    expect(productForm).toMatch(/Robot Fix Seçkisi\S*nde göster/);
    // Eski, sitede hiçbir yerde geçmeyen ad geri gelmemeli.
    expect(productForm).not.toMatch(/>\s*Öne çıkan ürün\s*</);
  });

  it("kutucuğun ne işe yaradığını anlatan bir açıklaması vardır", () => {
    /*
      Kutucuk çıplak bir <label> idi: formdaki diğer alanların aksine ne
      yardım metni ne de `aria-describedby` bağlantısı vardı.
    */
    expect(productForm).toContain("-featured-hint");
    expect(productForm).toMatch(/aria-describedby=\{`\$\{formId\}-featured-hint`\}/);
    expect(productForm).toMatch(/Ana sayfadaki .*Robot Fix Seçkisi.* bölümünde gösterilir/);
  });

  it("form, toplu yönetim ekranına bağlantı verir", () => {
    expect(productForm).toContain('href="/admin/secki"');
  });
});

// ---------------------------------------------------------------------------
// 2. Ekran gezinmeden erişilebilir
// ---------------------------------------------------------------------------

describe("panel gezinmesi", () => {
  it("seçki ekranına bir sekme vardır", () => {
    expect(adminNav).toContain('{ href: "/admin/secki", label: "Seçki" }');
  });

  it("sekme ürünlerin hemen ardından gelir", () => {
    // Seçki bir ürün işidir; taksonominin arkasına düşerse yine kaybolur.
    const products = adminNav.indexOf('href: "/admin/urunler"');
    const featured = adminNav.indexOf('href: "/admin/secki"');
    const brands = adminNav.indexOf('href: "/admin/markalar"');
    expect(products).toBeLessThan(featured);
    expect(featured).toBeLessThan(brands);
  });
});

// ---------------------------------------------------------------------------
// 3. Veri modeli DEĞİŞMEDİ — tek kaynak korunur
// ---------------------------------------------------------------------------

describe("veri modeli dokunulmazlığı", () => {
  it("aksiyonlar yalnız products tablosunu yazar", () => {
    /*
      Ayrı bir "seçki üyeliği" tablosu getirmek, aynı gerçeğin iki kaynağı
      olması demekti; ürün formu biri, yeni ekran diğerini yazardı.
    */
    const tables = [...featuredActions.matchAll(/\.from\("(\w+)"\)/g)].map((match) => match[1]);
    expect([...new Set(tables)]).toEqual(["products"]);
  });

  it("iki hedef sütuna da gerçekten yazılır", () => {
    expect(featuredActions).toMatch(/is_featured:\s*featured/);
    expect(featuredActions).toMatch(/display_order:\s*nextOrder/);
  });

  it("başka hiçbir ürün sütununa değer atanmaz", () => {
    /*
      En tehlikeli sessiz hata: seçkiye eklerken ürünü de yayına almak.
      Taslak bir ürünü yayımlamak yöneticinin BİLİNÇLİ kararıdır ve yeri ürün
      sayfasındaki "Yayımla" düğmesidir — bir seçki kutucuğu değil.

      Bu yüzden aşağıdaki anahtarların hiçbiri bu dosyada bir nesne alanı
      olarak GEÇMEMELİDİR (okuma `.select()` içinde metin olarak geçer,
      atama değildir).
    */
    for (const column of ["status", "is_demo", "price_minor", "slug", "name"]) {
      expect(featuredActions, `${column} sütununa yazılmamalı`).not.toMatch(
        new RegExp(`\\b${column}\\s*:`),
      );
    }
  });

  it("seçki sorgusu ana sayfayla AYNI sıralamayı kullanır", () => {
    /*
      Panelde başka, sitede başka bir sıra göstermek, "yukarı taşı" dediğiniz
      satırın ana sayfada başka yere gitmesi demekti.
    */
    const queries = read("lib/admin/queries.ts");
    const featuredQuery = queries.slice(queries.indexOf("listAdminFeaturedProducts"));
    expect(featuredQuery).toMatch(/\.order\("display_order", \{ ascending: true \}\)/);
    expect(featuredQuery).toMatch(/\.order\("name", \{ ascending: true \}\)/);
  });
});

// ---------------------------------------------------------------------------
// 4. Görünmeyen satır sessiz kalmaz
// ---------------------------------------------------------------------------

describe("yayında değil uyarısı", () => {
  it("taslak satır için açık bir uyarı metni vardır", () => {
    expect(featuredManager).toMatch(/Yayında değil — seçkide işaretli olsa bile/);
  });

  it("örnek (demo) kayıt için ayrı bir uyarı vardır", () => {
    // İki farklı sebep, iki farklı cümle: "neden görünmüyor" sorusunun
    // cevabı tek bir belirsiz uyarıya sıkıştırılmaz.
    expect(featuredManager).toMatch(/Örnek \(demo\) kayıt/);
  });

  it("seçkiye eklemeden ÖNCE de uyarılır", () => {
    expect(featuredPage).toMatch(/Yayında değil — seçkiye eklense bile/);
  });

  it("taslak ürünü seçkiye eklemek ENGELLENMEZ", () => {
    /*
      Engellemek yanlış olurdu: yönetici bir ürünü önce hazırlayıp sonra
      yayımlar. Doğru olan, sonucun ne olacağını önceden söylemek.

      Bekçi: ekleme butonunun görünürlüğünü belirleyen TEK koşul "zaten
      seçkide mi" olmalıdır — yayın durumu o koşula karışmamalıdır.
    */
    expect(featuredPage).toContain("product.isFeatured ? (");

    const buttonBlock = featuredPage.slice(
      featuredPage.indexOf("product.isFeatured ? ("),
      featuredPage.indexOf("Seçkiye ekle"),
    );
    expect(buttonBlock).not.toContain("status");
  });
});

// ---------------------------------------------------------------------------
// 5. Sıralama deseni ve ana sayfa tazelemesi
// ---------------------------------------------------------------------------

describe("sıralama ve tazeleme", () => {
  it("sürükle-bırak yerine yukarı/aşağı butonları kullanılır", () => {
    expect(featuredManager).toContain("↑ Yukarı");
    expect(featuredManager).toContain("↓ Aşağı");
    expect(featuredManager).not.toMatch(/draggable|onDragStart|dnd-kit/);
  });

  it("uçlardaki butonlar gizlenmez, devre dışı gösterilir", () => {
    // Gizlemek satırların hizasını ve klavye sırasını bozardı.
    expect(featuredManager).toContain("DisabledActionButton");
  });

  it("seçki değişince ana sayfa tazelenir", () => {
    /*
      Ana sayfa statik üretilir (5 dk). Tazelenmezse yönetici değişikliği
      yapar, siteye bakar, hiçbir şey görmez — bu ekranın çözmeye çalıştığı
      güvensizliğin aynısı.
    */
    expect(featuredActions).toMatch(/revalidatePath\("\/"\)/);

    /*
      Ürün formu da aynı alanı yazar; o yol da tazelemeli. Kontrol artık
      ham `revalidatePath("/")` çağrısını DEĞİL, yardımcıyı arıyor:
      `lib/admin/revalidate.ts` ana sayfayla birlikte katalog listesini,
      ürün detayını ve sitemap'i de tazeliyor. Liste tek yerde durduğu için
      bekçi de oraya bakıyor — aşağıdaki test o listenin içeriğini kilitler.
    */
    expect(read("lib/admin/product-actions.ts")).toMatch(/revalidateProductSurfaces\(/);
  });

  it("ürün değişikliği KATALOG yüzeylerini de tazeler", () => {
    /*
      Bu testin sebebi ölçülmüş bir kusurdur: üç ürün aksiyonunun hiçbiri
      `/urunler` ile ürün detayını tazelemiyordu. Sonuç, ARŞİVLENEN bir
      ürünün beş dakikaya kadar sitede satılmaya devam etmesiydi — "değişiklik
      geç görünüyor"dan farklı bir sorun: ziyaretçi olmayan bir parça için
      iletişime geçer.
    */
    const helper = read("lib/admin/revalidate.ts");
    for (const path of ['"/urunler"', "`/urunler/${slug}`", '"/"', '"/sitemap.xml"']) {
      expect(helper, `${path} tazelenmeli`).toContain(path);
    }

    // Durum değiştirme (arşivle/yayımla) en kritik çağrı yeridir.
    const actions = read("lib/admin/product-actions.ts");
    const statusAction = actions.slice(
      actions.indexOf("export async function setProductStatusAction"),
    );
    expect(statusAction).toMatch(/revalidateProductSurfaces\(/);
    // Detay sayfasını tazelemek için slug gerekir; yalnız `id` seçmek yetmez.
    expect(statusAction).toContain('.select("id, slug")');
  });
});
