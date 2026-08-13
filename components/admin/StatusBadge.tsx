import { cn } from "@/lib/cn";
import type { PublicationStatus } from "@/lib/data/types";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  SlashCircleIcon,
} from "@/components/ui/icons";

/*
  Yayın durumu rozeti — panelin iç göstergesi.

  `AvailabilityBadge` ile KARIŞTIRILMAMALIDIR: o, ziyaretçiye stok durumunu
  anlatır; bu ise yöneticiye kaydın yayında olup olmadığını anlatır. İkisi ayrı
  enum'lardır ve arayüzde yan yana görünürler, bu yüzden ayrı bileşenlerdir.

  Aynı kural burada da geçerli (bilgi dosyası §15): durum yalnız renkle
  anlatılmaz — metin her zaman vardır, simge ona eşlik eder.
*/

/*
  Tip ŞEMADAN türetilir. `publication_status` enum'una yeni bir değer eklenirse
  bu tablo eksik kalır ve typecheck kırılır.
*/
const config: Record<
  PublicationStatus,
  { label: string; icon: typeof CheckCircleIcon; className: string }
> = {
  draft: {
    label: "Taslak",
    icon: ClockIcon,
    className: "border-neutral/35 bg-neutral/10 text-neutral",
  },
  active: {
    label: "Yayında",
    icon: CheckCircleIcon,
    className: "border-success/35 bg-success/10 text-success",
  },
  passive: {
    label: "Yayında değil",
    icon: AlertCircleIcon,
    className: "border-warning/35 bg-warning/10 text-warning",
  },
  archived: {
    label: "Arşivlenmiş",
    icon: SlashCircleIcon,
    className: "border-neutral/35 bg-neutral/10 text-neutral",
  },
};

/** Metin karşılıkları — açılır listelerde ve mesajlarda yeniden kullanılır. */
export const publicationStatusLabels: Record<PublicationStatus, string> = {
  draft: config.draft.label,
  active: config.active.label,
  passive: config.passive.label,
  archived: config.archived.label,
};

/** Açılır liste seçenekleri — sıra bilinçlidir: iş akışının doğal sırası. */
export const PUBLICATION_STATUS_OPTIONS: readonly {
  value: PublicationStatus;
  label: string;
}[] = [
  { value: "draft", label: config.draft.label },
  { value: "active", label: config.active.label },
  { value: "passive", label: config.passive.label },
  { value: "archived", label: config.archived.label },
];

export function StatusBadge({
  status,
  className,
}: {
  status: PublicationStatus;
  className?: string;
}) {
  const { label, icon: StatusIcon, className: tone } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-caption font-semibold",
        tone,
        className,
      )}
    >
      <StatusIcon className="size-4 shrink-0" />
      {label}
    </span>
  );
}

/**
 * Örnek (demo) veri rozeti.
 *
 * Demo satırları `[ÖRNEK]` önekli adlarla tohumlanır ama panelde ad kısalabilir
 * veya yönetici öneki silebilir. Bu rozet kaydın `is_demo` bayrağını okur, yani
 * ADDAN BAĞIMSIZDIR — "bu gerçek ürün değil" uyarısı kaybolamaz.
 */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-info/35 bg-info/10 px-2 py-1 text-caption font-semibold text-info",
        className,
      )}
    >
      <AlertCircleIcon className="size-4 shrink-0" />
      ÖRNEK VERİ
    </span>
  );
}
