import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
  Analitik katmanının İHLAL EDİLEMEZ davranışlarını doğrular.

  Buradaki testlerin çoğu "GA çalışıyor mu" sorusunu değil, "izinsiz çalışmıyor
  olduğundan emin miyiz" sorusunu sorar. Bir izleyicinin sessizce fazladan
  çalışması, hiç çalışmamasından daha pahalı bir hatadır.
*/

const root = fileURLToPath(new URL("..", import.meta.url));

// ---------------------------------------------------------------------------
// Ölçüm kimliği doğrulaması
// ---------------------------------------------------------------------------

/**
 * `lib/analytics/config.ts` env'i MODÜL YÜKLENİRKEN okur. Bu yüzden her senaryo
 * için modül önbelleği sıfırlanıp yeniden içe aktarılır; aksi hâlde ilk testin
 * okuduğu değer diğerlerine sızardı.
 */
async function loadConfig(value: string | undefined) {
  vi.resetModules();
  if (value === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = value;
  return import("@/lib/analytics/config");
}

describe("GA4 ölçüm kimliği", () => {
  const original = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = original;
    vi.restoreAllMocks();
  });

  it("geçerli kimliği kabul eder", async () => {
    const { gaMeasurementId, isAnalyticsConfigured } = await loadConfig("G-ABC1234567");
    expect(gaMeasurementId).toBe("G-ABC1234567");
    expect(isAnalyticsConfigured).toBe(true);
  });

  it("baştaki ve sondaki boşlukları temizler", async () => {
    const { gaMeasurementId } = await loadConfig("  G-ABC1234567  ");
    expect(gaMeasurementId).toBe("G-ABC1234567");
  });

  it("tanımsız veya boş değerde kapanır", async () => {
    expect((await loadConfig(undefined)).isAnalyticsConfigured).toBe(false);
    expect((await loadConfig("")).isAnalyticsConfigured).toBe(false);
    expect((await loadConfig("   ")).isAnalyticsConfigured).toBe(false);
  });

  /*
    En olası kullanıcı hatası budur: panelden yanlış kimliği kopyalamak.
    Sessizce kabul edilseydi site "ölçülüyor" sanılırken hiçbir veri gelmezdi.
  */
  it.each(["GTM-ABCD123", "UA-12345678-1", "G-ABC", "ABC1234567", "g-abc1234567"])(
    "yanlış biçimi (%s) reddeder ve konsola yazar",
    async (value) => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const { gaMeasurementId } = await loadConfig(value);
      expect(gaMeasurementId).toBeNull();
      expect(error).toHaveBeenCalledOnce();
    },
  );
});

// ---------------------------------------------------------------------------
// Onay kararının saklanması
// ---------------------------------------------------------------------------

describe("çerez onayı deposu", () => {
  /**
   * Testler Node ortamında koşar; `window` yoktur, sahtesi kurulur.
   *
   * `addEventListener` de sahtelenir: depo `storage` olayına abone olur ve
   * bunlar olmadan `subscribeConsent()` çağrısı çökerdi.
   */
  function installStorage(initial: Record<string, string> = {}) {
    const store = new Map(Object.entries(initial));
    const events = new Map<string, Set<(event: unknown) => void>>();

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, value: string) => void store.set(key, value),
          removeItem: (key: string) => void store.delete(key),
        },
        addEventListener: (type: string, handler: (event: unknown) => void) => {
          if (!events.has(type)) events.set(type, new Set());
          events.get(type)?.add(handler);
        },
        removeEventListener: (type: string, handler: (event: unknown) => void) => {
          events.get(type)?.delete(handler);
        },
      },
    });

    /** Başka bir sekmede yapılmış bir yazmayı taklit eder. */
    function emitStorageEvent(key: string | null) {
      for (const handler of events.get("storage") ?? []) handler({ key });
    }

    return { store, emitStorageEvent };
  }

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("sunucuda (window yokken) 'unknown' döner", async () => {
    const { getConsentSnapshot, getConsentServerSnapshot } =
      await import("@/lib/analytics/consent");
    expect(getConsentSnapshot()).toBe("unknown");
    expect(getConsentServerSnapshot()).toBe("unknown");
  });

  it("yazılan kararı geri okur", async () => {
    installStorage();
    const { getConsentSnapshot, storeConsent } = await import("@/lib/analytics/consent");

    storeConsent("granted");
    expect(getConsentSnapshot()).toBe("granted");

    storeConsent("denied");
    expect(getConsentSnapshot()).toBe("denied");
  });

  it("kararı silince yeniden sorulur", async () => {
    installStorage();
    const { clearStoredConsent, getConsentSnapshot, storeConsent } =
      await import("@/lib/analytics/consent");

    storeConsent("granted");
    clearStoredConsent();
    expect(getConsentSnapshot()).toBe("unknown");
  });

  /*
    Onay metninin kapsamı değişirse eski "kabul" kararı yeni kapsamı KAPSAMAZ.
    Sürüm ön eki tutmayan kayıt, karar verilmemiş sayılmalıdır.
  */
  it("eski sürümlü veya bozuk kaydı yok sayar", async () => {
    installStorage({
      "rf-analytics-consent": "0:granted",
    });
    const { getConsentSnapshot } = await import("@/lib/analytics/consent");
    expect(getConsentSnapshot()).toBe("unknown");
  });

  it("depolama erişilemezse çökmez ve karar bu sekmede yaşar", async () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => {
            throw new Error("erişim reddedildi");
          },
          setItem: () => {
            throw new Error("erişim reddedildi");
          },
          removeItem: () => {
            throw new Error("erişim reddedildi");
          },
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });

    const { clearStoredConsent, getConsentSnapshot, storeConsent } =
      await import("@/lib/analytics/consent");

    // Hiç karar verilmemişken güvenli taraf: ölçüm yok.
    expect(getConsentSnapshot()).toBe("unknown");

    // Kalıcı yazma başarısız olsa da kullanıcının tercihi yok sayılmaz.
    expect(() => storeConsent("granted")).not.toThrow();
    expect(getConsentSnapshot()).toBe("granted");

    expect(() => clearStoredConsent()).not.toThrow();
    expect(getConsentSnapshot()).toBe("unknown");
  });

  /*
    `useSyncExternalStore` sözleşmesi: karar değişince ABONE UYANDIRILMALI.
    Uyandırılmazsa "Kabul et"e basıldığında GA yükleyicisi yeniden render
    edilmez ve script hiç yüklenmez.
  */
  it("karar değişince aboneleri uyandırır", async () => {
    installStorage();
    const { subscribeConsent, storeConsent } = await import("@/lib/analytics/consent");

    const listener = vi.fn();
    const unsubscribe = subscribeConsent(listener);

    storeConsent("granted");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    storeConsent("denied");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  /*
    Bir sekmede geri alınan onay, açık olan DİĞER sekmelerde de geçerlidir.
    `storage` olayı dinlenmezse öbür sekme ölçmeye devam ederdi.
  */
  it("başka sekmedeki değişikliği yansıtır", async () => {
    const { store, emitStorageEvent } = installStorage();
    const { subscribeConsent, getConsentSnapshot } = await import("@/lib/analytics/consent");

    const listener = vi.fn();
    subscribeConsent(listener);
    expect(getConsentSnapshot()).toBe("unknown");

    // Öbür sekme kabul etti.
    store.set("rf-analytics-consent", "1:granted");
    emitStorageEvent("rf-analytics-consent");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getConsentSnapshot()).toBe("granted");
  });

  it("ilgisiz bir anahtarın değişimini yok sayar", async () => {
    const { emitStorageEvent } = installStorage();
    const { subscribeConsent } = await import("@/lib/analytics/consent");

    const listener = vi.fn();
    subscribeConsent(listener);

    emitStorageEvent("baska-anahtar");
    expect(listener).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Kaynak bekçileri
// ---------------------------------------------------------------------------

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
    return entry.endsWith(".ts") || entry.endsWith(".tsx") ? [join(dir, entry)] : [];
  });
}

describe("analitik kaynak bekçileri", () => {
  const sourceFiles = ["app", "components", "lib"].flatMap(collectFiles);

  it("Google script adresi yalnız tek dosyada geçer", () => {
    const offenders = sourceFiles.filter((file) =>
      readFileSync(join(root, file), "utf8").includes("googletagmanager.com"),
    );
    expect(offenders.map((f) => f.replaceAll("\\", "/"))).toEqual([
      "components/analytics/GoogleAnalytics.tsx",
    ]);
  });

  it("ölçüm kimliği yalnız yapılandırma dosyasında okunur", () => {
    const offenders = sourceFiles.filter((file) =>
      readFileSync(join(root, file), "utf8").includes("NEXT_PUBLIC_GA_MEASUREMENT_ID"),
    );
    expect(offenders.map((f) => f.replaceAll("\\", "/"))).toEqual(["lib/analytics/config.ts"]);
  });

  /*
    En kritik bekçi: script etiketi onaya BAĞLI olmalı. `granted` kontrolü
    kaldırılırsa gtag.js onay öncesi yüklenir ve KVKK ihlali sessizce doğar.
  */
  it("gtag.js onay olmadan render edilmez", () => {
    const source = readFileSync(join(root, "components/analytics/GoogleAnalytics.tsx"), "utf8");
    expect(source).toContain('consent.state === "granted"');
    expect(source).toMatch(/if\s*\(!granted\)\s*return null;/);
  });

  it("otomatik sayfa görüntüleme kapalı (çift sayım olmaz)", () => {
    const source = readFileSync(join(root, "components/analytics/GoogleAnalytics.tsx"), "utf8");
    expect(source).toContain("send_page_view: false");
  });

  it("reklam depolama izinleri açılmaz", () => {
    const source = readFileSync(join(root, "components/analytics/GoogleAnalytics.tsx"), "utf8");
    // Onay yalnız analitik içindir; `ad_*` anahtarları "granted" olmamalıdır.
    expect(source).not.toMatch(/ad_(storage|user_data|personalization):\s*"granted"/);
  });
});
