import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertCircleIcon } from "@/components/ui/icons";

/*
  Hata durumu.

  Kırmızı YALNIZ burada ve form hatalarında kullanılır — alışveriş eylemi
  rengi değildir (bilgi dosyası §15). Hata simge + başlık + açıklama ile
  anlatılır; renk tek gösterge değildir.

  `role="alert"` yalnız hata sayfa yüklendikten SONRA belirdiğinde anlamlıdır;
  statik render'da gürültü yaratmaması için opsiyoneldir.
*/

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Kurtarma eylemi (ör. tekrar dene, WhatsApp'tan ulaş). */
  action?: ReactNode;
  /** Dinamik olarak belirdiyse ekran okuyucuya duyurulsun mu. */
  live?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Bir sorun oluştu",
  description = "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
  action,
  live = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role={live ? "alert" : undefined}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border border-danger/35 bg-danger/8 p-5",
        className,
      )}
    >
      <p className="flex items-center gap-2 text-h4 text-danger">
        <AlertCircleIcon className="size-5 shrink-0" />
        {title}
      </p>
      {description && <p className="text-body text-text-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
