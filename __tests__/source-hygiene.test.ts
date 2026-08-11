import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  Kaynak hijyeni bekçileri. İki ihlal edilemez kuralı otomatik doğrular:

  1. Bileşen/uygulama kodunda HAM HEX RENK yok — tüm renkler app/globals.css
     içindeki tek token kaynağından gelir.
  2. Kodda SABİT KODLANMIŞ TELEFON NUMARASI yok — numara yalnız env'den okunur
     (bilgi dosyası §8: "kod içinde sabitlenmek yerine site ayarlarından
     yönetilebilmelidir").
*/

const root = fileURLToPath(new URL("..", import.meta.url));

/** Renk kaynağı ve testler hariç, taranacak uygulama kökleri. */
const SCANNED_DIRS = ["app", "components", "lib"];
const SCANNED_EXTENSIONS = [".ts", ".tsx"];

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
    return SCANNED_EXTENSIONS.some((ext) => entry.endsWith(ext)) ? [join(dir, entry)] : [];
  });
}

const sourceFiles = SCANNED_DIRS.flatMap(collectFiles);

describe("taranan dosya kümesi", () => {
  it("boş değil (tarama sessizce çökmemiş)", () => {
    expect(sourceFiles.length).toBeGreaterThan(8);
  });
});

describe("ham hex renk kullanımı", () => {
  /*
    `app/styleguide/page.tsx` paleti GÖSTERDİĞİ için hex metinleri içerir;
    bunlar stil değeri değil, ekranda basılan etikettir — muaf tutulur.
  */
  const EXEMPT = ["app/styleguide/page.tsx"];
  const HEX = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g;

  const offenders = sourceFiles
    .filter((file) => !EXEMPT.includes(file.replaceAll("\\", "/")))
    .map((file) => ({ file, matches: readFileSync(join(root, file), "utf8").match(HEX) ?? [] }))
    .filter((entry) => entry.matches.length > 0);

  it("bileşen ve kütüphane dosyalarında ham hex yok", () => {
    expect(
      offenders.map((o) => `${o.file}: ${o.matches.join(", ")}`),
      "Renkler yalnız app/globals.css içindeki tokenlardan gelmelidir",
    ).toEqual([]);
  });
});

describe("sabit kodlanmış telefon numarası", () => {
  /*
    Yakalanan desenler: 10+ haneli diziler ve TR yerel/uluslararası biçimler.
    Numara koda gömülemez; yalnız `process.env.NEXT_PUBLIC_WHATSAPP_PHONE`
    üzerinden okunur.
  */
  const PHONE_PATTERNS = [
    /\+90[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/,
    /\b0\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/,
    /\b90\d{10}\b/,
    /\b5\d{9}\b/,
  ];

  const offenders = sourceFiles
    .map((file) => ({ file, content: readFileSync(join(root, file), "utf8") }))
    .filter(({ content }) => PHONE_PATTERNS.some((pattern) => pattern.test(content)))
    .map(({ file }) => file);

  it("app/, components/ ve lib/ içinde telefon numarası yok", () => {
    expect(offenders, "Numara yalnız env ve .env.example içinde bulunmalıdır").toEqual([]);
  });

  it("numara env'den okunuyor", () => {
    const config = readFileSync(join(root, "lib/site-config.ts"), "utf8");
    expect(config).toContain("process.env.NEXT_PUBLIC_WHATSAPP_PHONE");
  });
});

describe("styleguide indekslenmez", () => {
  it("noindex, nofollow robots metadata'sı tanımlı", () => {
    const page = readFileSync(join(root, "app/styleguide/page.tsx"), "utf8");
    // `[^}]` zaten satır sonlarını kapsar; `s` bayrağına gerek yok.
    expect(page).toMatch(/robots:\s*\{[^}]*index:\s*false/);
    expect(page).toMatch(/robots:\s*\{[^}]*follow:\s*false/);
  });
});

describe("hareket azaltma global katmanda çözülür", () => {
  it("globals.css prefers-reduced-motion kuralı içerir", () => {
    const css = readFileSync(join(root, "app/globals.css"), "utf8");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
  });
});
