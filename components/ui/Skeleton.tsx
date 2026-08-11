import { cn } from "@/lib/cn";

/*
  Yükleme yer tutucusu.

  `animate-pulse` hareket azaltma tercihinde global katman tarafından
  durdurulur (app/globals.css → prefers-reduced-motion); bileşen ayrıca
  kontrol yapmaz.

  Yükleme durumu ekran okuyucuya kapsayıcıdaki `aria-busy` ile bildirilir;
  iskelet parçalarının kendisi dekoratiftir.
*/

export interface SkeletonProps {
  /** Yerleşim ve boyut sınıfları (ör. "h-4 w-32"). */
  className?: string;
  /** Yuvarlaklık — metin satırı mı, avatar/görsel mi. */
  shape?: "line" | "block" | "circle";
}

const shapes = {
  line: "rounded-sm",
  block: "rounded-md",
  circle: "rounded-full",
} as const;

export function Skeleton({ className, shape = "line" }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("block animate-pulse bg-surface-sunken", shapes[shape], className)}
    />
  );
}

export interface SkeletonTextProps {
  /** Satır sayısı. */
  lines?: number;
  className?: string;
}

/** Çok satırlı metin iskeleti — son satır kısadır (doğal görünüm). */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <span className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-3.5", index === lines - 1 && "w-3/5")} />
      ))}
    </span>
  );
}
