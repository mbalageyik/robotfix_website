"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAction } from "@/lib/auth/dal";
import { getServerClient } from "@/lib/supabase/server-client";
import { homeSectionsConfigSchema } from "@/lib/admin/schemas";
import { homeSectionEnabledField, homeSectionStatusField } from "@/lib/admin/home-sections-fields";
import {
  HOMEPAGE_SECTION_META,
  HOMEPAGE_SECTIONS_SETTING_KEY,
  isLockedSection,
  serializeHomeSectionsConfig,
} from "@/lib/home/section-registry";
import {
  actionError,
  actionSuccess,
  fieldErrorsFromZod,
  messageFromPostgresError,
  type ActionState,
} from "@/lib/admin/action-result";

/*
  ANA SAYFA BÖLÜMLERİ AKSİYONU.

  Yazdığı tek şey `site_settings` içindeki `homepage_sections` anahtarıdır:
  bölüm başına `{ enabled, contentStatus }`. Bölüm LİSTESİ formdan gelmez,
  koddaki kayıttan (`HOMEPAGE_SECTION_META`) gelir — formdan gelen bilinmeyen
  bir kimlik hiç okunmaz, dolayısıyla kayda giremez.

  ZORUNLU BÖLÜMLER YAZILMAZ: `giris` ve `iletisim` için form hiç alan
  göndermez, gönderse bile burada atlanır. Arayüzdeki `disabled` bir güvenlik
  sınırı değildir; asıl kural sunucuda uygulanır (gerekçe: kayıt dosyası).

  Şema değişikliği YOKTUR: `site_settings.value` sütunu `text`'tir ve
  anahtar-değer tablosu tam da migrasyonsuz yeni ayar eklenebilsin diye
  seçilmiştir (migrasyon yorumu, 20260812000200_catalog.sql).
*/

export async function saveHomeSectionsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  /*
    Onay kutusu İŞARETLİ DEĞİLSE hiç gönderilmez — bu HTML'in davranışıdır,
    eksik veri değildir. Bu yüzden "alan yok" doğrudan `enabled: false`
    demektir; formun ayrıca gizli bir alan taşımasına gerek yoktur.

    Onay durumu alanı yoksa (yalnız taslak bölümlerde gösterilir) bölümün
    KOD İÇİ varsayılanı korunur; panel o bölüm için bir şey söylememiş olur.

    Ham değerler DAR TİPE ÇEVRİLMEDEN toplanır; daraltmayı zod yapar. Formdan
    gelen bir dizeyi burada `as` ile durum tipine zorlamak, doğrulamanın tek
    kapı olma özelliğini kaybettirirdi.
  */
  const submitted: Record<string, { enabled: boolean; contentStatus: string }> = {};

  for (const section of HOMEPAGE_SECTION_META) {
    if (isLockedSection(section.id)) continue;

    const rawStatus = formData.get(homeSectionStatusField(section.id));

    submitted[section.id] = {
      enabled: formData.get(homeSectionEnabledField(section.id)) !== null,
      contentStatus: typeof rawStatus === "string" ? rawStatus : section.contentStatus,
    };
  }

  const parsed = homeSectionsConfigSchema.safeParse(submitted);

  if (!parsed.success) {
    return actionError(
      "Bölüm ayarlarında düzeltilmesi gereken bir değer var.",
      fieldErrorsFromZod(z.flattenError(parsed.error)),
    );
  }

  const supabase = await getServerClient();

  /*
    `description` GÖNDERİLMEZ: o sütun şemanın kendi belgelemesidir ve panelden
    düzenlenmez (site ayarları aksiyonuyla aynı gerekçe). Satır tohumlanmamış
    olabilir; `on conflict` sayesinde ilk kaydedişte oluşur.
  */
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: HOMEPAGE_SECTIONS_SETTING_KEY,
      value: serializeHomeSectionsConfig(parsed.data),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) return actionError(messageFromPostgresError(error));

  /*
    Ana sayfa 5 dakikalık tazelik penceresiyle statik üretilir
    (`app/(site)/page.tsx` → `revalidate = 300`); beklemeden yansıması için
    yol elle tazelenir.

    DÜZEN TAZELENİR ("layout"), yalnız "/" DEĞİL. Bu notun önceki hâli "bu
    ayar başka hiçbir sayfayı etkilemez" diyordu; genel site başlığı
    eklendiğinde bu doğruluğunu yitirdi. `components/layout/SiteHeader.tsx`
    aynı yapılandırmayı okur ve menüde YALNIZ görünen bölümlerin çapasını
    gösterir; başlık ise `app/(site)/layout.tsx` üzerinden `/urunler` ve
    ürün detayı sayfalarında da render edilir.

    Yalnız "/" tazelenseydi, panelden kapatılan bir bölümün çapası katalog
    sayfalarındaki menüde asılı kalırdı — tıklandığında hiçbir yere
    gitmeyen bir bağlantı.
  */
  revalidatePath("/", "layout");

  const hiddenCount = Object.values(parsed.data).filter(
    (entry) => !entry.enabled || entry.contentStatus !== "live",
  ).length;

  const note =
    hiddenCount > 0
      ? ` ${hiddenCount} bölüm ana sayfada gösterilmiyor (kapalı veya onay bekliyor).`
      : "";

  return actionSuccess(`Ana sayfa bölümleri kaydedildi.${note}`);
}
