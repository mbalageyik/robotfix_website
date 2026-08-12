import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  ₺ (U+20BA) YEDEK ZİNCİRİ BEKÇİSİ.

  ÖLÇÜM (tarayıcıda canvas advance, varsayım değil):
    JetBrains Mono tek genişliklidir — taşıdığı her glif 100px'te 60 ölçülür
    (`A M i 0 W . ı ğ Ş € $ £` dâhil). ₺ ise 55.62 ölçülür, yani font bu glifi
    TAŞIMAZ ve tarayıcı yedeğe düşer.
    Archivo (57.8) ve Manrope (60.97) ₺'yi kendi metrikleriyle çizer — taşırlar.

  Bu yüzden mono zincirine Manrope EKLENDİ: ₺ rastgele bir sistem fontundan
  değil, zaten yüklü olan marka fontundan gelsin. Bu test o zinciri korur —
  biri Manrope'u zincirden çıkarırsa ₺ sessizce yabancı bir glife döner ve
  kimse fark etmez.

  Not: bu bir KAYNAK testidir; gerçek render ölçümü tarayıcıda yapılmıştır ve
  `/veri-kontrol` sayfasındaki "₺ glif kontrolü" kartı gözle doğrulamayı sürdürür.
*/

const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");

function monoStack(): string {
  const match = css.match(/--font-mono:\s*([^;]+);/);
  if (!match) throw new Error("`--font-mono` tanımı app/globals.css içinde bulunamadı.");
  return match[1].replace(/\s+/g, " ").trim();
}

describe("₺ (U+20BA) yedek zinciri", () => {
  it("mono zinciri teknik fontla BAŞLAR (rakam hizası korunur)", () => {
    expect(monoStack().startsWith("var(--font-technical)")).toBe(true);
  });

  it("mono zincirinde gövde fontu YER ALIR — ₺ buradan gelir", () => {
    expect(monoStack()).toContain("var(--font-body)");
  });

  it("gövde fontu jenerik monospace'ten ÖNCE gelir", () => {
    const stack = monoStack();
    const body = stack.indexOf("var(--font-body)");
    const generic = stack.indexOf("ui-monospace");

    expect(body).toBeGreaterThan(-1);
    expect(generic).toBeGreaterThan(-1);
    // Sıra bozulursa ₺ yine sistem fontuna düşer; zincir sırası kritiktir.
    expect(body).toBeLessThan(generic);
  });

  it("latin-ext alt kümesi üç ailede de istenir (ğ ş ı İ ve ₺ oradadır)", () => {
    const layout = readFileSync(
      fileURLToPath(new URL("../app/layout.tsx", import.meta.url)),
      "utf8",
    );
    const subsetCount = (layout.match(/latin-ext/g) ?? []).length;
    expect(subsetCount).toBeGreaterThanOrEqual(3);
  });
});
