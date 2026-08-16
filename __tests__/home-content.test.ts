import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BRANDS_DISCLAIMER,
  COMPATIBILITY_CONTENT,
  HERO_CONTENT,
  FAQ_ITEMS,
  MARKETPLACE_CONTENT,
  SERVICE_PROCESS,
  SERVICE_SHOWCASE,
  VALUE_PROPOSITION,
} from "@/lib/home/content";
import { HOMEPAGE_SECTION_META } from "@/lib/home/section-registry";
import { REDUCED_MOTION_QUERY } from "@/lib/hooks/use-media-query";

/*
  ANA SAYFA İÇERİK BEKÇİLERİ.

  `__tests__/source-hygiene.test.ts` ham hex ve telefon numarasını kovalar;
  bu dosya ANA SAYFAYA ÖZGÜ doğruluk kurallarını kovalar (bilgi dosyası §10,
  §16, §20 + CLAUDE.md):

    - doğrulanmamış sayısal iddia yok,
    - "en çok satan / en iyi / en hızlı" gibi ölçülemeyen mutlak iddia yok,
    - yetkili servis / marka ortaklığı iddiası yok,
    - marka adı her yerde iki kelime: "Robot Fix".

  YORUMLAR TARAMA DIŞIDIR: kurallar kodda yorum olarak ALINTILANIR
  ("%95 memnuniyet kullanılmaz" gibi). Alıntı yasağı ihlal etmez; bu yüzden
  taramadan önce yorumlar sökülür ve yalnız GERÇEKTEN RENDER EDİLEN metin
  kalır.
*/

const root = fileURLToPath(new URL("..", import.meta.url));

function collectFiles(dir: string): string[] {
  const absolute = join(root, dir);
  let entries: string[];
  try {
    entries = readdirSync(absolute);
  } catch {
    return [];
  }

  return entries.flatMap((entry) => {
    const full = join(absolute, entry);
    if (statSync(full).isDirectory()) return collectFiles(join(dir, entry));
    return entry.endsWith(".ts") || entry.endsWith(".tsx") ? [join(dir, entry)] : [];
  });
}

/** Blok ve satır yorumlarını söker; geriye çalışan kod kalır. */
function stripComments(source: string): string {
  return source.replaceAll(/\/\*[\s\S]*?\*\//g, "").replaceAll(/^[^\n"'`]*\/\/.*$/gm, "");
}

/** Ana sayfayı oluşturan dosyalar: sayfa + bölüm bileşenleri + metin kaynağı. */
const HOMEPAGE_FILES = [
  "app/page.tsx",
  "lib/home/content.ts",
  "lib/home/organization-jsonld.ts",
  ...collectFiles("components/home"),
];

const homepageCode = HOMEPAGE_FILES.map((file) => ({
  file,
  code: stripComments(readFileSync(join(root, file), "utf8")),
}));

/*
  TÜM ARAYÜZ YÜZEYİ — marka yazımı bekçisi için.

  Marka yazımı kuralı ana sayfaya özgü DEĞİLDİR (CLAUDE.md: "tüm metinsel
  yüzeylerde"). Bekçi ilk yazıldığında yalnız ana sayfayı tarıyordu ve tam da
  bu yüzden yönetim panelindeki iki ihlali kaçırdı: `AdminShell` ve giriş
  sayfası marka adını `uppercase` ile basıyordu. Kapsam o olaydan sonra
  arayüzün tamamına genişletildi.
*/
const uiCode = ["app", "components", "lib"].flatMap(collectFiles).map((file) => ({
  file,
  code: stripComments(readFileSync(join(root, file), "utf8")),
}));

describe("taranan dosya kümesi", () => {
  it("bölüm bileşenlerini gerçekten buluyor", () => {
    // Yol yanlışsa testler sessizce "geçmemeli".
    expect(HOMEPAGE_FILES.length).toBeGreaterThan(10);
    expect(HOMEPAGE_FILES).toContain("components/home/Hero.tsx");
  });
});

describe("doğrulanmamış sayısal iddialar", () => {
  /*
    §10'daki eski site iddiaları: "500'den fazla tamir", "20'den fazla marka",
    "%95 müşteri memnuniyeti", "1 günlük ortalama teslimat". Bunlar
    doğrulanmadan yayımlanamaz.
  */
  const CLAIM_PATTERNS: { name: string; pattern: RegExp }[] = [
    { name: "yüzde iddiası", pattern: /%\s*\d/ },
    { name: "sayı + 'den fazla'", pattern: /\d+\s*['’]?\s*[dt]en\s+fazla/i },
    { name: "memnuniyet oranı", pattern: /memnuniyet/i },
    { name: "tamir/onarım adedi", pattern: /\d{2,}\s*\+?\s*(tamir|onarım|cihaz|müşteri)/i },
    {
      name: "gün cinsinden teslim taahhüdü",
      pattern: /\d+\s*gün(de|lük)?\s+(teslim|onarım|kargo)/i,
    },
    { name: "yıl cinsinden deneyim iddiası", pattern: /\d+\s*yıl(lık)?\s+(deneyim|tecrübe)/i },
  ];

  for (const { name, pattern } of CLAIM_PATTERNS) {
    it(`ana sayfa metninde ${name} yok`, () => {
      const offenders = homepageCode
        .filter(({ code }) => pattern.test(code))
        .map(({ file, code }) => `${file}: ${code.match(pattern)?.[0]}`);

      expect(offenders, "Doğrulanmamış istatistik yayımlanamaz (bilgi dosyası §10, §20)").toEqual(
        [],
      );
    });
  }
});

describe("ölçülemeyen mutlak iddialar", () => {
  // Bilgi dosyası §16: kanıtlanmamış "en iyi", "en hızlı", "kesin çözüm" yasak.
  const ABSOLUTE_PATTERNS = [
    /en\s+çok\s+satan/i,
    /en\s+iyi/i,
    /en\s+hızlı/i,
    /en\s+ucuz/i,
    /kesin\s+çözüm/i,
    /Türkiye['’]?nin\s+(ilk|tek|lider)/i,
    /lider\s+marka/i,
  ];

  it("ana sayfa metninde mutlak iddia yok", () => {
    const offenders = homepageCode.flatMap(({ file, code }) =>
      ABSOLUTE_PATTERNS.filter((pattern) => pattern.test(code)).map(
        (pattern) => `${file}: ${code.match(pattern)?.[0]}`,
      ),
    );

    expect(offenders, "Ölçülemeyen iddia kullanılmaz (bilgi dosyası §6, §16)").toEqual([]);
  });
});

describe("yetkili servis ve marka ortaklığı", () => {
  /*
    §10: marka listesi yetkili servis/ortaklık anlamına gelmez. Yasak olan
    OLUMLU iddiadır; uyarı cümlesindeki olumsuz kullanım gereklidir.
  */
  const AFFIRMATIVE = [
    /yetkili\s+servis(iy|i)?(iz|imiz|idir|siniz)/i,
    /resmi\s+yetkili/i,
    /marka\s+ortağ/i,
    /sertifikal[ıi]\s+servis/i,
  ];

  it("olumlu yetkili servis / ortaklık iddiası yok", () => {
    const offenders = homepageCode.flatMap(({ file, code }) =>
      AFFIRMATIVE.filter((pattern) => pattern.test(code)).map(
        (pattern) => `${file}: ${code.match(pattern)?.[0]}`,
      ),
    );

    expect(offenders).toEqual([]);
  });

  it("marka uyarısı §10'daki iki reddi de içerir", () => {
    expect(BRANDS_DISCLAIMER).toMatch(/yetkili servis/i);
    expect(BRANDS_DISCLAIMER).toMatch(/ortaklığı anlamına gelmez/i);
  });
});

describe("marka yazımı", () => {
  /*
    CLAUDE.md (ihlal edilemez): marka adı HER ZAMAN iki kelimedir.
    Bitişik yazım yalnız logo VARLIĞININ içinde serbesttir — kodda değil.
    Bu kontrol yorumları da kapsar: yanlış yazım bir alıntı olarak bile
    kod tabanına girmemelidir.
  */
  const FORBIDDEN = /\b(RobotFix|Robotfix|ROBOT F[İI]X|Robot-Fix|RoboFix)\b/;

  it("app/, components/ ve lib/ içinde yasak marka varyantı yok", () => {
    const offenders = ["app", "components", "lib"]
      .flatMap(collectFiles)
      .map((file) => ({ file, content: readFileSync(join(root, file), "utf8") }))
      .filter(({ content }) => FORBIDDEN.test(content))
      .map(({ file, content }) => `${file}: ${content.match(FORBIDDEN)?.[0]}`);

    expect(offenders, "Marka adı her zaman iki kelimedir: Robot Fix").toEqual([]);
  });
});

describe("üst etiketlerde marka adı (Türkçe büyütme tuzağı)", () => {
  /*
    NEDEN BU TEST VAR: üst etiketler `uppercase` ile basılır ve belge
    `lang="tr"` olduğu için tarayıcı TÜRKÇE büyütme uygular: "Fix" → "FİX".
    Ekranda beliren "ROBOT FİX", CLAUDE.md'nin adıyla saydığı yasak
    varyantlardan biridir — ve kaynak metinde "Robot Fix" doğru yazıldığı
    için düz bir yazım denetiminden KAÇAR. Bu yüzden kural kaynağa değil,
    BAĞLAMA bakar: büyütülen metinde marka adı bulunamaz.
  */
  const BRAND = /Robot\s+Fix/i;

  it("içerik kaynağındaki hiçbir overline marka adı taşımaz", () => {
    const overlines = [
      HERO_CONTENT.overline,
      VALUE_PROPOSITION.overline,
      COMPATIBILITY_CONTENT.overline,
      SERVICE_PROCESS.overline,
      MARKETPLACE_CONTENT.overline,
    ];

    expect(overlines.filter((text) => BRAND.test(text))).toEqual([]);
  });

  it("bileşenlerde satır içi yazılan overline'lar marka adı taşımaz", () => {
    // Kapsam: arayüzün TAMAMI (app + components + lib), yalnız ana sayfa değil.
    const offenders = uiCode.flatMap(({ file, code }) =>
      [...code.matchAll(/overline="([^"]*)"/g)]
        .filter((match) => BRAND.test(match[1]))
        .map((match) => `${file}: ${match[1]}`),
    );

    expect(
      offenders,
      'Türkçe büyütme "Fix"i "FİX"e çevirir; marka adı üst etikette kullanılamaz',
    ).toEqual([]);
  });

  it("başka bir `uppercase` bloğunda marka adı basılmaz", () => {
    /*
      Aynı tuzak `uppercase` sınıfı taşıyan her öğede geçerlidir. Sınıfla
      metnin aynı satırda bulunduğu durumları yakalar; bugünkü kullanım
      biçimi budur.

      Kapsam arayüzün TAMAMIDIR: bu kural ana sayfaya özgü değil, marka
      yazımı kuralıdır (CLAUDE.md). Dar kapsam yönetim panelindeki iki
      ihlali kaçırmıştı.
    */
    const offenders = uiCode.flatMap(({ file, code }) =>
      code
        .split("\n")
        .filter((line) => line.includes("uppercase") && BRAND.test(line))
        .map((line) => `${file}: ${line.trim()}`),
    );

    expect(offenders).toEqual([]);
  });
});

describe("fiyat ve stok metni", () => {
  it("ana sayfa metninde sabit fiyat yazılmaz", () => {
    // Fiyat yalnız veritabanından gelir ve `Price` bileşeniyle basılır.
    const offenders = homepageCode
      .filter(({ code }) => /\d+([.,]\d+)?\s*(TL|₺)/.test(code))
      .map(({ file }) => file);

    expect(offenders, "Fiyat metni koda gömülemez (bilgi dosyası §6)").toEqual([]);
  });

  it("sahte kıtlık/stok baskısı ifadesi yok", () => {
    const PRESSURE = [/son\s+\d+\s+ürün/i, /stoklar\s+tükenmek/i, /acele\s+edin/i, /kaçırmayın/i];

    const offenders = homepageCode.flatMap(({ file, code }) =>
      PRESSURE.filter((pattern) => pattern.test(code)).map((pattern) => `${file}: ${pattern}`),
    );

    expect(offenders, "Sahte kıtlık kullanılmaz (bilgi dosyası §16)").toEqual([]);
  });
});

describe("metin kaynağının bütünlüğü", () => {
  it("servis süreci dört adımdır ve taahhüt cümlesi taşımaz", () => {
    expect(SERVICE_PROCESS.steps).toHaveLength(4);
    // Süre ve ücret, cihaz görülmeden söylenmez.
    expect(SERVICE_PROCESS.note).toMatch(/değerlendirildikten sonra/i);
  });

  it("SSS taslağı boş değil ve her maddede cevap var", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(4);
    for (const item of FAQ_ITEMS) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it("değer önerisi üç ayak taşır", () => {
    expect(VALUE_PROPOSITION.pillars).toHaveLength(3);
  });

  it("pazaryeri bölümü otomatik senkron izlenimi vermez", () => {
    expect(MARKETPLACE_CONTENT.disclaimer).toMatch(/otomatik eşleşmez/i);
  });
});

describe("bölüm kaydı (HOMEPAGE_SECTION_META)", () => {
  /*
    Kayıt artık JSX'ten AYRI bir modüldedir (`lib/home/section-registry.ts`),
    bu yüzden doğrudan içe aktarılabilir — render eşlemesi
    (`components/home/sections.tsx`) hâlâ bölüm bileşenlerini çeker ve node
    ortamında içe aktarılmaz; oradaki kontrol kaynak metin üzerinden yapılır.
  */
  /** Bilgi dosyası §13 akışına karşılık gelen sıra. */
  const EXPECTED_ORDER = [
    "giris",
    "hakkinda",
    "secki",
    "kategoriler",
    "markalar",
    "hizmetler",
    // §13'ün akışına eklenen bölüm; gerekçesi kayıt dosyasındaki notta.
    "servis-vitrini",
    "uyumluluk",
    "surec",
    "pazaryerleri",
    "guven",
    "sss",
    "iletisim",
  ];

  const declaredIds = HOMEPAGE_SECTION_META.map((section) => section.id);

  it("bölümler §13 akışındaki sırayla kayıtlıdır", () => {
    expect(declaredIds).toEqual(EXPECTED_ORDER);
  });

  it("aynı id iki kez kullanılmaz (çapa çakışması olmaz)", () => {
    expect(new Set(declaredIds).size).toBe(declaredIds.length);
  });

  it("onay bekleyen bölümler taslak olarak işaretlidir", () => {
    // Servis süreci ve SSS metinleri işletme onayı bekler.
    const drafts = HOMEPAGE_SECTION_META.filter((section) => section.contentStatus === "draft");
    expect(drafts.map((section) => section.id)).toEqual(["surec", "sss"]);
  });

  it("her kayıtlı bölümün bir render karşılığı vardır", () => {
    const renderers = readFileSync(join(root, "components/home/sections.tsx"), "utf8");
    for (const id of declaredIds) {
      // Tire içeren kimlikler nesne anahtarı olarak TIRNAKLA yazılır
      // (`"servis-vitrini":`); desen iki biçimi de kabul eder.
      expect(renderers, `${id} için render eşlemesi yok`).toMatch(
        new RegExp(`^\\s{2}"?${id}"?: `, "m"),
      );
    }
  });

  it("sayfa kaydı dolaşır ve panel yapılandırmasıyla birleştirir", () => {
    const page = readFileSync(join(root, "app/page.tsx"), "utf8");
    // Sayfa bölümleri elle sıralamaz; birleştirme tek fonksiyondan geçer.
    expect(page).toContain("visibleHomeSections(HOMEPAGE_SECTIONS, sectionsConfig)");
    expect(page).toContain("getHomeSectionsConfig()");
  });
});

describe("hizmet panelleri (yatay şerit)", () => {
  /*
    Faz 6: hizmet kartları yatayda genişleyen panellere dönüştü. Testin
    koruduğu şey görsel sunum değil, ERİŞİLEBİLİRLİK SÖZLEŞMESİDİR —
    genişleyen panel deseninin klavyeyle kullanılamaz hâle gelmesi bu
    dönüşümün en olası regresyonudur.
  */
  const panels = readFileSync(join(root, "components/home/ServicePanels.tsx"), "utf8");
  const section = readFileSync(join(root, "components/home/ServicesSection.tsx"), "utf8");
  const panelCode = stripComments(panels);

  it("panel hedefi gerçek bir <button>, div değil", () => {
    expect(panelCode).toMatch(/<button\b/);
    expect(panelCode).toContain('type="button"');
  });

  it("açık/kapalı durumu ekran okuyucuya bildirilir", () => {
    expect(panelCode).toContain("aria-expanded={isActive}");
    expect(panelCode).toContain("aria-controls={contentId}");
    // Bildirilen içerik gerçekten var olmalı.
    expect(panelCode).toContain("id={contentId}");
  });

  it("klavyeyle açılır — fare tek giriş yolu değil", () => {
    expect(panelCode).toMatch(/onFocus=\{\(\)\s*=>\s*setActiveId/);
    expect(panelCode).toMatch(/onClick=\{\(\)\s*=>\s*setActiveId/);
  });

  it("kapalı panelde odaklanılabilir gizli bağlantı bırakılmaz", () => {
    /*
      Görünmez ama odaklanılabilir bir CTA, klavye kullanıcısı için
      "kaybolan odak" tuzağıdır. CTA yalnız açık panelde var olur.
    */
    expect(panelCode).toMatch(/\{isActive && <div className="pointer-events-auto">/);
  });

  it("hizmet adı her durumda METİN olarak durur (simge ve fotoğraf tek gösterge değil)", () => {
    // Ad butonun içinde; simge ve panel fotoğrafı dekoratiftir.
    expect(panelCode).toContain("{item.name}");

    /*
      Zemin katmanının TAMAMI `aria-hidden` bir sarmalayıcının içindedir:
      simge de, fotoğraf da. Ölçüt "kaç karakter sonra geçtiği" değil —
      araya yeni katman eklendiğinde kırılan kırılgan bir kuraldı; ölçüt
      ikisinin de dekoratif sarmalayıcı ile İÇERİK bloğu arasında kalmasıdır.
    */
    const decorativeStart = panelCode.indexOf('aria-hidden="true"');
    const contentStart = panelCode.indexOf("relative z-20");
    expect(decorativeStart).toBeGreaterThan(-1);
    expect(contentStart).toBeGreaterThan(decorativeStart);

    for (const decoration of ["<ServiceIcon", "<Image"]) {
      const at = panelCode.indexOf(decoration);
      expect(at, `${decoration} bulunamadı`).toBeGreaterThan(-1);
      expect(at, `${decoration} dekoratif katmanın dışında`).toBeGreaterThan(decorativeStart);
      expect(at, `${decoration} içerik bloğunun içinde`).toBeLessThan(contentStart);
    }
  });

  it("mevcut simge sistemi yeniden kullanılır", () => {
    expect(panels).toContain("getServiceIcon");
    expect(panels).toContain('from "@/components/ui/icons"');
  });

  it("stok görsel veya yeni ikon paketi getirilmez", () => {
    for (const forbidden of ["unsplash", "pexels", "lucide", "images.", "http://", "https://"]) {
      expect(panelCode.toLowerCase(), `${forbidden} kullanılamaz`).not.toContain(forbidden);
    }
  });

  it("veri ve CTA sunucuda üretilir, istemciye metin gömülmez", () => {
    expect(section).not.toContain('"use client"');
    expect(section).toContain("WhatsAppButton");
    /*
      Şerit yalnız sunum yapar: veriyi `items` olarak dışarıdan alır. Kontrol
      yorumsuz kod üzerinde yapılır — gerekçe yorumları bileşenin adını
      ALINTILAR, alıntı bir ihlal değildir.
    */
    expect(panels).toContain('"use client"');
    expect(panelCode).not.toContain("WhatsAppButton");
    expect(panelCode).not.toContain("listServices");
  });

  it("boş/hatalı veri davranışı Faz 5'ten korunur", () => {
    expect(stripComments(section)).toMatch(
      /if\s*\(!result\.ok \|\| result\.data\.length === 0\)\s*return null;/,
    );
  });

  it("geçişler tasarım sistemi tokenlarını kullanır", () => {
    // Rastgele süre/eğri değil: `app/globals.css` içindeki hareket tokenları.
    expect(panelCode).toContain("duration-(--duration-slow)");
    expect(panelCode).toContain("ease-(--ease-emphasized)");
  });
});

describe("bağımlılık sınırı", () => {
  it("ikon paketi bağımlılığı eklenmedi", () => {
    /*
      Simge seti el yazımıdır (`components/ui/icons.tsx`). Referans desenler
      `lucide-react` kullanıyordu; onu getirmek kendi simge dilimizi ikinci
      bir kaynakla bölerdi.
    */
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const all = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const forbidden of ["lucide-react", "@heroicons/react", "react-icons"]) {
      expect(all, `${forbidden} eklenmemeli`).not.toHaveProperty(forbidden);
    }
  });
});

describe("açılış bölümü (hero)", () => {
  /*
    Faz 6: yer tutucu hero, kaydırmaya bağlı kart sahnesiyle DEĞİŞTİ. Testin
    koruduğu şey sunum değil, SÖZLEŞMEDİR (bilgi dosyası §14 + CLAUDE.md):
    başlık, değer önerisi ve iki CTA hareketten bağımsız olarak DOM'da metin
    kalır; hareket kullanıcı tercihine saygı duyar.
  */
  const hero = readFileSync(join(root, "components/home/Hero.tsx"), "utf8");
  const stage = readFileSync(join(root, "components/home/HeroScrollStage.tsx"), "utf8");

  it("metin sözleşmesi tek kaynaktan gelir, bileşende yeniden yazılmaz", () => {
    expect(hero).toContain("HERO_CONTENT");
    // Metin gövdesi bileşene kopyalanmamalı.
    expect(hero).not.toContain("Robot Fix; robot süpürgelerin");
  });

  it("iki CTA da sunucu tarafında üretilir", () => {
    expect(hero).toContain("HERO_CONTENT.primaryCtaLabel");
    expect(hero).toContain("HERO_CONTENT.primaryCtaHref");
    expect(hero).toContain("whatsappCtaLabels.productInfo");
    expect(HERO_CONTENT.primaryCtaHref).toBe("/urunler");
  });

  it("metin ve CTA'lar istemci bileşenine TAŞINMAZ", () => {
    /*
      Bu, JS'siz erişilebilirliğin kod düzeyindeki güvencesi: sahne yalnız
      sunum yapar, metni `header`/`children` olarak DIŞARIDAN alır. Metin
      buraya yazılırsa sunucu HTML'i yine üretir ama sözleşme sessizce
      istemciye kayar.
    */
    expect(stage).toContain('"use client"');
    expect(stage).not.toContain("HERO_CONTENT");
    expect(stage).not.toContain("Ürünleri İncele");
    expect(stage).not.toContain("WhatsAppButton");
  });

  it("hero sunucu bileşeni olarak kalır (asenkron WhatsApp butonu için şart)", () => {
    expect(hero).not.toContain('"use client"');
    expect(hero).toContain("WhatsAppButton");
  });

  it("azaltılmış hareket tercihi JS OLMADAN da uygulanır", () => {
    /*
      Asıl güvence CSS'tedir: global katman yalnız animasyon/geçiş süresini
      kısar, JS'in yazdığı satır içi `transform`u durduramaz. Bu yüzden
      dönüşümü `!important` ile sıfırlayan ayrı bir kural gerekir — ve o
      kural hidrasyon beklemez, JS hiç çalışmasa bile geçerlidir.
    */
    const css = readFileSync(join(root, "app/globals.css"), "utf8");
    const reducedBlock = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));

    expect(reducedBlock).toContain("[data-rf-scroll-motion]");
    expect(reducedBlock).toMatch(/\[data-rf-scroll-motion\]\s*\{\s*transform:\s*none\s*!important/);
    // Kuralın hedefi gerçekten hareket eden öğelere konmuş olmalı.
    expect(stage.match(/data-rf-scroll-motion/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("hareket hesabı hidrasyondan sonra tümüyle bırakılır", () => {
    /*
      Faz 7: sorgu metni `lib/hooks/use-media-query.ts` içindeki paylaşılan
      sabite taşındı (servis vitrini de aynı okumayı yapıyor). Korunan şey
      yer değil DAVRANIŞ: tercih okunuyor ve kare kare hesabı bırakılıyor.
    */
    const code = stripComments(stage);

    expect(code).toContain("REDUCED_MOTION_QUERY");
    expect(code).toMatch(/prefersReducedMotion\s*\?/);
    expect(REDUCED_MOTION_QUERY).toBe("(prefers-reduced-motion: reduce)");
  });

  it("medya sorgusu hidrasyon güvenli okunur", () => {
    /*
      Sunucu medya sorgusunu bilemez. Değeri bir efektle sonradan yazmak,
      sunucu HTML'i ile ilk istemci render'ını çeliştirir ve React öznitelik
      uyuşmazlığını YAMALAMAZ — kart sessizce yanlış stille kalırdı.
      `useSyncExternalStore` bu iş için vardır: `getServerSnapshot` hidrasyon
      boyunca kullanılır, sonra gerçek değere geçilir.

      Okuma Faz 7'de paylaşılan hook'a taşındı; bekçi de oraya bakar — iki
      sahne de aynı güvenceyi oradan alır.
    */
    const hook = stripComments(readFileSync(join(root, "lib/hooks/use-media-query.ts"), "utf8"));

    expect(hook).toContain("useSyncExternalStore");
    expect(hook).toMatch(/\(\)\s*=>\s*false,/); // getServerSnapshot
    // Tercih efektle state'e yazılmamalı (React 19 `set-state-in-effect`).
    expect(hook).not.toContain("useEffect");
    expect(stripComments(stage)).toContain("useMediaQuery");
  });

  it("3D, canvas veya video kütüphanesi getirmez", () => {
    // İzin verilen tek hareket bağımlılığı framer-motion'dır.
    const code = stripComments(hero) + stripComments(stage);

    for (const forbidden of ["Canvas", "three", "<video", "@react-three"]) {
      expect(code, `${forbidden} bu görevin kapsamı dışındadır`).not.toContain(forbidden);
    }
  });

  it("kaldırılan yer tutucu geri gelmez", () => {
    expect(hero).not.toContain("TODO: hero-decision");
    expect(existsSync(join(root, "components/home/HeroPlaceholder.tsx"))).toBe(false);
  });

  it("görsel yer tutucu olduğunu alt metninde açıkça söyler", () => {
    // Sessizce gerçek ürün fotoğrafıymış gibi sunulmaz.
    expect(HERO_CONTENT.image.alt).toContain("[ÖRNEK]");
    expect(HERO_CONTENT.image.alt.length).toBeGreaterThan(20);
  });

  it("stok görsel hotlink edilmez", () => {
    // Görsel projenin kendi varlığıdır; harici bir adresten çekilmez.
    expect(HERO_CONTENT.image.src.startsWith("/")).toBe(true);
    expect(existsSync(join(root, "public", HERO_CONTENT.image.src))).toBe(true);
    expect(hero).not.toMatch(/unsplash|pexels|https?:\/\//i);
  });
});

describe("servis vitrini", () => {
  /*
    Faz 7: teknik servis konumlandırmasını (§2, §22 · 1) taşıyan, kaydırmaya
    duyarlı video bölümü.

    Testin koruduğu şey görsel sunum DEĞİL, üç sözleşmedir:
      1. Anlatı DOM metnindedir; video ve poster yalnız dekordur (§14).
      2. Video KOŞULLU yüklenir — dar ekran, azaltılmış hareket ve veri
         tasarrufu tercihlerinde hiç indirilmez; poster her durumda durur.
      3. Görüntü YEREL ve YER TUTUCUDUR; hotlink yoktur, gerçekmiş gibi
         sunulmaz.
  */
  const section = readFileSync(join(root, "components/home/ServiceShowcaseSection.tsx"), "utf8");
  const stage = readFileSync(join(root, "components/home/ServiceShowcaseStage.tsx"), "utf8");
  const stageCode = stripComments(stage);

  it("metin tek kaynaktan gelir, bileşene kopyalanmaz", () => {
    expect(section).toContain("SERVICE_SHOWCASE");
    expect(section).not.toContain("Robot süpürge; motoru");
  });

  it("metin ve CTA istemci bileşenine TAŞINMAZ (§14: JS'siz okunur kalır)", () => {
    expect(section).not.toContain('"use client"');
    expect(section).toContain("WhatsAppButton");

    expect(stage).toContain('"use client"');
    expect(stageCode).not.toContain("SERVICE_SHOWCASE");
    expect(stageCode).not.toContain("WhatsAppButton");
  });

  it("servis süreci metnini tekrar etmez — ayrı bir içerik parçasıdır", () => {
    const showcase = `${SERVICE_SHOWCASE.title} ${SERVICE_SHOWCASE.body}`;
    for (const step of SERVICE_PROCESS.steps) {
      expect(showcase, `"${step.title}" süreç adımı vitrinde tekrar edilmemeli`).not.toContain(
        step.title,
      );
      expect(showcase).not.toContain(step.body);
    }
  });

  it("video ve poster YEREL varlıklardır — hotlink yok", () => {
    const { videoSrc, poster } = SERVICE_SHOWCASE.media;

    expect(videoSrc.startsWith("/")).toBe(true);
    expect(poster.src.startsWith("/")).toBe(true);
    expect(existsSync(join(root, "public", videoSrc))).toBe(true);
    expect(existsSync(join(root, "public", poster.src))).toBe(true);

    for (const file of [section, stage]) {
      expect(file).not.toMatch(/unsplash|pexels|pixabay|cdn\./i);
      expect(stripComments(file)).not.toMatch(/https?:\/\//i);
    }
  });

  it("yer tutucu video bütçeyi aşmaz", () => {
    /*
      Bilgi dosyası §14: "Büyük 3D dosyalar ve görseller performans
      hedeflerine göre optimize edilmelidir." Gerçek çekim geldiğinde bu
      sınır bir hatırlatıcıdır: 4 MB'ı aşan bir arka plan videosu masaüstünde
      bile pahalıdır.
    */
    const bytes = statSync(join(root, "public", SERVICE_SHOWCASE.media.videoSrc)).size;
    expect(bytes).toBeLessThan(4 * 1024 * 1024);
  });

  it("görüntünün yer tutucu olduğu alt metninde açıkça yazar", () => {
    expect(SERVICE_SHOWCASE.media.poster.alt).toContain("[ÖRNEK]");
    expect(SERVICE_SHOWCASE.media.poster.alt.length).toBeGreaterThan(20);
  });

  it("video otomatik oynatma politikasına uyar ve dekoratiftir", () => {
    // `muted` olmayan bir video tarayıcıda zaten oynamaz; `playsInline`
    // iOS'ta tam ekrana atlamayı engeller.
    for (const attribute of ["autoPlay", "muted", "loop", "playsInline", 'aria-hidden="true"']) {
      expect(stageCode, `<video> ${attribute} taşımalı`).toContain(attribute);
    }
  });

  it("videonun dört kapısı da yerindedir", () => {
    expect(stageCode).toContain("(min-width: 768px)");
    expect(stageCode).toContain("REDUCED_MOTION_QUERY");
    expect(stageCode).toContain("useSaveData");
    expect(stageCode).toContain("IntersectionObserver");
    expect(stageCode).toMatch(
      /showVideo\s*=\s*isWide && !prefersReducedMotion && !savesData && isNear/,
    );
  });

  it("sorgu `min-width` yönündedir — sunucu HTML'inde <video> bulunmaz", () => {
    /*
      `useMediaQuery`nin sunucu anlık görüntüsü `false`'tur. Sorgu
      `max-width` yazılsaydı sunucu "dar değil" varsayar ve videoyu HERKESE
      gönderirdi; dar ekran onu hidrasyondan önce indirmeye başlardı.
    */
    expect(stageCode).not.toContain("max-width");
  });

  it("poster HER ZAMAN render edilir; video onun üstüne biner", () => {
    // Poster koşulun İÇİNDE olsaydı, kapılardan biri kapandığında bölüm boş
    // bir kutuya düşerdi.
    expect(stageCode.indexOf("{poster}")).toBeGreaterThan(-1);
    expect(stageCode.indexOf("{poster}")).toBeLessThan(stageCode.indexOf("showVideo &&"));
  });

  it("azaltılmış hareket tercihi JS OLMADAN da uygulanır", () => {
    // Global CSS kuralının hedefi gerçekten hareket eden öğelere konmuş olmalı.
    expect(stage.match(/data-rf-scroll-motion/g)?.length).toBeGreaterThanOrEqual(2);
    expect(stageCode).toMatch(/prefersReducedMotion\s*\?/);
  });

  it("hareket için yeni bir bağımlılık getirmez", () => {
    expect(stageCode).toContain('from "framer-motion"');
    for (const forbidden of ["gsap", "lenis", "three", "@react-three"]) {
      expect(stageCode.toLowerCase()).not.toContain(forbidden);
    }
  });
});

describe("pazaryeri butonları", () => {
  /*
    §9: bağlantı yoksa buton HİÇ gösterilmez; resmî logolar "ilgili kullanım
    kuralları gözetilerek" kullanılmalıdır. Bu yüzden kodda ne sabit mağaza
    URL'i ne de marka logosu bulunur.
  */
  const marketplace = readFileSync(join(root, "components/home/MarketplaceSection.tsx"), "utf8");
  const code = stripComments(marketplace);

  it("mağaza bağlantıları yalnız site ayarlarından gelir", () => {
    expect(code).toContain("siteConfig");
    expect(code).toContain("storeLinks");
    // Kodda sabit bir pazaryeri adresi yok.
    expect(code).not.toMatch(/https?:\/\//i);
  });

  it("bağlantı yoksa buton hiç render edilmez", () => {
    expect(code).toMatch(/storeLinks\.length > 0/);
  });

  it("resmî logo varlığı kullanılmaz", () => {
    // Ne `next/image` ile bir logo, ne de satır içi bir marka SVG'si.
    expect(code).not.toContain("next/image");
    expect(code).not.toContain("<svg");
    expect(code).not.toMatch(/logo/i);
  });

  it("pazaryerinin adı METİN olarak yazar — renk tek gösterge değildir", () => {
    expect(code).toContain("{link.label}");
    // Vurgu çizgisi ekran okuyucudan gizli, yani anlam taşımıyor.
    expect(code).toMatch(/aria-hidden="true"[\s\S]{0,200}ACCENTS\[link\.marketplace\]/);
  });

  it("bilinmeyen pazaryeri için marka rengi uydurulmaz", () => {
    expect(code).toMatch(/ACCENTS\[link\.marketplace\] \?\? "bg-link"/);
  });

  it("harici bağlantı güvenlik nitelikleriyle açılır", () => {
    // `external`, ButtonLink içinde target=_blank + rel=noopener noreferrer verir.
    expect(code).toContain("external");
    const button = readFileSync(join(root, "components/ui/Button.tsx"), "utf8");
    expect(button).toContain('rel: "noopener noreferrer"');
  });
});
