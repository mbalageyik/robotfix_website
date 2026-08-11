import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SearchIcon } from "@/components/ui/icons";

/*
  Boş sonuç durumu.

  Ürün verisi henüz girilmemiş katalog alanlarında da kullanılır: boş bir
  ızgara göstermek yerine durumu açıkça anlatırız. Metin, doğrulanmamış bir
  vaat içermez ("yakında 500 ürün" gibi) — yalnız mevcut durumu bildirir.
*/

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Kullanıcıyı ileri taşıyan eylem (ör. filtreyi temizle, WhatsApp'tan sor). */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
    >
      <SearchIcon className="size-8 text-text-disabled" />
      <h3 className="text-h4 text-text">{title}</h3>
      {description && <p className="max-w-prose text-body text-text-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
