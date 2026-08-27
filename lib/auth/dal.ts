import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getServerClient } from "@/lib/supabase/server-client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AUTH_NOT_CONFIGURED_ERROR } from "@/lib/auth/messages";

/*
  ============================================================================
  VERİ ERİŞİM KATMANI (DAL) — yetkilendirmenin TEK kaynağı.
  ============================================================================

  Next.js kimlik doğrulama rehberinin önerdiği desen: yetki kontrolü veri
  kaynağına mümkün olduğunca YAKIN yapılır, düzen (layout) bileşenine değil.

  NEDEN LAYOUT'A GÜVENİLMEZ (Next.js dokümanı, "Layouts and auth checks"):
  kısmi render nedeniyle layout gezinmede yeniden çalışmaz; ayrıca layout,
  alt segmentlerin render edilip edilmeyeceğini KONTROL ETMEZ — segmentler
  router tarafından render edilir ve RSC yükünde görünebilir. Bu yüzden
  `app/admin/layout.tsx` bir güvenlik sınırı DEĞİLDİR; her sayfa ve her
  server action yetkisini KENDİ doğrular.

  `proxy.ts` de güvenlik sınırı değildir — yalnız iyimser (optimistic) bir ön
  eleme yapar ve oturum çerezini tazeler.

  Üç savunma hattı:
    1. proxy.ts        → iyimser yönlendirme (UX + prefetch elemesi)
    2. bu DAL          → her sayfa/aksiyonda gerçek kontrol (uygulama hattı)
    3. Postgres RLS    → veritabanı hattı (uygulama hata yapsa bile tutar)
*/

/**
 * Oturumdaki kullanıcı — yoksa `null`.
 *
 * `getUser()` kullanılır, `getSession()` DEĞİL: `getSession()` çerezdeki JWT'yi
 * doğrulamadan okur ve çerez istemci tarafından üretilebilir. `getUser()` her
 * çağrıda token'ı Auth sunucusuna doğrulatır.
 *
 * `cache()` ile tek render geçişinde yalnız bir kez çalışır.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  /*
    Yapılandırma yoksa `getServerClient()` ATAR ve panelin her sayfası 500
    verirdi. Oysa bu durum bir çökme değil, anlatılabilir bir kurulum
    eksiğidir: burada "oturum yok" deyip `requireAdminPage()` içinde giriş
    sayfasına yolluyoruz, giriş sayfası da eksiğin ne olduğunu YAZIYOR.
  */
  if (!isSupabaseConfigured) return null;

  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
});

/** Oturumdaki kullanıcının yönetici olup olmadığı. Oturum yoksa `false`. */
export const getIsAdmin = cache(async (): Promise<boolean> => {
  const user = await getAuthUser();
  if (!user) return false;

  const supabase = await getServerClient();
  // Yetki kaynağı veritabanıdır (admin_users tablosu), JWT talebi değil:
  // yetkisi alınan kullanıcı token'ı dolana kadar yazmaya devam edemesin.
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
});

/** Sayfa/aksiyonun ihtiyaç duyduğu en küçük kimlik gösterimi. */
export interface AdminIdentity {
  userId: string;
  email: string;
}

/**
 * SAYFA koruması. Yönetici değilse render'ı sürdürmez.
 *
 * - Oturum yok       → `/admin/giris`
 * - Oturum var, admin değil → `/admin/yetkisiz` (açık 403 metni; hata gizlenmez)
 *
 * `forbidden()` API'si bilinçli olarak kullanılmadı: `authInterrupts` deneysel
 * bayrağı gerektiriyor ve bir güvenlik sınırını deneysel bayrağa bağlamak
 * istemedik. Gerekçe docs/design-decisions.md'de.
 */
export async function requireAdminPage(): Promise<AdminIdentity> {
  const user = await getAuthUser();
  if (!user) redirect("/admin/giris");

  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/admin/yetkisiz");

  return { userId: user.id, email: user.email ?? "" };
}

/** Yetki reddedildiğinde aksiyonların döndürdüğü sonuç. */
export interface AuthorizationFailure {
  ok: false;
  message: string;
}

export type AdminGuardResult = { ok: true; identity: AdminIdentity } | AuthorizationFailure;

/**
 * SERVER ACTION koruması. Yönlendirmez — aksiyonlar bir sonuç nesnesi döndürür
 * ki form anlamlı bir hata gösterebilsin.
 *
 * Her yazma aksiyonu buna KENDİ başlar. Formun yalnız yetkili bir sayfada
 * render edilmiş olması güvenlik sınırı değildir: aksiyon uç noktasına
 * arayüzden geçmeden istek gönderilebilir (Next.js dokümanı, Server Actions
 * "Authenticate and authorize").
 */
export async function requireAdminAction(): Promise<AdminGuardResult> {
  /*
    Sıra önemli: yapılandırma eksikken `getAuthUser()` her zaman `null`
    döndürür ve aksiyon "oturumunuz sona ermiş" derdi. Kullanıcı defalarca
    giriş yapmayı dener, her seferinde aynı yere düşerdi. Sebebi önce
    söylüyoruz.
  */
  if (!isSupabaseConfigured) {
    return { ok: false, message: AUTH_NOT_CONFIGURED_ERROR };
  }

  const user = await getAuthUser();
  if (!user) {
    return { ok: false, message: "Oturumunuz sona ermiş. Lütfen yeniden giriş yapın." };
  }

  const isAdmin = await getIsAdmin();
  if (!isAdmin) {
    return { ok: false, message: "Bu işlem için yönetici yetkiniz yok." };
  }

  return { ok: true, identity: { userId: user.id, email: user.email ?? "" } };
}
