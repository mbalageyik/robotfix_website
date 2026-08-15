import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BRANDS_DISCLAIMER,
  COMPATIBILITY_CONTENT,
  FAQ_ITEMS,
  MARKETPLACE_CONTENT,
  SERVICE_PROCESS,
  VALUE_PROPOSITION,
} from "@/lib/home/content";

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

describe("taranan dosya kümesi", () => {
  it("bölüm bileşenlerini gerçekten buluyor", () => {
    // Yol yanlışsa testler sessizce "geçmemeli".
    expect(HOMEPAGE_FILES.length).toBeGreaterThan(10);
    expect(HOMEPAGE_FILES).toContain("components/home/HeroPlaceholder.tsx");
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
      VALUE_PROPOSITION.overline,
      COMPATIBILITY_CONTENT.overline,
      SERVICE_PROCESS.overline,
      MARKETPLACE_CONTENT.overline,
    ];

    expect(overlines.filter((text) => BRAND.test(text))).toEqual([]);
  });

  it("bileşenlerde satır içi yazılan overline'lar marka adı taşımaz", () => {
    const offenders = homepageCode.flatMap(({ file, code }) =>
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
    */
    const offenders = homepageCode.flatMap(({ file, code }) =>
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

describe("bölüm kaydı (HOMEPAGE_SECTIONS)", () => {
  /*
    Kayıt dosyası JSX içerir ve bölüm bileşenlerini (dolayısıyla next/image,
    next/link, sunucu bileşenlerini) çeker; node ortamında içe aktarmak
    testin konusu olmayan bir yükleme zinciri kurardı. Bu yüzden sıra
    KAYNAK METİNDEN doğrulanır — kontrol edilen şey zaten metnin kendisidir.
  */
  const registry = readFileSync(join(root, "components/home/sections.tsx"), "utf8");

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

  const declaredIds = [...registry.matchAll(/^\s{4}id: "([a-z-]+)",$/gm)].map((match) => match[1]);

  it("bölümler §13 akışındaki sırayla kayıtlıdır", () => {
    expect(declaredIds).toEqual(EXPECTED_ORDER);
  });

  it("aynı id iki kez kullanılmaz (çapa çakışması olmaz)", () => {
    expect(new Set(declaredIds).size).toBe(declaredIds.length);
  });

  it("onay bekleyen bölümler taslak olarak işaretlidir", () => {
    // Servis süreci ve SSS metinleri işletme onayı bekler.
    const draftCount = [...registry.matchAll(/contentStatus: "draft"/g)].length;
    expect(draftCount).toBe(2);
  });

  it("her bölümün sayfada bir karşılığı vardır", () => {
    const page = readFileSync(join(root, "app/page.tsx"), "utf8");
    // Sayfa kaydı gerçekten dolaşır; bölümleri elle sıralamaz.
    expect(page).toContain("HOMEPAGE_SECTIONS.filter");
  });
});

describe("hero yer tutucusu", () => {
  const hero = readFileSync(join(root, "components/home/HeroPlaceholder.tsx"), "utf8");

  it("değiştirileceği kod içinde işaretlidir", () => {
    expect(hero).toContain("TODO: hero-decision");
  });

  it("3D, canvas, video veya animasyon içermez", () => {
    /*
      Yorumlar hariç tutulur: kuralın kendisi ("Canvas'ta metin yok") bölümün
      başındaki gerekçede ALINTILANIR — alıntı bir ihlal değildir.
    */
    const code = stripComments(hero);

    for (const forbidden of ["Canvas", "three", "<video", "animate-", "motion."]) {
      expect(code, `Hero kararı verilmeden ${forbidden} eklenmez`).not.toContain(forbidden);
    }
  });

  it("iki CTA'yı da DOM metni olarak taşır", () => {
    expect(hero).toContain("Ürünleri İncele");
    expect(hero).toContain("whatsappCtaLabels.productInfo");
    expect(hero).toContain('href="/urunler"');
  });
});
