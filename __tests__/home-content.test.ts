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
  VALUE_PROPOSITION,
} from "@/lib/home/content";
import { HOMEPAGE_SECTION_META } from "@/lib/home/section-registry";

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
      expect(renderers, `${id} için render eşlemesi yok`).toMatch(
        new RegExp(`^\\s{2}${id}: `, "m"),
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

  it("hizmet adı her durumda METİN olarak durur (simge tek gösterge değil)", () => {
    // Ad butonun içinde; simge dekoratiftir.
    expect(panelCode).toContain("{item.name}");
    expect(panelCode).toMatch(/aria-hidden="true"[\s\S]{0,400}ServiceIcon/);
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
    const code = stripComments(stage);

    expect(code).toContain("(prefers-reduced-motion: reduce)");
    expect(code).toMatch(/prefersReducedMotion\s*\?/);
  });

  it("medya sorgusu hidrasyon güvenli okunur", () => {
    /*
      Sunucu medya sorgusunu bilemez. Değeri bir efektle sonradan yazmak,
      sunucu HTML'i ile ilk istemci render'ını çeliştirir ve React öznitelik
      uyuşmazlığını YAMALAMAZ — kart sessizce yanlış stille kalırdı.
      `useSyncExternalStore` bu iş için vardır: `getServerSnapshot` hidrasyon
      boyunca kullanılır, sonra gerçek değere geçilir.
    */
    const code = stripComments(stage);

    expect(code).toContain("useSyncExternalStore");
    // Tercih efektle state'e yazılmamalı (React 19 `set-state-in-effect`).
    expect(code).not.toMatch(/useEffect\([^)]*setMounted/);
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
