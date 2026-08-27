import { describe, expect, it } from "vitest";
import { normalizeSearchTerm } from "@/lib/data/products";

/*
  ARAMA TERİMİNİN POSTGREST DİLBİLGİSİNDEN YALITILMASI.

  Terim `or=(name.ilike.X,sku.ilike.Y)` metnine gömülür. Kaçırılmazsa
  kullanıcının yazdığı bir karakter sorgunun MANTIĞINI değiştirir. Düzeltmeden
  önce canlı olarak gözlenen davranış:

    ?ara=)  → filtre etkisizleşiyor, TÜM katalog "arama sonucu" diye dönüyordu
    ?ara=(  → hiçbir sonuç dönmüyordu
    ?ara=*  → joker olarak yorumlanıp her ürünle eşleşiyordu

  Bu testler saf fonksiyonu ölçer; anlamın PostgREST tarafında da tuttuğu
  `__tests__/db/postgrest-queries.test.ts` içinde gerçek HTTP ile doğrulanır.
  İkisi birlikte gerekir: burada sözleşme, orada davranış.
*/

describe("normalizeSearchTerm", () => {
  it("sıradan terimi olduğu gibi bırakır", () => {
    expect(normalizeSearchTerm("filtre")).toBe("filtre");
    expect(normalizeSearchTerm("  fırça  ")).toBe("fırça");
  });

  it("boş / tanımsız terim için filtre kurulmaz", () => {
    expect(normalizeSearchTerm(undefined)).toBeNull();
    expect(normalizeSearchTerm("")).toBeNull();
    expect(normalizeSearchTerm("   ")).toBeNull();
  });

  it("joker karakterler ayıklanır", () => {
    // `%` ve `*` PostgREST'te ilike jokeridir; kullanıcı girdisi joker taşımaz.
    expect(normalizeSearchTerm("fil%tre")).toBe("filtre");
    expect(normalizeSearchTerm("fil*tre")).toBe("filtre");
  });

  it("yalnız jokerden ibaret terim filtreyi HİÇ kurmaz", () => {
    /*
      Regresyon çıpası: eskiden `%` ayıklanınca geriye boş terim kalıyor ve
      `%%` deseni tüm katalogla eşleşiyordu. `null` dönmek "filtre uygulama"
      demektir; boş bir desenle her şeyi "arama sonucu" diye sunmayız.
    */
    expect(normalizeSearchTerm("*")).toBeNull();
    expect(normalizeSearchTerm("%")).toBeNull();
    expect(normalizeSearchTerm("%*%")).toBeNull();
  });

  it("dilbilgisi karakterleri terimde KALIR — tırnak onları düz metin yapar", () => {
    /*
      `,` `(` `)` `.` ayıklanmaz; çünkü çözüm ayıklamak değil, terimi çift
      tırnak içine almaktır. Ayıklamak arama kalitesini bozardı: "Model A, B"
      gibi gerçek bir ürün adı aranamaz hâle gelirdi.
    */
    expect(normalizeSearchTerm("Model A, B")).toBe("Model A, B");
    expect(normalizeSearchTerm("fırça (uzun)")).toBe("fırça (uzun)");
    expect(normalizeSearchTerm(")")).toBe(")");
  });

  it("tırnak ve ters bölü kaçırılır", () => {
    // Tırnağın kendisi kaçırılmazsa terimi çevreleyen tırnağı kapatırdı.
    expect(normalizeSearchTerm('a"b')).toBe('a\\"b');
    expect(normalizeSearchTerm("a\\b")).toBe("a\\\\b");
    // Ters bölü ÖNCE kaçırılır; aksi hâlde tırnağın kaçışını bozardı.
    expect(normalizeSearchTerm('a\\"b')).toBe('a\\\\\\"b');
  });

  it("enjeksiyon denemesi tek bir arama terimi olarak kalır", () => {
    // Gerçek bir saldırı dizgisi: or-grubunu kapatıp yeni koşul eklemeye çalışır.
    const injected = normalizeSearchTerm("a),id.gt.0,(name.ilike.");
    expect(injected).toBe("a),id.gt.0,(name.ilike.");
    // Kritik nokta: kaçış gerektiren karakter (tırnak/ters bölü) yoksa terim
    // değişmez — güvenliği sağlayan şey ÇEVRELEYEN TIRNAKTIR, ayıklama değil.
    expect(injected).not.toContain('"');
  });
});
