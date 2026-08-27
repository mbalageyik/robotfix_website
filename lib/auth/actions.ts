"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAuthUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  AUTH_NOT_CONFIGURED_ERROR,
  AUTH_RATE_LIMITED_ERROR,
  AUTH_UNAVAILABLE_ERROR,
  GENERIC_LOGIN_ERROR,
} from "@/lib/auth/messages";

/*
  Kimlik doğrulama aksiyonları.

  CSRF: Next.js Server Actions isteğin `Origin` başlığını `Host` ile karşılaştırır
  ve uyuşmayanı reddeder; ayrıca aksiyon kimlikleri build sırasında şifrelenir ve
  kullanılmayan aksiyonlar istemci paketinden çıkarılır. Ek bir token mekanizması
  YAZILMADI — çerçevenin sağladığını tekrar icat etmek yeni bir hata yüzeyi olurdu.
*/

const credentialsSchema = z.object({
  email: z.string().trim().min(1, "E-posta gerekli.").email("Geçerli bir e-posta girin."),
  password: z.string().min(1, "Parola gerekli."),
});

export interface LoginState {
  error: string | null;
}

/*
  Hata mesajlarının tamamı ve neden ayrıldıkları: `lib/auth/messages.ts`.
  Özetle: "parolan yanlış" YALNIZ gerçekten parola yanlışken söylenir; yığın
  ayakta değilken aynı cümleyi kurmak kullanıcıyı saatlerce yanlış yerde
  aratır.
*/

export async function signInAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // Yapılandırma hiç yoksa denemenin anlamı yok: sonuç her koşulda başarısız
  // olurdu ve kullanıcı bunu kimlik bilgisi hatası sanırdı.
  if (!isSupabaseConfigured) {
    return { error: AUTH_NOT_CONFIGURED_ERROR };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // Alan bazlı doğrulama hatası da genel mesajla döner: hangi alanın hatalı
  // olduğunu söylemek numaralandırmaya kapı açar.
  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  /*
    `signInWithPassword` ağ hatasında ATMAZ, `error` döndürür; ama istemcinin
    kurulumu (`getServerClient`) atabilir. İkisi de aynı yere varmalı, o yüzden
    çağrı bir bütün olarak sarılıyor. `redirect()` bu bloğun DIŞINDA kalır —
    o bir istisna atarak çalışır, buradaki catch onu yutardı.
  */
  const attempt = await (async () => {
    try {
      const supabase = await getServerClient();
      return await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
    } catch {
      // İstemci hiç kurulamadı: istek sunucuya varmadı.
      return null;
    }
  })();

  if (attempt === null) {
    return { error: AUTH_UNAVAILABLE_ERROR };
  }

  const { error } = attempt;

  if (error) {
    /*
      HIZ SINIRLAMA: Supabase Auth'un kendi korumaları kullanılır, yeniden
      icat edilmez (supabase/config.toml → [auth.rate_limit], IP başına 5
      dakikada `sign_in_sign_ups` denemesi). Sınır aşıldığında Supabase
      429 döndürür; kullanıcıya ayrı bir mesaj gösteriyoruz çünkü bu bir
      kimlik bilgisi hatası DEĞİLDİR ve numaralandırma bilgisi taşımaz.
    */
    if (error.status === 429) {
      return { error: AUTH_RATE_LIMITED_ERROR };
    }

    /*
      ALTYAPI HATASI mı, KİMLİK HATASI mı?

      `status` HTTP durumudur. Fetch hiç tamamlanamadığında (yığın kapalı,
      port yanlış, Docker durmuş) auth-js `AuthRetryableFetchError` üretir ve
      durumu `0` olur; 5xx ise sunucu ayakta ama sağlıksızdır. İkisi de
      kullanıcının parolasıyla ilgili DEĞİLDİR.

      Sınıf adına (`AuthRetryableFetchError`) bakılmıyor: o sınıf
      `@supabase/auth-js` içinde yaşıyor ve bu paket projenin doğrudan
      bağımlılığı değil — `@supabase/supabase-js` onu yeniden dışa
      aktarmıyor. Bildirilmemiş bir pakete `import` yazmak yerine durum
      kodunun kendisine bakmak hem daha dayanıklı hem daha dürüst.
    */
    if (!error.status || error.status >= 500) {
      return { error: AUTH_UNAVAILABLE_ERROR };
    }

    return { error: GENERIC_LOGIN_ERROR };
  }

  const target = formData.get("devam");
  const safeTarget =
    typeof target === "string" && target.startsWith("/admin") && !target.startsWith("//")
      ? target
      : "/admin";

  // `redirect()` bir istisna atar; try/catch içine ALINMAZ.
  redirect(safeTarget);
}

export async function signOutAction(): Promise<void> {
  const supabase = await getServerClient();
  // Oturum zaten yoksa da sorun değil; sonuç aynı: çerez temizlenir.
  await supabase.auth.signOut();
  redirect("/admin/giris");
}

/** Panelde gösterilecek oturum bilgisi (yalnız e-posta). */
export async function getCurrentAdminEmail(): Promise<string | null> {
  const user = await getAuthUser();
  return user?.email ?? null;
}
