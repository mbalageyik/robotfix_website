"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAction } from "@/lib/auth/dal";
import { getServerClient } from "@/lib/supabase/server-client";
import { siteSettingsSchema } from "@/lib/admin/schemas";
import { SITE_SETTING_KEYS, type SiteSettingKey } from "@/lib/data/site-settings";
import { InvalidPhoneNumberError, normalizePhone } from "@/lib/whatsapp";
import {
  actionError,
  actionSuccess,
  fieldErrorsFromZod,
  messageFromPostgresError,
  type ActionState,
} from "@/lib/admin/action-result";

/*
  SİTE AYARLARI AKSİYONU.

  Bu tablo WhatsApp numarasının ve mesaj şablonlarının TEK KAYNAĞIDIR
  (CLAUDE.md: "WhatsApp numarası ve mesaj şablonları tek yerde"). Numara koda
  yazılmaz; buradan yönetilir.

  Tablo anonim role tamamen okunabilir olduğu için buraya SIR KONULMAZ —
  yalnız herkese açık işletme bilgisi bulunur (şema yorumu ve
  lib/data/site-settings.ts aynı kuralı tekrarlar).
*/

export async function saveSiteSettingsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const parsed = siteSettingsSchema.safeParse(
    Object.fromEntries(SITE_SETTING_KEYS.map((key) => [key, formData.get(key) ?? ""])),
  );

  if (!parsed.success) {
    return actionError(
      "Formda düzeltilmesi gereken alanlar var.",
      fieldErrorsFromZod(z.flattenError(parsed.error)),
    );
  }

  const values: Record<SiteSettingKey, string | null> = { ...parsed.data };

  /*
    WHATSAPP NUMARASI E.164'E ÇEVRİLİR.

    Dönüşüm burada yapılır, şemada değil: `normalizePhone` bir istisna atar ve
    zod şemasının içinden çağırmak hata mesajını kaybettirirdi. Tek kaynak yine
    `lib/whatsapp.ts` — biçim kuralları BURADA YENİDEN YAZILMAZ.

    Numara NEDEN normalize edilerek saklanır: `wa.me` bağlantısı yalnız E.164
    kabul eder. Kullanıcının girdiği biçimde saklasaydık her okumada yeniden
    çevirmek gerekirdi ve bozuk bir numara ancak ziyaretçi bağlantıya
    tıkladığında fark edilirdi. Burada çevirirsek hata YÖNETİCİYE, kaydetme
    anında gösterilir.
  */
  if (values.whatsapp_phone !== null) {
    try {
      values.whatsapp_phone = normalizePhone(values.whatsapp_phone);
    } catch (error) {
      const reason =
        error instanceof InvalidPhoneNumberError
          ? "Numara geçerli bir Türkiye mobil numarasına çözülemedi."
          : "Numara okunamadı.";

      return actionError("WhatsApp numarası geçersiz.", {
        whatsapp_phone:
          `${reason} Örnek biçimler: 0 ile başlayan 11 hane, ` +
          "+90 ile başlayan uluslararası biçim veya 10 haneli abone numarası. " +
          "Numarayı kaldırmak için alanı boş bırakın.",
      });
    }
  }

  const supabase = await getServerClient();

  /*
    Tek `upsert` ile yazılır. Satırlar tohumlamada oluşturulmuştur ama
    `on conflict` sayesinde eksik bir anahtar varsa da eklenir; panel
    veritabanının tohumlanmış olmasına bağımlı kalmaz.

    `description` GÖNDERİLMEZ: o sütun şemanın kendi belgelemesidir, panelden
    düzenlenmez. Gönderseydik upsert onu null'a çekerdi.
  */
  const { error } = await supabase.from("site_settings").upsert(
    SITE_SETTING_KEYS.map((key) => ({
      key,
      value: values[key],
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "key" },
  );

  if (error) return actionError(messageFromPostgresError(error));

  /*
    Ayarlar sitenin HER yerinde görünür (WhatsApp butonları, iletişim bilgisi,
    pazaryeri bağlantıları). Bu yüzden yalnız ayar sayfası değil, kök düzen
    de tazelenir.
  */
  revalidatePath("/", "layout");

  const emptyCount = SITE_SETTING_KEYS.filter((key) => values[key] === null).length;
  const note =
    emptyCount > 0
      ? ` ${emptyCount} alan boş bırakıldı; boş alanlar sitede hiç gösterilmez.`
      : "";

  return actionSuccess(`Site ayarları kaydedildi.${note}`);
}
