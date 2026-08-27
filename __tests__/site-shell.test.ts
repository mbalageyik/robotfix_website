import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  ============================================================================
  GENEL SİTE KABUĞU BEKÇİLERİ
  ============================================================================

  Kabuk (başlık + alt bilgi) `app/(site)/layout.tsx` üzerinden gelir. Bu
  dosyanın koruduğu şey görsel sunum DEĞİL, üç yapısal sözleşmedir:

    1. Kabuk yönetim paneline SIZMAZ. Panelin kendi gezinmesi var; genel
       başlık oraya binerse iki gezinme üst üste düşer.
    2. Her genel sayfada atlama bağlantısının hedefi (`#icerik`) GERÇEKTEN
       vardır. Hedefi olmayan bir atlama bağlantısı, klavye kullanıcısını
       hiçbir yere götürmeyen bir tuzaktır.
    3. Alt bilgi doğrulanmamış işletme iddiası taşımaz (§20).

  Neden statik denetim: ihlal sessizdir. Yeni bir genel sayfa `(site)`
  dışına eklenirse başlıksız çıkar ve kimse fark etmez; `<main>` id'si
  unutulursa atlama bağlantısı sessizce kırılır.
*/

const root = fileURLToPath(new URL("..", import.meta.url));

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

/**
 * Blok ve satır yorumlarını söker.
 *
 * İçerik doğruluğu bekçileri RENDER EDİLEN metne bakmalıdır: kuralın kendisi
 * ("7/24 gibi bir iddia yazılmaz") yorumda ALINTILANIR ve alıntı ihlal
 * değildir. Marka yazımı bekçisi (`home-content.test.ts`) bilinçli olarak
 * tersini yapar — orada yanlış yazım alıntı olarak bile istenmez.
 */
function stripComments(source: string): string {
  return source.replaceAll(/\/\*[\s\S]*?\*\//g, "").replaceAll(/^[^\n"'`]*\/\/.*$/gm, "");
}

function collectPages(dir: string): string[] {
  const absolute = join(root, dir);
  if (!existsSync(absolute)) return [];

  return readdirSync(absolute).flatMap((entry) => {
    const full = join(absolute, entry);
    if (statSync(full).isDirectory()) return collectPages(join(dir, entry));
    return entry === "page.tsx" ? [join(dir, entry).replaceAll("\\", "/")] : [];
  });
}

describe("kabuk yerleşimi", () => {
  it("genel düzen hem başlığı hem alt bilgiyi kurar", () => {
    const layout = read("app/(site)/layout.tsx");
    expect(layout).toContain("<SiteHeader />");
    expect(layout).toContain("<SiteFooter />");
    // Atlama bağlantısı düzendedir, sayfa sayfa tekrar edilmez.
    expect(layout).toContain('href="#icerik"');
  });

  it("rota grubu URL'leri değiştirmez — sayfalar beklenen yollarda", () => {
    /*
      Parantezli klasör yol üretmez. Bu test, birinin klasörü `site/` diye
      (parantezsiz) yeniden adlandırıp /site/urunler gibi bir yol üretmesini
      yakalar.
    */
    expect(existsSync(join(root, "app/(site)/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "app/(site)/urunler/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "app/site"))).toBe(false);
  });

  it("kabuk yönetim paneline sızmaz", () => {
    const offenders = ["app/admin/layout.tsx", ...collectPages("app/admin")]
      .map((file) => ({ file, code: read(file) }))
      .filter(({ code }) => code.includes("SiteHeader") || code.includes("SiteFooter"))
      .map(({ file }) => file);

    expect(offenders, "Panelin kendi kabuğu var; genel başlık/alt bilgi oraya eklenmez.").toEqual(
      [],
    );
  });

  it("kök düzen kabuğu KURMAZ — kursaydı panele de binerdi", () => {
    const rootLayout = read("app/layout.tsx");
    expect(rootLayout).not.toContain("SiteHeader");
    expect(rootLayout).not.toContain("SiteFooter");
  });

  it("her genel sayfanın main öğesi atlama hedefini taşır", () => {
    const pages = collectPages("app/(site)");
    expect(pages.length).toBeGreaterThanOrEqual(3);

    const offenders = pages
      .map((file) => ({ file, code: read(file) }))
      .filter(({ code }) => code.includes("<main") && !code.includes('id="icerik"'))
      .map(({ file }) => file);

    expect(offenders, "Atlama bağlantısının hedefi olmayan sayfa bırakılamaz.").toEqual([]);
  });

  it("404 kabuğu kendi kurar — grup düzeninin dışındadır", () => {
    /*
      Hiçbir rotayla eşleşmeyen adres KÖK düzende render edilir; `(site)`
      düzeni ona uygulanmaz. Dosya grup içine taşınırsa 404 sessizce
      başlıksız kalır — ölçülerek görüldü, bu yüzden kilitleniyor.
    */
    expect(existsSync(join(root, "app/not-found.tsx"))).toBe(true);
    expect(existsSync(join(root, "app/(site)/not-found.tsx"))).toBe(false);

    const notFound = read("app/not-found.tsx");
    expect(notFound).toContain("<SiteHeader />");
    expect(notFound).toContain("<SiteFooter />");
    expect(notFound).toContain('id="icerik"');
  });
});

describe("başlık gezinmesi", () => {
  const header = read("components/layout/SiteHeader.tsx");

  it("çapalar köke göre MUTLAKTIR", () => {
    /*
      Başlık ürün detay sayfasında da durur. Göreli bir `#hizmetler` orada
      aynı sayfada boşluğa işaret ederdi.
    */
    expect(header).toContain("`/#${link.sectionId}`");
  });

  it("çapa listesi yalnız GÖRÜNEN bölümlere verilir", () => {
    // Panelden kapatılmış bir bölüme bağlantı vermek, hiçbir yere gitmeyen
    // bir menü öğesi demektir.
    expect(header).toContain("visibleHomeSections");
    expect(header).toContain("visibleIds.has");
  });

  it("dar ekran menüsü istemci JS'ine bağlı değil", () => {
    // §14: JS yüklenmese de gezinme çalışmalıdır.
    expect(header).not.toContain('"use client"');
    expect(header).toContain("<details");
  });
});

describe("alt bilgi doğruluğu", () => {
  const footer = read("components/layout/SiteFooter.tsx");

  it("boş işletme alanı için yer tutucu metin yazmaz", () => {
    /*
      Adres/saat/telefon `site_settings`ten gelir ve bugün boştur. Her satır
      kendi verisi varsa render edilir; "Adres: —" gibi bir satır yazılmaz.
    */
    expect(footer).toContain("siteConfig.addressLine &&");
    expect(footer).toContain("siteConfig.workingHours &&");
    expect(footer).toContain("siteConfig.phoneDisplay &&");
    expect(footer).toContain("siteConfig.storeLinks.length > 0");
  });

  it("doğrulanmamış hizmet/teslimat iddiası taşımaz", () => {
    // §20: garanti, teslimat süresi, yetkili servis statüsü uydurulamaz.
    const rendered = stripComments(footer);
    const FORBIDDEN = [
      /7\s*\/\s*24/,
      /ücretsiz\s+kargo/i,
      /aynı\s+gün/i,
      /yetkili\s+servis/i,
      /garanti/i,
    ];
    const offenders = FORBIDDEN.filter((pattern) => pattern.test(rendered)).map(
      (pattern) => rendered.match(pattern)?.[0] ?? "",
    );

    expect(offenders).toEqual([]);
  });

  it("harici bağlantılar rel='noopener noreferrer' ile açılır", () => {
    const externalCount = (footer.match(/target="_blank"/g) ?? []).length;
    const relCount = (footer.match(/rel="noopener noreferrer"/g) ?? []).length;

    expect(externalCount).toBeGreaterThan(0);
    expect(relCount).toBe(externalCount);
  });
});
