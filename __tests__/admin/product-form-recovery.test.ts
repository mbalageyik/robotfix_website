import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { FORM_ERROR_KEY, fieldErrorsFromZodIssues } from "@/lib/admin/action-result";
import {
  parseCollectionField,
  productFormValuesFromFormData,
} from "@/lib/admin/product-form-input";
import { productSchema, productSubResourcesSchema } from "@/lib/admin/schemas";

/*
  ============================================================================
  DOĞRULAMA HATASINDA VERİ KAYBI OLMAMASI
  ============================================================================

  Bu testlerin koruduğu şey bir görünüm ayrıntısı değil: uzun bir ürün formunu
  doldurup gönderen ve tek bir alan hatası yüzünden HER ŞEYİ kaybeden bir
  yöneticinin işi. Kayıp sessizdi — ne konsolda bir hata, ne de ekranda bir
  uyarı vardı; yalnız boşalmış kutular.

  Üç ayrı mekanizma denetlenir:
    1. Sunucu, aldığı formu eksiksiz geri okuyabiliyor mu (geri basılacak veri).
    2. Hata haritası SATIR VE ALAN düzeyini koruyor mu (hangi kutu hatalı).
    3. Formun kendisi kontrollü mü ve React'in otomatik sıfırlaması kapalı mı.
*/

// ---------------------------------------------------------------------------
// 1. Gönderilen form eksiksiz geri okunur
// ---------------------------------------------------------------------------

/** Doldurulmuş bir ürün formunun gönderdiği `FormData`. */
function filledFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  const fields: Record<string, string> = {
    name: "Fırça modülü",
    slug: "firca-modulu",
    brandId: "6f3a1f2c-1d4e-4b6a-9c1e-2f7d5a8b3c40",
    categoryId: "",
    sku: "FM-100",
    shortDescription: "Kısa açıklama.",
    longDescription: "Uzun açıklama.",
    price: "1249,90",
    compareAtPrice: "",
    availability: "limited",
    isOriginal: "compatible",
    boxContents: "1 adet fırça",
    installationNotes: "Montaj notu",
    isFeatured: "on",
    displayOrder: "7",
    status: "active",
    seoTitle: "SEO başlığı",
    seoDescription: "SEO açıklaması",
    specs: JSON.stringify([
      { label: "Ağırlık", value: "3,2 kg" },
      { label: "Renk", value: "" },
    ]),
    compatibleModelIds: JSON.stringify(["model-a", "model-b"]),
    marketplaceLinks: JSON.stringify([
      {
        marketplace: "other",
        customLabel: "",
        url: "http://ornek.test",
        linkTarget: "store",
        isActive: false,
      },
    ]),
    relatedProductIds: JSON.stringify(["urun-a"]),
    ...overrides,
  };

  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

describe("gönderilen formun geri okunması", () => {
  it("her alanı yazıldığı gibi geri verir", () => {
    const values = productFormValuesFromFormData(filledFormData());

    expect(values.name).toBe("Fırça modülü");
    expect(values.slug).toBe("firca-modulu");
    expect(values.sku).toBe("FM-100");
    expect(values.shortDescription).toBe("Kısa açıklama.");
    expect(values.longDescription).toBe("Uzun açıklama.");
    expect(values.price).toBe("1249,90");
    expect(values.availability).toBe("limited");
    expect(values.isOriginal).toBe("compatible");
    expect(values.boxContents).toBe("1 adet fırça");
    expect(values.installationNotes).toBe("Montaj notu");
    expect(values.isFeatured).toBe(true);
    expect(values.displayOrder).toBe("7");
    expect(values.status).toBe("active");
    expect(values.seoTitle).toBe("SEO başlığı");
  });

  it("dinamik satırların TAMAMINI korur — hatalı olanlar dâhil", () => {
    const values = productFormValuesFromFormData(filledFormData());

    // Boş değerli özellik şemadan geçmez ama forma geri basılmalıdır:
    // kullanıcı kendi yazdığı satırı görmeden düzeltemez.
    expect(values.specs).toEqual([
      { label: "Ağırlık", value: "3,2 kg" },
      { label: "Renk", value: "" },
    ]);
    expect(values.compatibleModelIds).toEqual(["model-a", "model-b"]);
    expect(values.relatedProductIds).toEqual(["urun-a"]);
    expect(values.marketplaceLinks).toEqual([
      {
        marketplace: "other",
        customLabel: "",
        url: "http://ornek.test",
        linkTarget: "store",
        isActive: false,
      },
    ]);
  });

  it("geçersiz değeri OLAN alanı da geri verir (temizlemez)", () => {
    // Şemanın reddedeceği bir fiyat. Yine de forma geri döner ki kullanıcı
    // yazdığı şeyi görüp düzeltebilsin.
    const values = productFormValuesFromFormData(filledFormData({ price: "sıfır" }));
    expect(values.price).toBe("sıfır");
    expect(productSchema.safeParse({ ...VALID_PRODUCT, priceMinor: "sıfır" }).success).toBe(false);
  });

  it("kimliksiz form (yeni ürün) için id null döner", () => {
    expect(productFormValuesFromFormData(filledFormData()).id).toBeNull();
    expect(productFormValuesFromFormData(filledFormData({ id: "abc" })).id).toBe("abc");
  });

  it("tanınmayan seçim değerlerini bilinen varsayılana düşürür", () => {
    /*
      Seçim listeleri istemciden gelir ve elle değiştirilebilir. Listede
      olmayan bir değeri `select` kutusuna basmak "hiçbiri seçili değil"
      görüntüsü üretir; kullanıcı neyi kaybettiğini göremez.
    */
    const values = productFormValuesFromFormData(
      filledFormData({ availability: "uydurma", status: "uydurma", isOriginal: "uydurma" }),
    );
    expect(values.availability).toBe("on_order");
    expect(values.status).toBe("draft");
    expect(values.isOriginal).toBe("unknown");
  });
});

describe("koleksiyon alanının okunması", () => {
  it("boş alanı boş dizi sayar", () => {
    const formData = new FormData();
    formData.set("specs", "");
    expect(parseCollectionField(formData, "specs")).toEqual([]);
    expect(parseCollectionField(formData, "hicYok")).toEqual([]);
  });

  it("bozuk JSON'u SESSİZCE BOŞALTMAZ — null döner", () => {
    /*
      Eski davranış `?? []` idi: ayrıştırılamayan bir koleksiyon boş diziye
      düşer ve kullanıcının tüm satırları hiçbir uyarı olmadan silinirdi.
      `null` dönmesi, aksiyonun bunu bir hata olarak bildirmesini sağlar.
    */
    const formData = new FormData();
    formData.set("specs", "{bozuk");
    formData.set("compatibleModelIds", '{"dizi":"değil"}');
    expect(parseCollectionField(formData, "specs")).toBeNull();
    expect(parseCollectionField(formData, "compatibleModelIds")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Hata haritası satır ve alan düzeyini korur
// ---------------------------------------------------------------------------

const VALID_PRODUCT = {
  name: "Fırça modülü",
  slug: "",
  brandId: "",
  categoryId: "",
  sku: "",
  shortDescription: "",
  longDescription: "",
  priceMinor: "",
  compareAtPriceMinor: "",
  availability: "in_stock",
  isOriginal: "unknown",
  boxContents: "",
  installationNotes: "",
  isFeatured: false,
  displayOrder: "0",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
} as const;

describe("alan bazlı hata haritası", () => {
  it("iç içe dizideki hatayı SATIR VE ALANIYLA anahtarlar", () => {
    const parsed = productSubResourcesSchema.safeParse({
      specs: [
        { label: "Ağırlık", value: "3,2 kg" },
        { label: "Renk", value: "" },
      ],
      compatibleModelIds: [],
      marketplaceLinks: [],
      relatedProductIds: [],
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const errors = fieldErrorsFromZodIssues(parsed.error.issues);
    expect(errors["specs.1.value"]).toBe("Özellik değeri zorunludur.");
    // Birinci satır hatasızdır; ona hata yazılmamalı.
    expect(errors["specs.0.value"]).toBeUndefined();
  });

  it("pazaryeri satırının hangi alanının bozuk olduğunu ayırır", () => {
    const parsed = productSubResourcesSchema.safeParse({
      specs: [],
      compatibleModelIds: [],
      marketplaceLinks: [
        {
          marketplace: "other",
          customLabel: "",
          url: "http://ornek.test",
          linkTarget: "product",
          isActive: true,
        },
      ],
      relatedProductIds: [],
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const errors = fieldErrorsFromZodIssues(parsed.error.issues);
    expect(errors["marketplaceLinks.0.url"]).toBe("Bağlantı https:// ile başlamalıdır.");
    expect(errors["marketplaceLinks.0.customLabel"]).toBe(
      '"Diğer" seçildiğinde görünen ad zorunludur.',
    );
  });

  it("`flatten()` bu ayrımı kaybeder — bu yüzden kullanılmıyor", () => {
    /*
      Kök nedenin kendisi. `z.flattenError()` yalnız birinci seviye anahtarı
      tutar: iki farklı satırın iki farklı alanı tek bir "marketplaceLinks"
      girdisine sıkışır ve form hiçbir kutuyu işaretleyemez.
    */
    const parsed = productSubResourcesSchema.safeParse({
      specs: [{ label: "", value: "" }],
      compatibleModelIds: [],
      marketplaceLinks: [],
      relatedProductIds: [],
    });
    if (parsed.success) throw new Error("bu girdi geçerli olmamalıydı");

    const flattened = Object.keys(z.flattenError(parsed.error).fieldErrors);
    expect(flattened).toEqual(["specs"]);
    expect(Object.keys(fieldErrorsFromZodIssues(parsed.error.issues))).toContain("specs.0.label");
  });

  it("düz şemada `flatten()` ile aynı anahtarları üretir", () => {
    const parsed = productSchema.safeParse({ ...VALID_PRODUCT, name: "", seoTitle: "x".repeat(80) });
    if (parsed.success) throw new Error("bu girdi geçerli olmamalıydı");

    const errors = fieldErrorsFromZodIssues(parsed.error.issues);
    expect(errors.name).toBe("Ürün adı zorunludur.");
    expect(errors.seoTitle).toBe("SEO başlığı en fazla 70 karakter olabilir.");
  });

  it("aynı alanın ilk hatasını kullanır", () => {
    const errors = fieldErrorsFromZodIssues([
      { path: ["name"], message: "İlk" },
      { path: ["name"], message: "İkinci" },
    ]);
    expect(errors.name).toBe("İlk");
  });

  it("yolu olmayan hatayı form geneline yazar", () => {
    const errors = fieldErrorsFromZodIssues([{ path: [], message: "Genel" }]);
    expect(errors[FORM_ERROR_KEY]).toBe("Genel");
  });

  it("alt kayıt mesajları Türkçedir", () => {
    // Bu mesajlar artık ilgili satırın altında GÖSTERİLİYOR; "Invalid UUID"
    // orada kullanıcıya hiçbir şey anlatmaz.
    const parsed = productSubResourcesSchema.safeParse({
      specs: [],
      compatibleModelIds: ["uuid-değil"],
      marketplaceLinks: [],
      relatedProductIds: ["uuid-değil"],
    });
    if (parsed.success) throw new Error("bu girdi geçerli olmamalıydı");

    const errors = fieldErrorsFromZodIssues(parsed.error.issues);
    expect(errors["compatibleModelIds.0"]).toMatch(/cihaz modeli/i);
    expect(errors["relatedProductIds.0"]).toMatch(/ürün seçimi/i);
  });
});

// ---------------------------------------------------------------------------
// 3. Formun kendisi: kontrollü alanlar + otomatik sıfırlama kapalı
// ---------------------------------------------------------------------------

/*
  Kaynak denetimi. Sebebi güvenlik bekçileriyle aynı: ihlal SESSİZDİR.

  React `<form action={fn}>` gönderiminden sonra formu otomatik sıfırlar.
  Birisi bir alanı `value` yerine `defaultValue` ile yazarsa o alan gönderim
  sonrası boşalır; kimse fark etmez, test kırılmaz, yalnız kullanıcı verisini
  kaybeder. Aynı şekilde `onReset` koruması kaldırılırsa onay kutuları DOM'da
  sıfırlanır ve React durumuyla çelişir.
*/
const productFormSource = readFileSync(
  fileURLToPath(new URL("../../components/admin/ProductForm.tsx", import.meta.url)),
  "utf8",
);

describe("ürün formu kaynak bekçileri", () => {
  it("hiçbir alan `defaultValue`/`defaultChecked` ile beslenmiyor", () => {
    expect(productFormSource).not.toMatch(/defaultValue=/);
    expect(productFormSource).not.toMatch(/defaultChecked=/);
  });

  it("React'in otomatik form sıfırlaması iptal ediliyor", () => {
    expect(productFormSource).toMatch(/onReset=\{\(event\) => event\.preventDefault\(\)\}/);
  });

  it("gönderim sonucundaki değerler forma geri basılıyor", () => {
    expect(productFormSource).toMatch(/if \(state\.values\) setDraft\(state\.values\)/);
  });

  it("hata sonrası ilk hatalı öğeye odaklanılıyor", () => {
    expect(productFormSource).toContain('[aria-invalid="true"], [data-error-anchor="true"]');
    expect(productFormSource).toMatch(/scrollIntoView/);
    expect(productFormSource).toMatch(/\.focus\(\{ preventScroll: true \}\)/);
  });
});
