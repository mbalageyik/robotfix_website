import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertCircleIcon } from "@/components/ui/icons";

/*
  Form alanı — etiket + kontrol + yardım metni + hata metni.

  Erişilebilirlik sözleşmesi:
  - Etiket her zaman görünür (yer tutucu etiket yerine geçmez).
  - Hata ve yardım metni `aria-describedby` ile kontrole BAĞLANIR.
  - Hata durumunda `aria-invalid="true"` verilir.
  - Hata yalnız renkle anlatılmaz: simge + metin de vardır (bilgi dosyası §15).

  Kontrol, `children` render fonksiyonuna geçilen aria özellikleriyle kurulur.
  Böylece input/textarea/select farkı olmadan doğru bağlantı garanti edilir ve
  hiç istemci JS'i gerekmez (sunucu bileşeni olarak çalışır).
*/

/** Kontrole yayılacak erişilebilirlik özellikleri. */
export interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
  "aria-required": true | undefined;
  className: string;
}

export interface FieldProps {
  /** Kontrolün id'si — etiketin `htmlFor` değeriyle eşleşir. */
  id: string;
  label: string;
  /** Alanın altındaki açıklayıcı metin. */
  hint?: string;
  /** Doluysa alan hatalı sayılır. */
  error?: string;
  required?: boolean;
  children: (props: FieldControlProps) => ReactNode;
  className?: string;
}

/** Tüm form kontrollerinin ortak görünümü. */
export const controlClassName =
  "w-full rounded-md border bg-surface-raised px-3 py-2.5 text-body text-text " +
  "placeholder:text-text-disabled transition-colors duration-(--duration-fast) " +
  "ease-(--ease-standard) disabled:cursor-not-allowed disabled:opacity-55";

export function Field({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  className,
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-caption font-semibold text-text">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
            <span className="sr-only"> (zorunlu)</span>
          </>
        )}
      </label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required || undefined,
        className: cn(controlClassName, error ? "border-danger" : "border-border-strong"),
      })}

      {hint && (
        <p id={hintId} className="text-caption text-text-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-caption font-medium text-danger">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
