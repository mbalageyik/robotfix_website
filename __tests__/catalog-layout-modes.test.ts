import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYOUT_MODE,
  LAYOUTS,
  findLayout,
  isLayoutDisabled,
  layoutTransition,
} from "@/lib/catalog/layout-modes";

/*
  Katalog görünüm düzenleri.

  Bu testler işaretlemeyi değil SÖZLEŞMEYİ korur: her düzenin bir `sizes`
  değeri olduğunu, erişilebilirlik etiketinin boş kalmadığını ve azaltılmış
  hareket tercihinin animasyonu gerçekten SIFIRLADIĞINI. Üçü de gözle bakınca
  fark edilmesi zor, sessizce bozulması kolay şeylerdir.
*/

describe("katalog düzen tablosu", () => {
  it("üç düzen vardır ve kimlikleri benzersizdir", () => {
    expect(LAYOUTS).toHaveLength(3);
    expect(new Set(LAYOUTS.map((layout) => layout.mode)).size).toBe(3);
  });

  it("her düzenin erişilebilirlik etiketi ve görünen etiketi vardır", () => {
    for (const layout of LAYOUTS) {
      expect(layout.ariaLabel.trim(), `${layout.mode} ariaLabel`).not.toBe("");
      expect(layout.label.trim(), `${layout.mode} label`).not.toBe("");
    }
  });

  /*
    `sizes`, tarayıcının hangi dosyayı indireceğini belirler. Boş ya da
    kopyalanmış bir değer, bir düzende gereksiz büyük dosya indirilmesine ya da
    bulanık görsele yol açar — ikisi de gözle hemen fark edilmez.
  */
  it("her düzen KENDİ `sizes` değerini taşır", () => {
    const sizes = LAYOUTS.map((layout) => layout.imageSizes);
    for (const value of sizes) {
      expect(value.trim()).not.toBe("");
    }
    expect(new Set(sizes).size, "iki düzen aynı `sizes` değerini paylaşamaz").toBe(sizes.length);
  });

  it("varsayılan düzen tabloda gerçekten vardır", () => {
    expect(() => findLayout(DEFAULT_LAYOUT_MODE)).not.toThrow();
  });

  it("bilinmeyen düzen sessizce yutulmaz", () => {
    // @ts-expect-error — kasıtlı geçersiz değer.
    expect(() => findLayout("kolaj")).toThrow();
  });
});

describe("dar ekran kısıtı", () => {
  it("yalnız dört sütun dar ekranda kapalıdır", () => {
    const disabledOnNarrow = LAYOUTS.filter((layout) => isLayoutDisabled(layout, false)).map(
      (layout) => layout.mode,
    );
    expect(disabledOnNarrow).toEqual(["grid4"]);
  });

  it("geniş ekranda hiçbir düzen kapalı değildir", () => {
    const disabledOnWide = LAYOUTS.filter((layout) => isLayoutDisabled(layout, true));
    expect(disabledOnWide).toEqual([]);
  });

  /*
    Kapalı bir düzen NEDENİNİ söylemek zorundadır: kullanıcı yalnız soluk bir
    düğme görmemeli, niçin kapalı olduğunu okuyabilmelidir.
  */
  it("dar ekranda kapatılan her düzenin gerekçesi vardır", () => {
    for (const layout of LAYOUTS) {
      if (isLayoutDisabled(layout, false)) {
        expect(layout.narrowScreenNote?.trim(), `${layout.mode} gerekçesi`).toBeTruthy();
      }
    }
  });
});

describe("azaltılmış hareket", () => {
  it("tercih açıkken animasyon süresi SIFIRDIR", () => {
    expect(layoutTransition(true)).toEqual({ duration: 0 });
  });

  it("tercih kapalıyken yaylı geçiş kullanılır", () => {
    const transition = layoutTransition(false);
    expect(transition).toHaveProperty("type", "spring");
    expect(transition).not.toHaveProperty("duration", 0);
  });
});
