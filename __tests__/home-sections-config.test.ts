import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  HOMEPAGE_SECTIONS_SETTING_KEY,
  HOMEPAGE_SECTION_META,
  LOCKED_SECTION_IDS,
  isLockedSection,
  parseHomeSectionsConfig,
  resolveHomeSections,
  serializeHomeSectionsConfig,
  visibleHomeSections,
  type HomeSectionsConfig,
} from "@/lib/home/section-registry";
import { SITE_SETTING_KEYS } from "@/lib/data/site-settings";

/*
  ANA SAYFA BÖLÜM YAPILANDIRMASI BEKÇİLERİ.

  Korunan sözleşme üç maddedir:
    1. Yapılandırma BOŞKEN site kod içi varsayılanlarla çalışır (regresyon yok).
    2. Zorunlu bölümler panelden KAPATILAMAZ — kural sunucuda uygulanır,
       arayüzdeki `disabled` yalnız gösterimdir.
    3. Onay bekleyen (taslak) metin, bölüm açık olsa bile yayımlanmaz.
*/

const root = fileURLToPath(new URL("..", import.meta.url));

/** Kayıttan bağımsız, küçük ve okunur bir örnek küme. */
const SAMPLE = [
  { id: "giris", label: "Açılış", contentStatus: "live", enabled: true },
  { id: "uyumluluk", label: "Uyumluluk", contentStatus: "live", enabled: true },
  { id: "surec", label: "Servis süreci", contentStatus: "draft", enabled: true },
  { id: "iletisim", label: "İletişim", contentStatus: "live", enabled: true },
] as const;

describe("boş yapılandırma", () => {
  it("kod içi varsayılanlar aynen korunur", () => {
    const resolved = resolveHomeSections(HOMEPAGE_SECTION_META, {});

    for (const [index, section] of resolved.entries()) {
      expect(section.enabled).toBe(HOMEPAGE_SECTION_META[index].enabled);
      expect(section.contentStatus).toBe(HOMEPAGE_SECTION_META[index].contentStatus);
      expect(section.isOverridden).toBe(false);
    }
  });

  it("sıra kayıttaki sırayla birebir aynıdır", () => {
    expect(resolveHomeSections(HOMEPAGE_SECTION_META, {}).map((s) => s.id)).toEqual(
      HOMEPAGE_SECTION_META.map((s) => s.id),
    );
  });

  it("yalnız onay bekleyen bölümler gizlidir", () => {
    const visible = visibleHomeSections(HOMEPAGE_SECTION_META, {}).map((s) => s.id);
    const drafts = HOMEPAGE_SECTION_META.filter((s) => s.contentStatus === "draft").map(
      (s) => s.id,
    );

    for (const id of drafts) expect(visible).not.toContain(id);
    expect(visible).toHaveLength(HOMEPAGE_SECTION_META.length - drafts.length);
  });
});

describe("zorunlu bölümler", () => {
  it("kayıtta gerçekten var olan kimliklerdir", () => {
    const ids = HOMEPAGE_SECTION_META.map((s) => s.id) as readonly string[];
    for (const id of LOCKED_SECTION_IDS) expect(ids).toContain(id);
  });

  it("panelden kapatılamaz — override yok sayılır", () => {
    const config: HomeSectionsConfig = {
      giris: { enabled: false },
      iletisim: { enabled: false, contentStatus: "draft" },
    };

    const resolved = resolveHomeSections(SAMPLE, config);
    const byId = Object.fromEntries(resolved.map((s) => [s.id, s]));

    expect(byId.giris.enabled).toBe(true);
    expect(byId.giris.locked).toBe(true);
    expect(byId.iletisim.enabled).toBe(true);
    expect(byId.iletisim.contentStatus).toBe("live");
    expect(byId.iletisim.isVisible).toBe(true);
  });

  it("aksiyon zorunlu kimlikleri hiç yazmaz", () => {
    // Arayüzdeki `disabled` bir güvenlik sınırı değildir; asıl kural sunucudadır.
    const action = readFileSync(join(root, "lib/admin/home-sections-actions.ts"), "utf8");
    expect(action).toContain("isLockedSection(section.id)");
  });

  it("isLockedSection yalnız listedeki kimlikler için doğrudur", () => {
    expect(isLockedSection("giris")).toBe(true);
    expect(isLockedSection("uyumluluk")).toBe(false);
    expect(isLockedSection("bilinmeyen")).toBe(false);
  });
});

describe("panel override'ı", () => {
  it("bölümü kapatır", () => {
    const visible = visibleHomeSections(SAMPLE, { uyumluluk: { enabled: false } });
    expect(visible.map((s) => s.id)).not.toContain("uyumluluk");
  });

  it("taslak bölümü yayına alır", () => {
    const visible = visibleHomeSections(SAMPLE, { surec: { contentStatus: "live" } });
    expect(visible.map((s) => s.id)).toContain("surec");
  });

  it("açık ama taslak bölüm yayımlanmaz", () => {
    const visible = visibleHomeSections(SAMPLE, {
      surec: { enabled: true, contentStatus: "draft" },
    });
    expect(visible.map((s) => s.id)).not.toContain("surec");
  });

  it("kapalı bölüm 'yayında' işaretlense de gösterilmez", () => {
    const visible = visibleHomeSections(SAMPLE, {
      surec: { enabled: false, contentStatus: "live" },
    });
    expect(visible.map((s) => s.id)).not.toContain("surec");
  });

  it("kayıtta olmayan kimlik görmezden gelinir", () => {
    const resolved = resolveHomeSections(SAMPLE, { kaldirilmis: { enabled: false } });
    expect(resolved.map((s) => s.id)).toEqual(SAMPLE.map((s) => s.id));
  });
});

describe("saklanan değerin ayrıştırılması", () => {
  it("gidiş-dönüş kayıpsızdır", () => {
    const config: HomeSectionsConfig = {
      uyumluluk: { enabled: false, contentStatus: "live" },
      surec: { enabled: true, contentStatus: "live" },
    };

    expect(parseHomeSectionsConfig(serializeHomeSectionsConfig(config))).toEqual(config);
  });

  it("boş değer varsayılanlara düşer", () => {
    expect(parseHomeSectionsConfig(null)).toEqual({});
    expect(parseHomeSectionsConfig("")).toEqual({});
    expect(parseHomeSectionsConfig("   ")).toEqual({});
  });

  it("bozuk JSON siteyi düşürmez, varsayılanlara düşer", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseHomeSectionsConfig("{bozuk")).toEqual({});
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("beklenmeyen biçim varsayılanlara düşer", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Dizi, sayı veya yanlış tipli alan: hiçbiri hata fırlatmamalı.
    expect(parseHomeSectionsConfig("[1,2,3]")).toEqual({});
    expect(parseHomeSectionsConfig('{"surec":{"enabled":"evet"}}')).toEqual({});
    expect(parseHomeSectionsConfig('{"surec":{"contentStatus":"yayinda"}}')).toEqual({});
    spy.mockRestore();
  });
});

describe("site_settings anahtarı", () => {
  it("ayar formunun toplu yazdığı anahtarlar arasında DEĞİLDİR", () => {
    /*
      `saveSiteSettingsAction` her kaydedişte SITE_SETTING_KEYS'in tamamını
      yazar. Bu anahtar oraya girerse ayar formu bölüm yapılandırmasını her
      kaydedişte siler.
    */
    expect(SITE_SETTING_KEYS as readonly string[]).not.toContain(HOMEPAGE_SECTIONS_SETTING_KEY);
  });

  it("şema kısıtına uyar (yalnız küçük harf, rakam, alt çizgi)", () => {
    expect(HOMEPAGE_SECTIONS_SETTING_KEY).toMatch(/^[a-z0-9_]+$/);
  });

  it("migrasyon eklenmedi — anahtar-değer tablosu olduğu gibi kullanılıyor", () => {
    const action = readFileSync(join(root, "lib/admin/home-sections-actions.ts"), "utf8");
    expect(action).toContain('from("site_settings").upsert');
    expect(action).toContain('onConflict: "key"');
  });
});

describe("panel ekranı", () => {
  const page = readFileSync(join(root, "app/admin/ana-sayfa/page.tsx"), "utf8");
  const form = readFileSync(join(root, "components/admin/HomeSectionsForm.tsx"), "utf8");

  it("sayfa kendi yetkisini doğrular ve indekslenmez", () => {
    expect(page).toContain("requireAdminPage()");
    expect(page).toContain("ADMIN_ROBOTS");
    expect(page).toContain('dynamic = "force-dynamic"');
  });

  it("kontroller gerçek form öğeleridir (klavyeyle kullanılabilir)", () => {
    expect(form).toContain('type="checkbox"');
    expect(form).toContain("<select");
    // div + onClick ile taklit edilmiş bir anahtar bırakılmamalı.
    expect(form).not.toMatch(/<div[^>]*onClick/);
  });

  it("her kontrolün bağlı bir etiketi vardır", () => {
    expect(form).toContain("htmlFor={enabledId}");
    expect(form).toContain("htmlFor={statusId}");
  });

  it("durum yalnız renkle anlatılmaz", () => {
    for (const text of ["Ana sayfada görünüyor", "Kapalı — gösterilmiyor", "Onay bekliyor"]) {
      expect(form).toContain(text);
    }
  });
});

describe("ana sayfa istemciye gizli bölüm göndermez", () => {
  it("karar sunucuda verilir", () => {
    const page = readFileSync(join(root, "app/page.tsx"), "utf8");
    // Filtre render'dan ÖNCE uygulanır; CSS ile gizleme yoktur.
    expect(page).toContain("visibleHomeSections(HOMEPAGE_SECTIONS, sectionsConfig)");
    expect(page).not.toContain("hidden");
    expect(page).not.toContain("display: none");
  });
});
