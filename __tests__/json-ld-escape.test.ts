import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { jsonLdHtml, serializeJsonLd } from "@/lib/seo/json-ld";

/*
  ============================================================================
  JSON-LD KAÇIRMA BEKÇİLERİ
  ============================================================================

  Korunan sözleşme: `<script type="application/ld+json">` gövdesine giren
  metin, HTML ayrıştırıcısının bloğu erken kapatmasına yol açamaz.

  Neden bekçi gerekiyor: JSON-LD'yi besleyen alanların çoğu yöneticinin
  panelden yazdığı serbest metindir (ürün adı, açıklaması, adres). Kaçırma
  unutulursa sonuç depolanmış XSS olur ve HİÇBİR tip kontrolü bunu yakalamaz —
  `JSON.stringify` geçerli JSON üretmeye devam eder.
*/

const root = fileURLToPath(new URL("..", import.meta.url));

describe("serializeJsonLd", () => {
  it("`</script>` dizisini kırar — asıl saldırı yolu budur", () => {
    const payload = { name: 'Ürün</script><script>alert("xss")</script>' };
    const out = serializeJsonLd(payload);

    expect(out).not.toContain("</script");
    expect(out).not.toContain("<script");
    // Veri KAYBOLMAZ, yalnız kaçırılır.
    expect(JSON.parse(out.replaceAll("\\u003c", "<").replaceAll("\\u003e", ">"))).toEqual(payload);
  });

  it("büyük/küçük harf ve boşluklu kapanış varyantlarını da kırar", () => {
    for (const attack of ["</SCRIPT>", "</script >", "</ScRiPt\n>", "<!--<script>"]) {
      expect(serializeJsonLd({ v: attack })).not.toMatch(/<\/?\s*script/i);
    }
  });

  it("satır ve paragraf ayırıcıları kaçırır (JSON'da geçerli, JS'te satır sonu)", () => {
    const out = serializeJsonLd({ v: "a\u2028b\u2029c" });

    expect(out).not.toContain("\u2028");
    expect(out).not.toContain("\u2029");
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
  });

  it("çıktı hâlâ geçerli JSON'dur — kaçırma veriyi bozmaz", () => {
    const data = {
      "@context": "https://schema.org",
      name: "Robot Fix & Ortakları <test>",
      description: 'Tırnak " ve ters bölü \\ ve satır\nsonu',
      price: 1234.5,
      nested: { list: [1, 2, "üç"] },
    };

    // Kaçırılan diziler JSON ayrıştırıcısı için zaten geçerli birer kaçıştır.
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("`&` kaçırılır — yorum açıcı ve varlık dizilerini etkisiz bırakır", () => {
    expect(serializeJsonLd({ v: "a&b" })).toContain("\\u0026");
  });

  it("jsonLdHtml, React'in beklediği biçimi döndürür", () => {
    expect(jsonLdHtml({ a: 1 })).toEqual({ __html: '{"a":1}' });
  });
});

/*
  İkinci savunma hattı: kaçırmayı ATLAYAN bir çağrı yeri kalmamalı.
  Yardımcının var olması yetmez; birileri yarın yine `JSON.stringify` yazarsa
  bu test kırılır.
*/
describe("hiçbir çağrı yeri kaçırmayı atlamaz", () => {
  function collect(dir: string): string[] {
    const absolute = join(root, dir);
    let entries: string[];
    try {
      entries = readdirSync(absolute);
    } catch {
      return [];
    }
    return entries.flatMap((entry) => {
      const full = join(absolute, entry);
      if (statSync(full).isDirectory()) return collect(join(dir, entry));
      return entry.endsWith(".tsx") || entry.endsWith(".ts")
        ? [join(dir, entry).replaceAll("\\", "/")]
        : [];
    });
  }

  it("`dangerouslySetInnerHTML` yalnız jsonLdHtml ile beslenir", () => {
    const offenders = ["app", "components"]
      .flatMap(collect)
      .map((file) => ({ file, code: readFileSync(join(root, file), "utf8") }))
      .filter(({ code }) => code.includes("dangerouslySetInnerHTML"))
      .filter(({ code }) => /dangerouslySetInnerHTML=\{\{/.test(code))
      .map(({ file }) => file);

    expect(
      offenders,
      "JSON-LD `lib/seo/json-ld.ts` üzerinden yazılır; ham nesne verilmez.",
    ).toEqual([]);
  });
});
