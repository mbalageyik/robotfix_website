"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAuthUser } from "@/lib/auth/dal";

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
  KULLANICI SAYIMI SIZDIRILMAZ.

  Hata mesajı, "e-posta bulunamadı" ile "parola yanlış" durumlarını AYIRT
  ETTİRMEZ. Ayırt ettirseydi bu form bir kullanıcı numaralandırma (user
  enumeration) aracına dönerdi: saldırgan hangi e-postaların kayıtlı olduğunu
  tek tek öğrenebilirdi.

  Aynı sebeple `is_admin` durumu da burada sızdırılmaz: yönetici olmayan geçerli
  bir kullanıcı giriş YAPABİLİR, panelde ise açık bir 403 görür.
*/
const GENERIC_LOGIN_ERROR = "E-posta veya parola hatalı.";

export async function signInAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  // Alan bazlı doğrulama hatası da genel mesajla döner: hangi alanın hatalı
  // olduğunu söylemek numaralandırmaya kapı açar.
  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const supabase = await getServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    /*
      HIZ SINIRLAMA: Supabase Auth'un kendi korumaları kullanılır, yeniden
      icat edilmez (supabase/config.toml → [auth.rate_limit], IP başına 5
      dakikada `sign_in_sign_ups` denemesi). Sınır aşıldığında Supabase
      429 döndürür; kullanıcıya ayrı bir mesaj gösteriyoruz çünkü bu bir
      kimlik bilgisi hatası DEĞİLDİR ve numaralandırma bilgisi taşımaz.
    */
    if (error.status === 429) {
      return {
        error: "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.",
      };
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
