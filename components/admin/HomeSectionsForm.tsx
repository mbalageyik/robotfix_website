"use client";

import { useActionState, useId } from "react";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { saveHomeSectionsAction } from "@/lib/admin/home-sections-actions";
import { homeSectionEnabledField, homeSectionStatusField } from "@/lib/admin/home-sections-fields";
import { IDLE_ACTION_STATE } from "@/lib/admin/action-result";
import { controlClassName } from "@/components/ui/Field";
import { CheckCircleIcon, ClockIcon, SlashCircleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/*
  ANA SAYFA BÖLÜMLERİ FORMU.

  Bu ekran bölümlerin İÇERİĞİNİ düzenlemez — yalnız GÖRÜNÜRLÜĞÜNÜ ve içerik
  onay durumunu yönetir. Metinler kaynakta (`lib/home/content.ts`) ve
  veritabanındadır.

  KLAVYE: açık/kapalı gerçek bir `<input type="checkbox">`, onay durumu gerçek
  bir `<select>`'tir. `div + onClick` kullanılmaz; tab ile gezilir, boşluk ve
  ok tuşlarıyla değiştirilir. Form durumunu React tutmaz (kontrolsüz alanlar):
  tek istemci mantığı gönderim geri bildirimidir.

  DURUM YALNIZ RENKLE ANLATILMAZ (bilgi dosyası §15): her satırda ne olduğu
  METİN olarak yazar, simge ona eşlik eder.
*/

export interface HomeSectionRow {
  id: string;
  label: string;
  /** Kod varsayılanı + kayıtlı override birleşmiş hâli — formun başlangıcı. */
  enabled: boolean;
  contentStatus: "live" | "draft";
  locked: boolean;
  /** Kayıttaki sıra — salt okunur. */
  order: number;
  /** Onay durumu bu bölüm için yönetilebilir mi. */
  statusManageable: boolean;
  isVisible: boolean;
}

function VisibilityBadge({ section }: { section: HomeSectionRow }) {
  if (section.isVisible) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-success/35 bg-success/10 px-2 py-1 text-caption font-semibold text-success">
        <CheckCircleIcon className="size-4 shrink-0" />
        Ana sayfada görünüyor
      </span>
    );
  }

  if (!section.enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-neutral/35 bg-neutral/10 px-2 py-1 text-caption font-semibold text-neutral">
        <SlashCircleIcon className="size-4 shrink-0" />
        Kapalı — gösterilmiyor
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-warning/35 bg-warning/10 px-2 py-1 text-caption font-semibold text-warning">
      <ClockIcon className="size-4 shrink-0" />
      Onay bekliyor — gösterilmiyor
    </span>
  );
}

export function HomeSectionsForm({ sections }: { sections: readonly HomeSectionRow[] }) {
  const [state, formAction] = useActionState(saveHomeSectionsAction, IDLE_ACTION_STATE);
  const formId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormFeedback state={state} />

      <Card padding="none">
        <ul className="divide-y divide-border">
          {sections.map((section) => {
            const enabledId = `${formId}-${section.id}-enabled`;
            const statusId = `${formId}-${section.id}-status`;
            const noteId = `${formId}-${section.id}-note`;

            return (
              <li key={section.id} className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-body font-semibold text-text">
                      <span className="text-text-muted">{section.order}. </span>
                      {section.label}
                    </p>
                    <p className="text-caption text-text-muted">
                      Çapa: <code>#{section.id}</code>
                    </p>
                  </div>

                  <VisibilityBadge section={section} />
                </div>

                <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                  {/*
                    Zorunlu bölümün kutusu işaretli ve `disabled`'dır. Bu bir
                    güvenlik sınırı DEĞİLDİR — aksiyon da zorunlu kimlikleri
                    yok sayar; buradaki amaç yöneticiye kuralı GÖSTERMEKTİR.
                  */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={enabledId}
                      className="flex items-center gap-2 text-body text-text"
                    >
                      <input
                        id={enabledId}
                        name={homeSectionEnabledField(section.id)}
                        type="checkbox"
                        className="size-4"
                        defaultChecked={section.enabled}
                        disabled={section.locked}
                        aria-describedby={section.locked ? noteId : undefined}
                      />
                      Ana sayfada göster
                    </label>

                    {section.locked && (
                      <p id={noteId} className="text-caption text-text-muted">
                        Zorunlu bölüm — kapatılamaz.
                      </p>
                    )}
                  </div>

                  {section.statusManageable && (
                    <div className="flex flex-col gap-1">
                      <label htmlFor={statusId} className="text-caption font-semibold text-text">
                        İçerik durumu
                      </label>
                      <select
                        id={statusId}
                        name={homeSectionStatusField(section.id)}
                        defaultValue={section.contentStatus}
                        className={cn(controlClassName, "w-auto border-border-strong")}
                      >
                        <option value="draft">Taslak — sitede gösterilmez</option>
                        <option value="live">Yayında</option>
                      </select>
                    </div>
                  )}
                </div>

                {section.statusManageable && (
                  <p className="text-caption text-text-muted">
                    Bu bölümün metni işletme onayı bekliyor. Onaylayana kadar taslak bırakın —
                    doğrulanmamış bilgi yayımlanmaz.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div>
        <SubmitButton pendingLabel="Kaydediliyor…">Bölümleri kaydet</SubmitButton>
      </div>
    </form>
  );
}
