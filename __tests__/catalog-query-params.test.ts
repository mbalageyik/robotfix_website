import { describe, expect, it } from "vitest";
import {
  DEFAULT_SORT_VALUE,
  PARAM,
  buildCatalogHref,
  firstParam,
  formatDeviceModelRef,
  hasActiveFilters,
  parseCatalogQuery,
  parseDeviceModelRef,
  parsePage,
  parseSort,
} from "@/lib/catalog/query-params";

/*
  Katalog URL sözleşmesi testleri.

  Buradaki asıl mesele güvenlik değil DOĞRULUK: kullanıcı girdisi doğrudan
  sayfalama hesabına ve sorguya gider. Bozuk girdi sessizce garip sonuç
  üretmemeli, güvenli varsayılana düşmelidir.
*/

describe("firstParam", () => {
  it("dizi gelirse ilkini alır", () => {
    expect(firstParam(["a", "b"])).toBe("a");
  });

  it("boş ve yalnız boşluktan oluşan değerleri undefined yapar", () => {
    expect(firstParam("")).toBeUndefined();
    expect(firstParam("   ")).toBeUndefined();
    expect(firstParam(undefined)).toBeUndefined();
    expect(firstParam([])).toBeUndefined();
  });

  it("kenar boşluklarını kırpar", () => {
    expect(firstParam("  fircalar  ")).toBe("fircalar");
  });
});

describe("parsePage", () => {
  it.each([
    ["parametre yok", undefined, 1],
    ["boş", "", 1],
    ["sıfır", "0", 1],
    ["negatif", "-3", 1],
    ["sayı değil", "abc", 1],
    ["ondalık", "2.9", 2],
    ["aşırı büyük", "999999", 1],
    ["geçerli", "7", 7],
  ])("%s → %s", (_label, input, expected) => {
    expect(parsePage(input)).toBe(expected);
  });
});

describe("parseSort", () => {
  it("bilinmeyen değer varsayılana düşer", () => {
    expect(parseSort("uydurma-siralama").value).toBe(DEFAULT_SORT_VALUE);
    expect(parseSort(undefined).sort).toBe("manual");
  });

  it("Türkçe URL değerini veri katmanı tipine çevirir", () => {
    expect(parseSort("fiyat-artan").sort).toBe("price_asc");
    expect(parseSort("ad-za").sort).toBe("name_desc");
  });
});

describe("parseCatalogQuery", () => {
  it("tüm filtreleri okur", () => {
    const query = parseCatalogQuery({
      [PARAM.brand]: "roborock",
      [PARAM.category]: "fircalar",
      [PARAM.deviceModel]: "roborock:s7-maxv",
      [PARAM.search]: " hepa ",
      [PARAM.sort]: "fiyat-azalan",
      [PARAM.page]: "3",
    });

    expect(query).toMatchObject({
      brandSlug: "roborock",
      categorySlug: "fircalar",
      deviceModelRef: "roborock:s7-maxv",
      search: "hepa",
      sort: "price_desc",
      page: 3,
    });
  });

  it("boş sorgu dizesinde hiçbir filtre uygulanmaz", () => {
    const query = parseCatalogQuery({});
    expect(hasActiveFilters(query)).toBe(false);
    expect(query.page).toBe(1);
  });

  it("yalnız sıralama seçilmesi 'filtre uygulandı' saymaz", () => {
    // Sıralama listeyi daraltmaz; "filtreleri temizle" bağlantısı çıkmamalı.
    const query = parseCatalogQuery({ [PARAM.sort]: "ad-az" });
    expect(hasActiveFilters(query)).toBe(false);
  });
});

describe("cihaz modeli referansı", () => {
  /*
    Model slug'ı yalnız marka içinde benzersizdir (`UNIQUE (brand_id, slug)`).
    Tohum verisinde beş markanın hepsinde `ornek-model-a` bulunur — referans
    markayı taşımazsa yanlış modele göre filtrelenmiş sonuç SESSİZCE döner.
  */
  it("marka ve modeli birlikte kodlar", () => {
    expect(formatDeviceModelRef("roborock", "ornek-model-a")).toBe("roborock:ornek-model-a");
  });

  it("gidiş dönüş bilgiyi korur", () => {
    const ref = formatDeviceModelRef("dreame", "ornek-model-a");
    expect(parseDeviceModelRef(ref)).toEqual({
      brandSlug: "dreame",
      modelSlug: "ornek-model-a",
    });
  });

  it("aynı model slug'ı farklı markalarda farklı referans üretir", () => {
    expect(formatDeviceModelRef("dreame", "ornek-model-a")).not.toBe(
      formatDeviceModelRef("ecovacs", "ornek-model-a"),
    );
  });

  it.each([
    ["boş", undefined],
    ["ayırıcı yok", "ornek-model-a"],
    ["marka boş", ":ornek-model-a"],
    ["model boş", "roborock:"],
    ["yalnız ayırıcı", ":"],
  ])("bozuk referansı yok sayar: %s", (_label, input) => {
    expect(parseDeviceModelRef(input)).toBeUndefined();
  });
});

describe("buildCatalogHref", () => {
  it("varsayılan değerleri URL'e yazmaz (tek kanonik adres)", () => {
    expect(buildCatalogHref({ page: 1, sortValue: DEFAULT_SORT_VALUE })).toBe("/urunler");
  });

  it("filtreleri Türkçe parametre adlarıyla yazar", () => {
    expect(buildCatalogHref({ brandSlug: "dreame", page: 2 })).toBe(
      "/urunler?marka=dreame&sayfa=2",
    );
  });

  it("arama terimini URL-kodlar", () => {
    const href = buildCatalogHref({ search: "ana fırça & filtre" });
    expect(href).toContain("ara=");
    // Boşluk ve '&' ham geçerse sorgu dizesi bölünürdü.
    expect(href).not.toContain("ana fırça");
    expect(href.split("?")[1]?.split("&").length).toBe(1);
  });
});
