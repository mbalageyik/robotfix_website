import { cn } from "@/lib/cn";
import { AlertCircleIcon, CheckCircleIcon } from "@/components/ui/icons";
import type { ActionState } from "@/lib/admin/action-result";

/*
  Aksiyon sonucunun kullanıcıya gösterimi.

  ERİŞİLEBİLİRLİK: sonuç sayfa yüklendikten SONRA belirir, bu yüzden canlı
  bölge olarak duyurulur. Hata `role="alert"` (kesintili, hemen okunur),
  başarı `role="status"` (nazik, sıradaki fırsatta okunur) kullanır — başarıyı
  da kesintiyle okutmak ekran okuyucu kullanıcısını yazarken böler.

  Durum YALNIZ RENKLE anlatılmaz (bilgi dosyası §15): simge + metin de vardır.
  Bu yüzden sunucu bileşenidir; hiç istemci JS'i gerektirmez.
*/

export function FormFeedback({ state, className }: { state: ActionState; className?: string }) {
  if (state.status === "idle" || !state.message) return null;

  const isError = state.status === "error";
  const Icon = isError ? AlertCircleIcon : CheckCircleIcon;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border p-4 text-body",
        isError
          ? "border-danger/35 bg-danger/8 text-danger"
          : "border-success/35 bg-success/10 text-success",
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <span className="sr-only">{isError ? "Hata: " : "Tamamlandı: "}</span>
        {state.message}
      </div>
    </div>
  );
}
