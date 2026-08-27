import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_NOT_CONFIGURED_ERROR,
  AUTH_RATE_LIMITED_ERROR,
  AUTH_UNAVAILABLE_ERROR,
  GENERIC_LOGIN_ERROR,
} from "@/lib/auth/messages";

/*
  ============================================================================
  GİRİŞ HATALARININ AYRIŞMASI
  ============================================================================

  Korunan sözleşme: "E-posta veya parola hatalı." cümlesi YALNIZ gerçekten
  kimlik bilgisi hatalıyken kurulur.

  Neden test edilmeye değer: Supabase yığını kapalıyken `signInWithPassword`
  ATMAZ, `status` alanı `0` olan bir `error` döndürür. Bu hata kimlik hatasıyla
  aynı dala düşerse panel çalışmayan bir veritabanı karşısında kullanıcıya
  "parolan yanlış" der. Kullanıcı da parolasını sıfırlamaya çalışarak saatini
  harcar — hatanın kaynağı Docker'ken.

  İkinci sözleşme değişmedi ve burada da doğrulanır: geçersiz kimlik bilgisi
  durumunda hangi alanın hatalı olduğu SIZDIRILMAZ (kullanıcı numaralandırma).
*/

interface FakeAuthError {
  status?: number;
  message: string;
}

/**
 * Aksiyon modülünü izole yükler.
 *
 * `vi.doMock` hoist EDİLMEZ, bu yüzden her senaryo kendi sahtelerini kurup
 * modülü taze içe aktarabilir. Gerçek `server-client` hiç yüklenmez; testin
 * ağ ya da çalışan bir yığın beklemesi gerekmez.
 */
async function loadSignInAction(options: {
  configured: boolean;
  /** `null` → hata yok (giriş başarılı). */
  authError?: FakeAuthError | null;
  /** İstemci kurulurken atsın mı (yapılandırma/ağ çöküşü). */
  clientThrows?: boolean;
}) {
  vi.resetModules();

  vi.doMock("@/lib/supabase/env", () => ({
    isSupabaseConfigured: options.configured,
  }));

  vi.doMock("@/lib/supabase/server-client", () => ({
    getServerClient: async () => {
      if (options.clientThrows) throw new Error("yapılandırma yok");
      return {
        auth: {
          signInWithPassword: async () => ({ error: options.authError ?? null }),
        },
      };
    },
  }));

  // Aksiyon modülü DAL'ı yalnız `getCurrentAdminEmail` için içe aktarır;
  // giriş yolunda kullanılmaz.
  vi.doMock("@/lib/auth/dal", () => ({ getAuthUser: async () => null }));

  vi.doMock("next/navigation", () => ({
    // Gerçek `redirect()` de bir istisna atar; testte yakalanabilir olsun diye
    // hedefi mesaja yazıyoruz.
    redirect: (target: string) => {
      throw new Error(`REDIRECT:${target}`);
    },
  }));

  return await import("@/lib/auth/actions");
}

function credentials(): FormData {
  const form = new FormData();
  form.set("email", "yonetici@ornek.com");
  form.set("password", "dogru-olabilir");
  return form;
}

afterEach(() => {
  vi.doUnmock("@/lib/supabase/env");
  vi.doUnmock("@/lib/supabase/server-client");
  vi.doUnmock("@/lib/auth/dal");
  vi.doUnmock("next/navigation");
});

describe("signInAction — hata ayrışması", () => {
  it("yapılandırma yokken denemeye bile girmez, sebebi söyler", async () => {
    const { signInAction } = await loadSignInAction({ configured: false });
    const state = await signInAction({ error: null }, credentials());

    expect(state.error).toBe(AUTH_NOT_CONFIGURED_ERROR);
    expect(state.error).not.toBe(GENERIC_LOGIN_ERROR);
  });

  it("yığın kapalıyken (status 0) 'parola hatalı' DEMEZ", async () => {
    const { signInAction } = await loadSignInAction({
      configured: true,
      authError: { status: 0, message: "Failed to fetch" },
    });
    const state = await signInAction({ error: null }, credentials());

    expect(state.error).toBe(AUTH_UNAVAILABLE_ERROR);
  });

  it("durum kodu hiç yokken de altyapı hatası sayar", async () => {
    const { signInAction } = await loadSignInAction({
      configured: true,
      authError: { message: "network error" },
    });
    const state = await signInAction({ error: null }, credentials());

    expect(state.error).toBe(AUTH_UNAVAILABLE_ERROR);
  });

  it("5xx de altyapı hatasıdır", async () => {
    const { signInAction } = await loadSignInAction({
      configured: true,
      authError: { status: 503, message: "Service Unavailable" },
    });
    const state = await signInAction({ error: null }, credentials());

    expect(state.error).toBe(AUTH_UNAVAILABLE_ERROR);
  });

  it("istemci kurulamazsa altyapı hatası döner, çökmez", async () => {
    const { signInAction } = await loadSignInAction({
      configured: true,
      clientThrows: true,
    });
    const state = await signInAction({ error: null }, credentials());

    expect(state.error).toBe(AUTH_UNAVAILABLE_ERROR);
  });

  it("gerçek kimlik hatası (400) genel mesajı korur", async () => {
    const { signInAction } = await loadSignInAction({
      configured: true,
      authError: { status: 400, message: "Invalid login credentials" },
    });
    const state = await signInAction({ error: null }, credentials());

    expect(state.error).toBe(GENERIC_LOGIN_ERROR);
  });

  it("429 kendi mesajını korur", async () => {
    const { signInAction } = await loadSignInAction({
      configured: true,
      authError: { status: 429, message: "Too many requests" },
    });
    const state = await signInAction({ error: null }, credentials());

    expect(state.error).toBe(AUTH_RATE_LIMITED_ERROR);
  });

  it("başarılı girişte panele yönlendirir", async () => {
    const { signInAction } = await loadSignInAction({ configured: true, authError: null });

    await expect(signInAction({ error: null }, credentials())).rejects.toThrow("REDIRECT:/admin");
  });

  it("boş form da genel mesajla döner — hangi alan olduğu sızdırılmaz", async () => {
    const { signInAction } = await loadSignInAction({ configured: true, authError: null });
    const state = await signInAction({ error: null }, new FormData());

    expect(state.error).toBe(GENERIC_LOGIN_ERROR);
  });
});

/*
  Aynı ayrım aksiyon korumasında da geçerli: yapılandırma yokken
  `getAuthUser()` her zaman `null` döndürür ve koruma "oturumunuz sona ermiş"
  derdi. Kullanıcı tekrar tekrar giriş yapmayı dener, her seferinde aynı yere
  düşerdi.
*/
describe("requireAdminAction — yapılandırma yokken", () => {
  it("'oturum sona erdi' demez, kurulum eksiğini söyler", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/env", () => ({ isSupabaseConfigured: false }));
    vi.doMock("@/lib/supabase/server-client", () => ({
      getServerClient: async () => {
        throw new Error("çağrılmamalıydı");
      },
    }));
    vi.doMock("next/navigation", () => ({
      redirect: (target: string) => {
        throw new Error(`REDIRECT:${target}`);
      },
    }));

    const { requireAdminAction } = await import("@/lib/auth/dal");
    const result = await requireAdminAction();

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toBe(AUTH_NOT_CONFIGURED_ERROR);
  });
});
