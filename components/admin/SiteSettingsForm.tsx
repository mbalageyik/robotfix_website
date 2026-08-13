"use client";

import { useActionState, useId } from "react";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { saveSiteSettingsAction } from "@/lib/admin/settings-actions";
import { IDLE_ACTION_STATE } from "@/lib/admin/action-result";
import type { SiteSettingKey } from "@/lib/data/site-settings";

/*
  SİTE AYARLARI FORMU.

  Bu ekran WhatsApp numarasının ve mesaj şablonlarının TEK yönetim noktasıdır
  (CLAUDE.md ihlal edilemez kural). Numara koda gömülmez.

  BOŞ ALAN MEŞRUDUR ve her alanın ipucunda ne olacağı açıkça yazar: boş bırakılan
  bilgi sitede HİÇ gösterilmez — yer tutucu, "—" veya "yakında" yazmaz. Bu,
  bilgi dosyası §20'nin doğrudan sonucudur: doğrulanmamış bilgi uydurulmaz.
*/

export type SiteSettingsValues = Record<SiteSettingKey, string>;

export function SiteSettingsForm({ values }: { values: SiteSettingsValues }) {
  const [state, formAction] = useActionState(saveSiteSettingsAction, IDLE_ACTION_STATE);
  const formId = useId();
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <FormFeedback state={state} />

      {/* ---- İletişim --------------------------------------------------- */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">İletişim</legend>

          {/*
            E.164 DOĞRULAMASI SUNUCUDA yapılır (`normalizePhone`). Buraya
            `pattern` yazmadık: tarayıcı deseni girdiyi reddederse kullanıcı
            neden reddedildiğini anlamaz. Sunucu hem çevirir hem de kabul
            edilen biçimleri anlatan bir hata döndürür.
          */}
          <Field
            id={`${formId}-whatsapp`}
            label="WhatsApp numarası"
            hint="Kaydederken uluslararası biçime (E.164) çevrilir. Boş bırakılırsa WhatsApp butonları sitede hiç gösterilmez."
            error={errors.whatsapp_phone}
          >
            {(props) => (
              <input
                {...props}
                name="whatsapp_phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                defaultValue={values.whatsapp_phone}
                maxLength={40}
              />
            )}
          </Field>

          <Field
            id={`${formId}-phone-display`}
            label="Görünen telefon"
            hint="Sitede okunacak biçim. Boş bırakılırsa telefon metni gösterilmez."
            error={errors.phone_display}
          >
            {(props) => (
              <input
                {...props}
                name="phone_display"
                type="tel"
                defaultValue={values.phone_display}
                maxLength={40}
              />
            )}
          </Field>

          <Field
            id={`${formId}-address`}
            label="Adres"
            hint="Boş bırakılırsa adres bloğu sitede hiç gösterilmez."
            error={errors.address_line}
          >
            {(props) => (
              <textarea
                {...props}
                name="address_line"
                defaultValue={values.address_line}
                rows={2}
                maxLength={300}
              />
            )}
          </Field>

          <Field
            id={`${formId}-hours`}
            label="Çalışma saatleri"
            hint="Doğrulanmamışsa boş bırakın — yanlış saat, kapalı kapıya gelen müşteri demektir."
            error={errors.working_hours}
          >
            {(props) => (
              <input
                {...props}
                name="working_hours"
                defaultValue={values.working_hours}
                maxLength={200}
              />
            )}
          </Field>

          <Field
            id={`${formId}-maps`}
            label="Harita bağlantısı"
            hint="https:// ile başlamalıdır. Boş bırakılırsa harita bağlantısı gösterilmez."
            error={errors.maps_url}
          >
            {(props) => (
              <input
                {...props}
                name="maps_url"
                type="url"
                inputMode="url"
                placeholder="https://"
                defaultValue={values.maps_url}
                maxLength={2000}
              />
            )}
          </Field>
        </fieldset>
      </Card>

      {/* ---- Pazaryeri mağazaları --------------------------------------- */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">Pazaryeri mağaza bağlantıları</legend>
          {/*
            KURAL (CLAUDE.md): "Pazaryeri bağlantısı yoksa o pazaryerinin butonu
            HİÇ gösterilmez." Boş bırakmak bu yüzden geçerli ve beklenen bir
            durumdur — devre dışı bir buton göstermek yerine buton hiç çizilmez.
          */}
          <p className="text-caption text-text-muted">
            Boş bırakılan pazaryerinin butonu sitede hiç gösterilmez. Bunlar MAĞAZA
            bağlantılarıdır; ürün bazlı bağlantılar ürün formunda tutulur.
          </p>

          {(
            [
              { key: "store_trendyol_url", label: "Trendyol mağaza bağlantısı" },
              { key: "store_hepsiburada_url", label: "Hepsiburada mağaza bağlantısı" },
              { key: "store_amazon_url", label: "Amazon mağaza bağlantısı" },
              { key: "store_pazarama_url", label: "Pazarama mağaza bağlantısı" },
            ] as const
          ).map((entry) => (
            <Field
              key={entry.key}
              id={`${formId}-${entry.key}`}
              label={entry.label}
              error={errors[entry.key]}
            >
              {(props) => (
                <input
                  {...props}
                  name={entry.key}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  defaultValue={values[entry.key]}
                  maxLength={2000}
                />
              )}
            </Field>
          ))}
        </fieldset>
      </Card>

      {/* ---- WhatsApp şablonları ---------------------------------------- */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">WhatsApp mesaj şablonları</legend>
          <p className="text-caption text-text-muted">
            Boş bırakılırsa koddaki varsayılan şablon kullanılır. Fiyatı olmayan bir ürün için
            mesajda fiyat satırı hiç yazılmaz — boş veya hatalı değer gönderilmez.
          </p>

          <Field
            id={`${formId}-tpl-product`}
            label="Ürün mesajı şablonu"
            error={errors.whatsapp_template_product}
          >
            {(props) => (
              <textarea
                {...props}
                name="whatsapp_template_product"
                defaultValue={values.whatsapp_template_product}
                rows={4}
                maxLength={2000}
              />
            )}
          </Field>

          <Field
            id={`${formId}-tpl-service`}
            label="Servis mesajı şablonu"
            error={errors.whatsapp_template_service}
          >
            {(props) => (
              <textarea
                {...props}
                name="whatsapp_template_service"
                defaultValue={values.whatsapp_template_service}
                rows={4}
                maxLength={2000}
              />
            )}
          </Field>
        </fieldset>
      </Card>

      <div>
        <SubmitButton pendingLabel="Kaydediliyor…">Ayarları kaydet</SubmitButton>
      </div>
    </form>
  );
}
