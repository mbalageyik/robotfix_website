/*
  Kimlik doğrulama akışının kullanıcıya görünen metinleri.

  NEDEN AYRI DOSYA: `lib/auth/actions.ts` bir `"use server"` modülüdür ve
  yalnız async fonksiyon dışa aktarabilir — sabitler orada duramaz. Bu dosya
  hem aksiyonlar, hem DAL, hem de giriş sayfası tarafından okunur; metin tek
  kaynakta kalır.

  ÜÇ HATA ÜÇ AYRI ŞEYDİR ve ayrı ayrı yazılır:

    1. Kimlik bilgisi hatalı        → kullanıcının düzeltebileceği bir şey.
    2. Servise ulaşılamıyor         → altyapı; kullanıcının parolasıyla ilgisi yok.
    3. Yapılandırma eksik           → kurulum hatası; parolayla hiç ilgisi yok.

  İkisini birincisiyle aynı mesaja katlamak, çalışmayan bir yığında kullanıcıya
  "parolan yanlış" demek olurdu — doğru olmayan ve saatlerce yanlış yerde
  aratan bir mesaj.
*/

/*
  KULLANICI SAYIMI SIZDIRILMAZ.

  Bu mesaj "e-posta bulunamadı" ile "parola yanlış" durumlarını AYIRT
  ETTİRMEZ. Ayırt ettirseydi form bir kullanıcı numaralandırma aracına
  dönerdi: saldırgan hangi e-postaların kayıtlı olduğunu tek tek öğrenirdi.

  Aynı sebeple `is_admin` durumu da sızdırılmaz: yönetici olmayan geçerli bir
  kullanıcı giriş YAPABİLİR, panelde ise açık bir 403 görür.
*/
export const GENERIC_LOGIN_ERROR = "E-posta veya parola hatalı.";

/**
 * Kimlik doğrulama sunucusuna hiç ulaşılamadığında.
 *
 * Numaralandırma açısından güvenlidir: hiçbir hesabın var olup olmadığını
 * söylemez, yalnız isteğin sunucuya varamadığını söyler.
 */
export const AUTH_UNAVAILABLE_ERROR =
  "Kimlik doğrulama servisine ulaşılamadı. Bu bir parola hatası değildir — " +
  "sunucu şu anda yanıt vermiyor. Yerel geliştirmede Supabase yığınının " +
  "çalıştığından emin olun (docs/supabase-setup.md § 1.3).";

/**
 * `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` hiç tanımlı
 * değilken. Giriş denemesi anlamsızdır; deneyip "hatalı parola" demek yerine
 * durumu olduğu gibi söyleriz.
 */
export const AUTH_NOT_CONFIGURED_ERROR =
  "Supabase yapılandırılmadı. Bu bir kurulum eksiğidir, kimlik bilgilerinizle " +
  "ilgili değildir: sunucuda NEXT_PUBLIC_SUPABASE_URL ve " +
  "NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil (docs/supabase-setup.md § 1.4).";

/** Hız sınırı aşıldığında (Supabase Auth'un kendi koruması, 429). */
export const AUTH_RATE_LIMITED_ERROR =
  "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
