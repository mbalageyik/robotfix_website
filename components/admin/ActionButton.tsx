"use client";

import { useActionState } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { IDLE_ACTION_STATE, type ActionState } from "@/lib/admin/action-result";

/*
  Tek düğmeli aksiyon formu — durum değiştirme, çoğaltma, görsel sıralama,
  ana görsel seçme, görsel silme gibi "tek tıkla çalışan" işlerin taşıyıcısı.

  NEDEN FORM: bağlantı veya `onClick` DEĞİL. Yazma işlemleri POST olmalıdır;
  GET ile yazmak, tarayıcı ön yüklemesi (prefetch) veya tarama botunun bağlantıyı
  izlemesiyle istem dışı tetiklenebilir. Form + Server Action kullanınca ayrıca
  Next.js'in Origin/Host karşılaştırması devreye girer (bkz. lib/auth/actions.ts).

  Sunucu aksiyonu prop olarak geçilir. Bu, aksiyonun kimliğinin build sırasında
  şifrelenmesini ve yalnız gerçekten kullanılan aksiyonların istemci paketine
  girmesini bozmaz — aksiyon gövdesi hiçbir zaman tarayıcıya inmez.
*/

export interface ActionButtonProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** Aksiyona gönderilecek gizli alanlar (id, durum, yön…). */
  fields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ekran okuyucu için daha açıklayıcı ad (ör. "X ürününü arşivle"). */
  ariaLabel?: string;
  disabled?: boolean;
  /**
   * Verilirse buton iki adımlı olur: önce soru açılır, sonra onay butonu.
   *
   * `window.confirm()` BİLİNÇLİ OLARAK kullanılmadı — tarayıcı kipi (modal)
   * sayfayı kilitler, ekran okuyucu davranışı tutarsızdır ve stillendirilemez.
   * `<details>` saf HTML'dir, klavyeyle çalışır ve JS kapalıyken de açılır.
   */
  confirm?: { question: string; confirmLabel: string };
  /** Sonucu burada değil, çağıranın topladığı ortak alanda göstermek için. */
  hideFeedback?: boolean;
}

export function ActionButton({
  action,
  fields,
  label,
  pendingLabel,
  variant = "secondary",
  size = "sm",
  ariaLabel,
  disabled,
  confirm,
  hideFeedback = false,
}: ActionButtonProps) {
  const [state, formAction] = useActionState(action, IDLE_ACTION_STATE);

  const hiddenFields = Object.entries(fields).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ));

  if (confirm) {
    return (
      <div className="flex flex-col gap-2">
        <details className="group">
          <summary
            className={
              "inline-flex cursor-pointer list-none items-center rounded-md px-3 py-1.5 " +
              "text-caption font-semibold text-link underline underline-offset-4 " +
              "hover:text-link-hover focus-visible:outline-2 focus-visible:outline-offset-2"
            }
          >
            {label}
          </summary>

          <div className="mt-2 flex flex-col gap-2 rounded-md border border-border-strong bg-surface p-3">
            <p className="text-caption text-text">{confirm.question}</p>
            <form action={formAction}>
              {hiddenFields}
              <SubmitButton
                variant="secondary"
                size="sm"
                pendingLabel="İşleniyor…"
                aria-label={ariaLabel}
                disabled={disabled}
              >
                {confirm.confirmLabel}
              </SubmitButton>
            </form>
          </div>
        </details>

        {!hideFeedback && <FormFeedback state={state} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        {hiddenFields}
        <SubmitButton
          variant={variant}
          size={size}
          pendingLabel={pendingLabel}
          aria-label={ariaLabel}
          disabled={disabled}
        >
          {label}
        </SubmitButton>
      </form>

      {!hideFeedback && <FormFeedback state={state} />}
    </div>
  );
}

/**
 * Devre dışı görünümlü sahte buton — sıralamanın ucundaki "yukarı/aşağı" gibi
 * yapılamayacak eylemler için. Gerçek butonu gizlemek yerine devre dışı
 * göstermek, satırların hizasını ve klavye sırasını korur.
 */
export function DisabledActionButton({
  label,
  ariaLabel,
  size = "sm",
}: {
  label: string;
  ariaLabel?: string;
  size?: ButtonSize;
}) {
  return (
    <Button variant="secondary" size={size} disabled aria-label={ariaLabel}>
      {label}
    </Button>
  );
}
