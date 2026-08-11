import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AA, ratio } from "./helpers/contrast";

/*
  Palet, TEK kaynaktan (app/globals.css) okunur ve WCAG 2.2 AA eşiklerine karşı
  DOĞRULANIR. Bir renk değiştirilirse bu testler kırılır — kontrast gerilemesi
  sessizce yayına çıkamaz.

  Dayanak: bilgi dosyası §15 erişilebilirlik kuralları.
*/

const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

/**
 * `--rf-ad: #hex;` ve `--rf-ad: var(--rf-diger);` satırlarını okur.
 * Takma adlar (alias) hex'e kadar çözülür — bir token başka bir tokena işaret
 * ediyorsa test yine gerçek rengi ölçer.
 */
function readRawTokens(source: string): Record<string, string> {
  const raw: Record<string, string> = {};
  const pattern = /(--rf-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|var\(--rf-[a-z0-9-]+\))\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    raw[match[1]] = match[2];
  }

  const resolve = (name: string, seen = new Set<string>()): string => {
    const value = raw[name];
    if (value === undefined) throw new Error(`Tanımsız token: ${name}`);
    if (value.startsWith("#")) return value;
    if (seen.has(name)) throw new Error(`Döngüsel token referansı: ${name}`);
    seen.add(name);
    return resolve(value.slice(4, -1), seen);
  };

  return Object.fromEntries(Object.keys(raw).map((name) => [name, resolve(name)]));
}

const t = readRawTokens(css);

describe("palet kaynağı", () => {
  it("globals.css tüm ham renk tokenlarını tanımlar", () => {
    for (const name of [
      "--rf-navy-900",
      "--rf-navy-700",
      "--rf-blue-600",
      "--rf-green-700",
      "--rf-whatsapp-800",
      "--rf-cyan-400",
      "--rf-ice-50",
      "--rf-white",
      "--rf-slate-700",
      "--rf-mist-200",
      "--rf-cinematic-950",
    ]) {
      expect(t[name], `${name} tanımlı olmalı`).toBeDefined();
    }
  });

  it("onaylı palet değerleri değişmemiş", () => {
    expect(t["--rf-navy-900"].toLowerCase()).toBe("#0b1f33");
    expect(t["--rf-navy-700"].toLowerCase()).toBe("#123b5d");
    expect(t["--rf-blue-600"].toLowerCase()).toBe("#1769aa");
    expect(t["--rf-green-700"].toLowerCase()).toBe("#0b6e4f");
    expect(t["--rf-whatsapp-800"].toLowerCase()).toBe("#075e54");
    expect(t["--rf-cyan-400"].toLowerCase()).toBe("#3fc7d3");
    expect(t["--rf-ice-50"].toLowerCase()).toBe("#f5f8fa");
    expect(t["--rf-slate-700"].toLowerCase()).toBe("#334155");
    expect(t["--rf-mist-200"].toLowerCase()).toBe("#d7e0e8");
    expect(t["--rf-cinematic-950"].toLowerCase()).toBe("#0b0f14");
  });

  it("reddedilen neon yeşil palette YOK", () => {
    expect(css.toLowerCase()).not.toContain("#20d994");
  });
});

describe("WCAG AA — bilgi dosyası §15 temel eşleşmeleri", () => {
  const pairs: [string, string, string][] = [
    ["Saf Beyaz / Gece Laciverti", "--rf-white", "--rf-navy-900"],
    ["Gece Laciverti / Buz Beyazı", "--rf-navy-900", "--rf-ice-50"],
    ["Saf Beyaz / Güven Yeşili", "--rf-white", "--rf-green-700"],
    ["Saf Beyaz / WhatsApp Yeşili", "--rf-white", "--rf-whatsapp-800"],
    ["Saf Beyaz / Güven Mavisi", "--rf-white", "--rf-blue-600"],
    ["Gece Laciverti / Camgöbeği", "--rf-navy-900", "--rf-cyan-400"],
  ];

  it.each(pairs)("%s normal metin AA (≥4.5:1) geçer", (_label, fg, bg) => {
    expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(AA.text);
  });
});

describe("WCAG AA — gövde metni ve koyu yüzey", () => {
  it("Koyu Arduvaz gövde metni beyaz üstünde AA geçer", () => {
    expect(ratio(t["--rf-slate-700"], t["--rf-white"])).toBeGreaterThanOrEqual(AA.text);
  });

  it("Koyu Arduvaz gövde metni Buz Beyazı üstünde AA geçer", () => {
    expect(ratio(t["--rf-slate-700"], t["--rf-ice-50"])).toBeGreaterThanOrEqual(AA.text);
  });

  it("koyu zeminde yardımcı metin (Sis Grisi) AA geçer", () => {
    expect(ratio(t["--rf-mist-200"], t["--rf-navy-900"])).toBeGreaterThanOrEqual(AA.text);
  });

  it("koyu zeminde bağlantı rengi (camgöbeği) AA geçer", () => {
    expect(ratio(t["--rf-cyan-400"], t["--rf-navy-900"])).toBeGreaterThanOrEqual(AA.text);
    expect(ratio(t["--rf-cyan-400"], t["--rf-cinematic-950"])).toBeGreaterThanOrEqual(AA.text);
  });

  it("açık zeminde bağlantı rengi (Güven Mavisi) AA geçer", () => {
    expect(ratio(t["--rf-blue-600"], t["--rf-white"])).toBeGreaterThanOrEqual(AA.text);
    expect(ratio(t["--rf-blue-600"], t["--rf-ice-50"])).toBeGreaterThanOrEqual(AA.text);
  });
});

describe("WCAG 1.4.11 — arayüz öğesi kontrastı (≥3:1)", () => {
  /*
    Sis Grisi (#D7E0E8) beyaz üstünde yalnız 1.34:1'dir. DEKORATİF ayırıcı ve
    kart kenarı olarak kullanılabilir, ancak form alanı gibi ETKİLEŞİMLİ
    kontrollerin sınırı olarak WCAG 1.4.11'i karşılamaz. Bu yüzden ayrı bir
    `--rf-steel-500` tokenı vardır ve Field bileşeni onu kullanır.
  */
  it("dekoratif sınır rengi zayıftır — bu bilinçli, test bunu kayıt altına alır", () => {
    expect(ratio(t["--rf-mist-200"], t["--rf-white"])).toBeLessThan(AA.nonText);
  });

  it("kontrol sınırı açık zeminlerde 3:1 sağlar", () => {
    expect(ratio(t["--rf-steel-600"], t["--rf-white"])).toBeGreaterThanOrEqual(AA.nonText);
    expect(ratio(t["--rf-steel-600"], t["--rf-ice-50"])).toBeGreaterThanOrEqual(AA.nonText);
  });

  it("kontrol sınırı koyu zeminlerde 3:1 sağlar", () => {
    expect(ratio(t["--rf-steel-400"], t["--rf-navy-900"])).toBeGreaterThanOrEqual(AA.nonText);
    expect(ratio(t["--rf-steel-400"], t["--rf-cinematic-950"])).toBeGreaterThanOrEqual(AA.nonText);
  });

  it("odak halkası açık zeminlerde 3:1 sağlar", () => {
    expect(ratio(t["--rf-blue-600"], t["--rf-white"])).toBeGreaterThanOrEqual(AA.nonText);
    expect(ratio(t["--rf-blue-600"], t["--rf-ice-50"])).toBeGreaterThanOrEqual(AA.nonText);
  });

  it("odak halkası koyu zeminlerde 3:1 sağlar", () => {
    expect(ratio(t["--rf-cyan-400"], t["--rf-navy-900"])).toBeGreaterThanOrEqual(AA.nonText);
    expect(ratio(t["--rf-cyan-400"], t["--rf-cinematic-950"])).toBeGreaterThanOrEqual(AA.nonText);
  });

  it("buton yüzeyleri AÇIK zeminlerden 3:1 ayrışır", () => {
    expect(ratio(t["--rf-green-700"], t["--rf-ice-50"])).toBeGreaterThanOrEqual(AA.nonText);
    expect(ratio(t["--rf-whatsapp-800"], t["--rf-ice-50"])).toBeGreaterThanOrEqual(AA.nonText);
    expect(ratio(t["--rf-blue-600"], t["--rf-ice-50"])).toBeGreaterThanOrEqual(AA.nonText);
  });

  /*
    Marka kitabı §3.6.3: dolu buton yüzeyleri KOYU zeminden ayrışmaz. Palet
    kilitli olduğu için çözüm renk değiştirmek değil, kenarlık eklemektir.
    Aşağıdaki iki test bu gerçeği ve çözümü birlikte kayıt altına alır.
  */
  it("dolu buton yüzeyleri koyu zeminden ayrışmaz — kenarlık bu yüzden zorunlu", () => {
    expect(ratio(t["--rf-green-700"], t["--rf-navy-900"])).toBeLessThan(AA.nonText);
    expect(ratio(t["--rf-whatsapp-800"], t["--rf-navy-900"])).toBeLessThan(AA.nonText);
  });

  it("koyu zemin buton kenarı üç koyu yüzeyde de 3:1 sağlar", () => {
    for (const surface of ["--rf-navy-900", "--rf-navy-700", "--rf-cinematic-950"]) {
      expect(
        ratio(t["--rf-edge-on-dark"], t[surface]),
        `buton kenarı ${surface} üstünde 3:1 sağlamalı`,
      ).toBeGreaterThanOrEqual(AA.nonText);
    }
  });
});

describe("kilitli paletin bilinen sınırları — kullanım daraltmayı kayıt altına alır", () => {
  /*
    Bunlar HATA DEĞİL, kilitli paletin kabul edilmiş sınırlarıdır. Test, birinin
    ileride bu kombinasyonu "çalışıyor sanıp" kullanmasını engeller.
  */
  it("Güven Mavisi koyu zeminde metin olamaz (marka kitabı §3.6.2)", () => {
    expect(ratio(t["--rf-blue-600"], t["--rf-navy-900"])).toBeLessThan(AA.text);
  });

  it("camgöbeği üzerine beyaz metin yazılamaz (§3.6.4)", () => {
    expect(ratio(t["--rf-white"], t["--rf-cyan-400"])).toBeLessThan(AA.text);
  });

  it("camgöbeği açık zeminde metin rengi olamaz (§3.6.4)", () => {
    expect(ratio(t["--rf-cyan-400"], t["--rf-white"])).toBeLessThan(AA.nonText);
  });

  it("camgöbeği üzerine Gece Laciverti metin AA geçer — izinli tek eşleşme", () => {
    expect(ratio(t["--rf-navy-900"], t["--rf-cyan-400"])).toBeGreaterThanOrEqual(AA.text);
  });
});

describe("durum renkleri beyaz üstünde AA geçer", () => {
  it.each([
    ["--rf-status-success", "başarı"],
    ["--rf-status-info", "bilgi"],
    ["--rf-status-warning", "uyarı"],
    ["--rf-status-danger", "hata"],
    ["--rf-status-neutral", "nötr"],
  ])("%s (%s)", (token) => {
    expect(ratio(t[token], t["--rf-white"])).toBeGreaterThanOrEqual(AA.text);
  });

  it("hover tonları da AA korur", () => {
    expect(ratio(t["--rf-white"], t["--rf-green-800"])).toBeGreaterThanOrEqual(AA.text);
    expect(ratio(t["--rf-white"], t["--rf-blue-700"])).toBeGreaterThanOrEqual(AA.text);
    expect(ratio(t["--rf-white"], t["--rf-whatsapp-900"])).toBeGreaterThanOrEqual(AA.text);
  });
});
