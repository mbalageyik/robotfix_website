import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SERVICE_IMAGE_DIR,
  SERVICE_IMAGE_ENTRIES,
  getServiceImage,
} from "@/lib/home/service-media";

/*
  HİZMET PANELİ GÖRSELLERİ — BEKÇİLER.

  Görseller yer tutucudur ve lisanslıdır; ikisi de zamanla unutulabilecek
  bilgilerdir. Bu dosya üç şeyi otomatik tutar:

    1. Hotlink yok — her yol YEREL bir dosyaya çıkar (bilgi dosyası §14'ün
       "3D/medya yüklenmese de içerik ayakta" ilkesinin medya tarafı: üçüncü
       bir sunucuya bağımlılık kurulmaz).
    2. Ağırlık sınırı — bir bölüm zemini uğruna sayfa şişmez.
    3. LİSANS KAYDI — `docs/varlik-lisanslari.md` içinde satırı olmayan dosya
       kabul edilmez. O dosyanın kendi başlığındaki kural budur: "lisans
       bilgisi olmayan varlık, ileride kaldırılması gereken bir yükümlülüktür".

  Ayrıca eşlemenin BOZULMASININ zararsız olduğu doğrulanır: tanınmayan bir
  `icon_key` panel bileşenini düşürmez, degrade + simge zeminine döner.
*/

const root = fileURLToPath(new URL("..", import.meta.url));

/** Tek bir dosya için üst sınır — reçete çıktıları bunun altında kalır. */
const MAX_BYTES_PER_IMAGE = 500 * 1024;
/** Sekiz panelin toplam ağırlığı. */
const MAX_TOTAL_BYTES = 3 * 1024 * 1024;

describe("hizmet görselleri eşlemesi", () => {
  it("boş değil (eşleme sessizce silinmemiş)", () => {
    expect(SERVICE_IMAGE_ENTRIES.length).toBeGreaterThan(0);
  });

  it("anahtarlar `components/ui/icons.tsx` içindeki simge anahtarlarıyla aynı kümeden", () => {
    /*
      Bir hizmetin simgesi ve fotoğrafı AYRI iki isimle seçilmez: fotoğrafı
      olup simgesi olmayan bir anahtar, eşlemelerden birinin güncellenmeyi
      unuttuğunun işaretidir.
    */
    const icons = readFileSync(join(root, "components/ui/icons.tsx"), "utf8");
    const block = /const SERVICE_ICONS[^{]*\{([^}]*)\}/.exec(icons)?.[1] ?? "";
    const iconKeys = [...block.matchAll(/^\s*([a-z0-9_]+):/gm)].map((match) => match[1]);

    expect(iconKeys.length).toBeGreaterThan(0);
    for (const [key] of SERVICE_IMAGE_ENTRIES) {
      expect(iconKeys, `"${key}" için simge tanımı yok`).toContain(key);
    }
  });

  it("tanınmayan, boş ve null anahtar `null` döner — panel görselsiz çalışır", () => {
    expect(getServiceImage(null)).toBeNull();
    expect(getServiceImage(undefined)).toBeNull();
    expect(getServiceImage("")).toBeNull();
    expect(getServiceImage("bilinmeyen-anahtar")).toBeNull();
  });

  it("bilinen anahtar büyük/küçük harf ve boşluktan etkilenmez", () => {
    const [firstKey, image] = SERVICE_IMAGE_ENTRIES[0]!;
    expect(getServiceImage(`  ${firstKey.toUpperCase()} `)).toEqual(image);
  });
});

describe("hizmet görselleri YEREL varlıklardır — hotlink yok", () => {
  it.each(SERVICE_IMAGE_ENTRIES)("%s → yerel dosya", (_key, image) => {
    expect(image.src.startsWith("/")).toBe(true);
    expect(image.src.startsWith(`${SERVICE_IMAGE_DIR}/`)).toBe(true);
    expect(existsSync(join(root, "public", image.src))).toBe(true);
  });

  it("kodda uzak görsel adresi geçmez", () => {
    const source = readFileSync(join(root, "lib/home/service-media.ts"), "utf8");
    expect(source).not.toMatch(/https?:\/\/[^\s"'`]+\.(?:jpe?g|png|webp|avif)/i);
  });
});

describe("hizmet görsellerinin ağırlığı", () => {
  const sizes = SERVICE_IMAGE_ENTRIES.map(([key, image]) => ({
    key,
    src: image.src,
    bytes: statSync(join(root, "public", image.src)).size,
  }));

  it.each(sizes)("$src ≤ 500 KB", ({ bytes }) => {
    expect(bytes).toBeLessThanOrEqual(MAX_BYTES_PER_IMAGE);
  });

  it("toplam ≤ 3 MB", () => {
    const total = sizes.reduce((sum, entry) => sum + entry.bytes, 0);
    expect(total).toBeLessThanOrEqual(MAX_TOTAL_BYTES);
  });
});

describe("lisans kaydı", () => {
  const record = readFileSync(join(root, "docs/varlik-lisanslari.md"), "utf8");

  it.each(SERVICE_IMAGE_ENTRIES)("%s dosyası kayıtta geçiyor", (_key, image) => {
    expect(record, "docs/varlik-lisanslari.md içine satır eklenmeli").toContain(
      basename(image.src),
    );
  });

  it("kayıt lisansı ve yer tutucu statüsünü söylüyor", () => {
    expect(record).toContain("Pexels License");
    expect(record).toMatch(/yer tutucu/i);
  });
});

describe("panelde görsel dekoratiftir", () => {
  const panels = readFileSync(join(root, "components/home/ServicePanels.tsx"), "utf8");

  it("alt metni boştur — anlatı DOM metnindedir", () => {
    /*
      Hizmet adı ve açıklaması panelde metin olarak durur; fotoğrafın ekran
      okuyucuya ayrıca anlatılması sekiz panelde tekrar eden bir gürültü
      olurdu (gerekçe: `lib/home/service-media.ts`).
    */
    expect(panels).toMatch(/alt=""/);
  });

  it("görsel yoksa degrade + simge zemini korunur", () => {
    // Yedek yol silinirse görselsiz hizmet boş bir kutuya düşer.
    expect(panels).toContain("item.image ?");
    expect(panels).toContain("ServiceIcon &&");
  });
});
