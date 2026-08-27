import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  HOMEPAGE_SECTION_META,
  visibleHomeSections,
  EMPTY_HOME_SECTIONS_CONFIG,
} from "@/lib/home/section-registry";

/*
  ============================================================================
  ANA SAYFA BÖLÜMLERİNİN VARLIĞI — komşu bölüm regresyonlarına karşı
  ============================================================================

  Bu dosyanın sebebi somut bir olay: hizmetler bölümünün ana sayfadan
  "kaybolduğu" bildirildi. Araştırma sonucu bir kod regresyonu DEĞİLDİ —
  hizmet satırlarının tamamı `draft` olduğu için bölüm kendini gizlemişti
  (`ServicesSection`, Faz 5'ten beri veri yoksa `null` döner ve
  `/veri-kontrol` bu durumu "beklenen" diye açıkça yazar).

  Ama araştırma sırasında şu ortaya çıktı: bölümün KAYDI ve RENDER EŞLEMESİ
  hiçbir test tarafından korunmuyordu. Yani gerçekten bir regresyon olsaydı —
  kayıt satırının silinmesi, `enabled: false`a düşmesi, render eşlemesinin
  kopması ya da komşu bir bölümün akıştan çıkıp diğerlerini örtmesi — hiçbir
  test kırılmazdı; yalnız bölüm sessizce yok olurdu.

  Buradaki testler o boşluğu kapatır. Verinin doluluğunu DENETLEMEZLER; o bir
  içerik kararıdır ve panele aittir.
*/

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relativePath: string) => readFileSync(join(root, relativePath), "utf8");

const sectionsMap = read("components/home/sections.tsx");
const servicesSection = read("components/home/ServicesSection.tsx");
const stackStage = read("components/home/FeaturedStackStage.tsx");

const ids = HOMEPAGE_SECTION_META.map((section) => section.id);

// ---------------------------------------------------------------------------
// 1. Kayıt: bölüm var, açık ve yayınlanabilir
// ---------------------------------------------------------------------------

describe("bölüm kaydı", () => {
  it("hizmetler bölümü kayıtlıdır", () => {
    expect(ids).toContain("hizmetler");
  });

  it("hizmetler varsayılan olarak açık ve onaylı içeriktir", () => {
    const meta = HOMEPAGE_SECTION_META.find((section) => section.id === "hizmetler");
    expect(meta?.enabled).toBe(true);
    // "draft" olsaydı panel açık olsa bile herkese açık sayfada görünmezdi.
    expect(meta?.contentStatus).toBe("live");
  });

  it("boş yapılandırmada hizmetler görünür bölümler arasındadır", () => {
    /*
      Panel hiç kullanılmamışsa (site_settings anahtarı boş) kod
      varsayılanları geçerlidir. Bu, kurulumdan sonraki ilk hâldir.
    */
    const visible = visibleHomeSections(HOMEPAGE_SECTION_META, EMPTY_HOME_SECTIONS_CONFIG);
    expect(visible.map((section) => section.id)).toContain("hizmetler");
  });

  it("hizmetler açılışın HEMEN ardından, katalogdan ÖNCE gelir", () => {
    /*
      Sıra bir içerik akışı kararıdır (§13) ve panelden değiştirilemez.

      Teknik servis markanın çekirdeğidir (§2, §22 · 1); katalog yüzeyleri
      (seçki, kategoriler, markalar) onun ARKASINDA durur. Servis kataloğun
      arkasına düşerse sayfa bir parça dükkânı gibi açılır.
    */
    expect(ids.indexOf("giris")).toBe(0);
    expect(ids.indexOf("hizmetler")).toBe(1);
    for (const catalogId of ["secki", "kategoriler", "markalar"] as const) {
      expect(
        ids.indexOf("hizmetler"),
        `hizmetler, ${catalogId} bölümünden önce gelmeli`,
      ).toBeLessThan(ids.indexOf(catalogId));
    }
  });

  it("servis vitrini, hizmet listesinin HEMEN ardındadır", () => {
    /*
      Bu komşuluk sıranın kendisi kadar önemlidir: hizmet başlıkları "ne
      yapılıyor"u, vitrin "kim yapıyor"u söyler. Araya bir bölüm girerse
      vitrin, arkasındaki iddiayı taşıdığı listeden kopar.
    */
    expect(ids.indexOf("servis-vitrini")).toBe(ids.indexOf("hizmetler") + 1);
  });
});

// ---------------------------------------------------------------------------
// 2. Render eşlemesi: kayıt ile bileşen bağlı
// ---------------------------------------------------------------------------

describe("render eşlemesi", () => {
  it("her kayıtlı bölümün eşlemede bir girdisi vardır", () => {
    /*
      Tip düzeyinde `Record<HomeSectionId, ...>` ile zaten kilitli; bu test
      eşlemenin GERÇEKTEN o kimlikleri yazdığını kaynak üzerinden doğrular
      (bir girdi `as never` gibi bir kaçamakla susturulursa yakalar).
    */
    const eksik = ids.filter(
      (id) => !sectionsMap.includes(`${id}:`) && !sectionsMap.includes(`"${id}":`),
    );
    expect(eksik).toEqual([]);
  });

  it("hizmetler eşlemesi ServicesSection'a bağlanır", () => {
    expect(sectionsMap).toContain("<ServicesSection");
    expect(sectionsMap).toMatch(/hizmetler:\s*\(data\)\s*=>\s*<ServicesSection/);
  });
});

// ---------------------------------------------------------------------------
// 3. "Veri yoksa gizlen" sözleşmesi bilinçlidir
// ---------------------------------------------------------------------------

describe("veri yoksa davranışı", () => {
  it("hizmet yoksa bölüm render EDİLMEZ — ve bu kasıtlıdır", () => {
    /*
      Bölümün "kaybolmasının" gerçek sebebi budur. Sahte hizmet başlıkları
      üretmek §20'nin yasağıdır; boş bir başlık bırakmak da sayfada anlamsız
      bir boşluk açardı. Davranış değiştirilecekse BİLİNÇLİ yapılsın diye
      burada sabitlenir.
    */
    expect(servicesSection).toMatch(/if\s*\(!result\.ok\s*\|\|\s*result\.data\.length === 0\)\s*return null;/);
  });

  it("paneller sorgu sonucundan üretilir — kodda sabit hizmet listesi yoktur", () => {
    /*
      Hizmet kapsamı işletmenin yönettiği bir veridir. Bölüm boş kalmasın diye
      koda birkaç örnek hizmet gömmek §20'nin yasakladığı şeydir: sitede
      gerçekte verilmeyen bir hizmet yazılı olurdu.

      Ad, açıklama ve simge anahtarının üçü de satırdan okunur.
    */
    expect(servicesSection).toMatch(/result\.data\.map\(\(service\)\s*=>/);
    expect(servicesSection).toContain("name: service.name");
    expect(servicesSection).toContain("description: service.short_description");
    expect(servicesSection).toContain("iconKey: service.icon_key");
  });
});

// ---------------------------------------------------------------------------
// 4. Komşu bölümler akıştan kaçmaz
// ---------------------------------------------------------------------------

describe("komşu bölüm izolasyonu", () => {
  it("seçki yığını normal akışta kalır — kardeş bölümleri örtemez", () => {
    /*
      Bildirilen şüphe buydu: yığılan kart sahnesi, DOM'da sonra gelen
      bölümleri (hizmetler) örtüyor olabilir. Örtmüyor, çünkü:
        - kartlar `sticky`dir, `fixed` DEĞİL (sticky kapsayıcı bloğun dışına
          çıkamaz),
        - sahne kabı akıştan çıkmaz (`absolute`/`fixed` değildir),
        - dikey negatif kenar boşluğu yoktur.
      Üçü de bozulursa gerçekten örtme başlar; bu yüzden sabitlenir.
    */
    expect(stackStage).toContain("md:sticky");
    expect(stackStage).not.toMatch(/\bfixed\b/);
    expect(stackStage).not.toMatch(/\babsolute\b/);
    // Yatay negatif kenar (şeridi kenardan kenara akıtan) serbest; dikey olan değil.
    expect(stackStage).not.toMatch(/(^|\s|")-mt-/);
    expect(stackStage).not.toMatch(/(^|\s|")-mb-/);
    expect(stackStage).not.toMatch(/(^|\s|")-top-/);
  });

  it("hiçbir ana sayfa bölümü kardeşlerini örtecek bir z-index kurmaz", () => {
    /*
      Bölümler z-index YARIŞMAZ: sayfa tek bir akış olarak okunur. Bir bölüm
      kendi içinde katman kurabilir (örtü, poster üstündeki video), ama
      bölümün KENDİSİNE yüksek bir z-index verilmesi kardeşlerini örtmenin
      kapısıdır.
    */
    const yuksekZIndex = /\bz-(?:[5-9]\d|\d{3,}|\[\s*\d{2,}\s*\])/;
    for (const file of ["FeaturedStackStage.tsx", "FeaturedProductsSection.tsx", "ServicesSection.tsx", "ServiceShowcaseStage.tsx"]) {
      expect(read(`components/home/${file}`), `${file} yüksek z-index kurmamalı`).not.toMatch(
        yuksekZIndex,
      );
    }
  });
});
