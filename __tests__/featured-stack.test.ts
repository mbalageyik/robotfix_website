import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  ============================================================================
  Robot Fix Seçkisi — yığılan kart sahnesi (Faz 9)
  ============================================================================

  Bu bölüm üçüncü taraf bir desenden (sticky stacking scroll cards) uyarlandı.
  Uyarlarken kolayca geri gelebilecek üç şey var ve üçü de sessizce bozar:

    1. Kaynak, kartları `<img src="https://images.unsplash.com/...">` ile
       besliyordu. Hotlink stok görsel, gerçek olmayan bir ürünü gerçekmiş
       gibi göstermenin en kısa yoludur (§20).
    2. Kaynak `<ReactLenis root>` ile TÜM belgeyi yumuşak kaydırmaya sarıyordu.
       Bu projede tek düzen dosyası olduğu için o sarmalama yönetim panelini de
       kapsar ve programatik kaydırmayı ele geçirir (ölçüldü, bkz. bileşen
       başlığı).
    3. Kaynakta kartlar `<div>`di. Tıklama hedefi gerçek bir bağlantı olmazsa
       JS kapalıyken bölüm ölü bir görsel yığınına döner.

  Ayrıca fiyat/indirim gösteriminin TEK KAYNAKTAN geldiği doğrulanır: kartın
  kendi yüzde hesabı yapması, §6'nın yasakladığı uydurma indirimin kapısıdır.
*/

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relativePath: string) => readFileSync(join(root, relativePath), "utf8");

/**
 * Yorumları söker.
 *
 * "Bu dosyada X GEÇMEMELİ" biçimindeki denetimler yorumlara takılmamalıdır:
 * bu kod tabanında kararların GEREKÇESİ yorumlarda yazılıdır ve gerekçe
 * çoğu zaman reddedilen şeyin adını anar ("ReactLenis kullanılmadı çünkü…").
 * Denetlenen şey koddur, kodun anlatısı değil.
 */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const panel = read("components/home/FeaturedProductPanel.tsx");
const stage = read("components/home/FeaturedStackStage.tsx");
const section = read("components/home/FeaturedProductsSection.tsx");
const globals = read("app/globals.css");
const packageJson = read("package.json");

// ---------------------------------------------------------------------------
// 1. Görseller: yalnız gerçek ürün görseli veya yerel yedek
// ---------------------------------------------------------------------------

describe("görsel kaynağı", () => {
  it("hiçbir harici görsel sağlayıcısına bağlanılmaz", () => {
    for (const host of ["unsplash", "pexels", "picsum", "placehold", "cloudinary"]) {
      expect(panel.toLowerCase(), `${host} hotlink'i yasak`).not.toContain(host);
      expect(stage.toLowerCase()).not.toContain(host);
    }
  });

  it("görsel yolu `lib/images.ts` üzerinden üretilir", () => {
    expect(panel).toContain('from "@/lib/images"');
    expect(panel).toContain("productImageUrl(");
  });

  it("görsel yoksa yerel simge + degrade yedeği kullanılır", () => {
    // Hizmet panellerindeki desenin aynısı; harici yer tutucu servisi YOK.
    expect(panel).toContain("PartsIcon");
    expect(panel).toMatch(/bg-linear-to-br/);
  });

  it("ürün görselinin alt metni boş bırakılamaz", () => {
    /*
      Hizmet panelindeki fotoğraf dekoratifti (`alt=""`); burada görsel
      ÜRÜNÜN KENDİSİDİR. Yönetici alt metin yazmadıysa ürün adına düşülür.
    */
    expect(panel).toMatch(
      /altText\s*=\s*product\.primaryImage\?\.altText\?\.trim\(\)\s*\|\|\s*product\.name/,
    );
    expect(panel).toContain("alt={altText}");
  });
});

// ---------------------------------------------------------------------------
// 2. Fiyat ve indirim: tek kaynak, uydurma yok
// ---------------------------------------------------------------------------

describe("fiyat ve indirim gösterimi", () => {
  it("kart kendi yüzdesini HESAPLAMAZ, `Price` bileşenini kullanır", () => {
    expect(panel).toContain('from "@/components/ui/Price"');
    expect(panel).toContain("<Price");
    // Kartın KODUNDA elle yüzde hesabı veya "indirim" ibaresi olmamalı.
    expect(code(panel)).not.toMatch(/Math\.round\([^)]*\/[^)]*\*\s*100/);
    expect(code(panel)).not.toMatch(/indirim/i);
  });

  it("eski fiyat veritabanı alanından geçirilir", () => {
    expect(panel).toContain("compareAtPriceMinor");
    expect(panel).toContain("compareAtAmount=");
  });

  it("`Price` yüzdeyi yalnız iki GERÇEK değerden üretir", () => {
    /*
      Tek kaynağın kendisi de denetlenir: indirim rozeti ancak eski fiyat
      güncel fiyattan büyükse çıkar ve yüzde o iki sayıdan hesaplanır.
      Sabit bir yüzde veya "İndirimde!" ibaresi olamaz (§6).
    */
    const price = read("components/ui/Price.tsx");
    expect(price).toContain("compareAtAmount > amount");
    expect(price).toMatch(/compareAtAmount!\s*-\s*amount!/);
  });

  it("fiyatsız ürün için iletişim çağrısı korunur", () => {
    const price = read("components/ui/Price.tsx");
    expect(price).toContain("Fiyat için iletişime geçin");
  });

  it("stok durumu rozetle gösterilir (yalnız renk değil)", () => {
    expect(panel).toContain("AvailabilityBadge");
  });
});

// ---------------------------------------------------------------------------
// 3. Bağlantı: JS'siz de çalışır
// ---------------------------------------------------------------------------

describe("kartın tıklanabilirliği", () => {
  it("kart gerçek bir Next.js bağlantısıdır, onClick sarmalayıcı değil", () => {
    expect(panel).toContain('from "next/link"');
    expect(panel).toMatch(/href=\{`\/urunler\/\$\{product\.slug\}`\}/);
    expect(code(panel)).not.toContain("onClick");
  });

  it("tıklama alanı kartın tamamına bağlantı üzerinden yayılır", () => {
    // Sarmalayıcı div'e onClick koymak yerine bağlantının ::after'ı kullanılır.
    expect(panel).toContain("after:absolute after:inset-0");
  });

  it("kart sunucuda üretilir — istemci bileşeni değildir", () => {
    /*
      Metin ve bağlantı istemci paketine girmeden sunucu HTML'inde durmalı
      (bilgi dosyası §14). Karta "use client" eklenirse bu güvence kalkar.
    */
    expect(panel.trimStart().startsWith('"use client"')).toBe(false);
    expect(section.trimStart().startsWith('"use client"')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Lenis kararı ve hareket tercihi
// ---------------------------------------------------------------------------

describe("kaydırma altyapısı", () => {
  it("lenis bir bağımlılık DEĞİLDİR", () => {
    /*
      Denendi ve ölçülerek reddedildi (gerekçe bileşen başlığında). Sessizce
      geri eklenirse bu test kırılır.
    */
    expect(packageJson).not.toContain("lenis");
    expect(code(stage)).not.toContain("ReactLenis");
    expect(code(stage)).not.toMatch(/from ["']lenis/);
  });

  it("efekt framer-motion `useScroll` ile üretilir", () => {
    expect(stage).toContain("useScroll");
    expect(stage).toContain("useTransform");
  });

  it("hareket iki katmanla durdurulur — CSS ve JS", () => {
    // 1. katman: JS hesabı bırakır.
    expect(stage).toContain("REDUCED_MOTION_QUERY");
    expect(stage).toMatch(/animate\s*=\s*canStack\s*&&\s*!prefersReducedMotion/);
    // 2. katman: CSS satır içi dönüşümü sıfırlar, JS olmadan da geçerli.
    expect(stage).toContain("data-rf-scroll-motion");
  });

  it("azaltılmış harekette yığılmanın KENDİSİ de sökülür", () => {
    /*
      Yalnız ölçeği durdurmak yarım uymaktır: `position: sticky` ile kartların
      üst üste binmesi de kaydırmaya bağlı bir harekettir. CSS katmanında
      sökülür ki JS olmadan da geçerli olsun.
    */
    expect(stage).toContain("data-rf-stack-layer");
    expect(globals).toMatch(/\[data-rf-stack-layer\]\s*\{\s*position:\s*static\s*!important/);
    expect(globals).toMatch(/\[data-rf-stack\]\s*\{\s*padding-bottom:\s*0\s*!important/);
  });
});

// ---------------------------------------------------------------------------
// 5. Dar ekran yedeği
// ---------------------------------------------------------------------------

describe("dar ekran yerleşimi", () => {
  it("yığılma yerine native yatay kaydırma kullanılır", () => {
    expect(stage).toContain("overflow-x-auto");
    expect(stage).toContain("md:sticky");
    // Taşıyıcı bir carousel kütüphanesi eklenmedi.
    expect(packageJson).not.toMatch(/embla|swiper|keen-slider|splide/i);
  });

  it("yerleşim farkı CSS ile kurulur, JS dalıyla değil", () => {
    /*
      JS dalı, sunucu anlık görüntüsü `false` olduğu için masaüstünde
      hidrasyondan sonra yerleşimi değiştirir (görünür sıçrama) ve JS
      kapalıyken masaüstü kullanıcısını dar ekran yerleşiminde bırakırdı.
      Bu yüzden `items.map` içinde tek bir bileşen render edilir.
    */
    const mapBody = code(stage).slice(code(stage).indexOf("items.map("));
    expect(mapBody).toContain("<StackedCard");
    expect(mapBody).not.toContain("canStack ?");
  });

  it("dar ekranda kat `static` kalır — `top` uygulanmamalı", () => {
    /*
      Burada `relative` yazmak, yığın için verilen satır içi `top` değerini
      dar ekranda da uygular: kart şeridin içinde aşağı kayar ve
      `overflow-x: auto`nun getirdiği dikey kırpmaya takılır.
    */
    const wrapperClasses = stage.slice(stage.indexOf('"w-[85vw]'), stage.indexOf("md:sticky"));
    expect(wrapperClasses).not.toContain("relative");
  });
});

// ---------------------------------------------------------------------------
// 6. Bölümün sözleşmesi korundu
// ---------------------------------------------------------------------------

describe("bölüm sözleşmesi", () => {
  it("başlık ve boş/hata durumları değişmedi", () => {
    expect(section).toContain('title="Robot Fix Seçkisi"');
    expect(section).toContain("EMPTY_STATES.featured");
    expect(section).toContain("<ErrorState");
    // Boş sonuç ile sorgu hatası hâlâ AYRI ele alınır.
    expect(section).toContain("!result.ok");
    expect(section).toContain("result.data.length === 0");
  });

  it("katalog kartı silinmedi — katalog sayfaları onu kullanmayı sürdürür", () => {
    expect(() => read("components/catalog/ProductCard.tsx")).not.toThrow();
  });

  it("HİÇBİR kart öncelik/preload almaz", () => {
    /*
      Bu testin önceki hâli "yalnız ilk kart `priority` alır" diyordu ve
      gerekçesi "ilk kart LCP adayıdır"dı. Üretim derlemesinde ölçüldüğünde
      bu varsayım tutmadı: seçki bölümünün TAMAMI katlanmanın altında, yani
      ilk kart da LCP adayı değil. O `priority` `<head>`e ikinci bir görsel
      preload'u koyup gerçek LCP elemanı olan hero görseliyle yarışıyordu.

      `priority` ayrıca Next 16'da kullanımdan kaldırıldı (yerine `preload`).
      Doğru davranış hiçbirini işaretlememektir: kartlar varsayılan
      `loading="lazy"` ile görünüm alanına yaklaşınca iner.
    */
    expect(section).not.toMatch(/priority=\{index === 0\}/);
    expect(code(section)).not.toContain("priority");
    expect(code(panel)).not.toContain("priority");
    expect(code(panel)).not.toContain("preload");
  });
});
