import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
  Kart — ürün, hizmet ve bilgi bloklarının taşıyıcısı.

  Bileşen dili: sınır önce, gölge sonra. Teknik ve sakin bir his için ayrım
  öncelikle 1px sınırla kurulur; gölge yalnız yükseltilmiş kartlarda ve çok
  hafif kullanılır. Koyu zeminde `.rf-on-dark` sınırı görünür tutar (bilgi
  dosyası §15: "Koyu arayüzde ... kart sınırları görünür olmalı").
*/

export interface CardProps {
  /** `interactive` yalnız kartın tamamı tıklanabilir olduğunda kullanılır. */
  variant?: "default" | "raised" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

const variants = {
  default: "border border-border bg-surface-raised",
  raised: "border border-border bg-surface-raised shadow-raised",
  interactive:
    "border border-border bg-surface-raised transition-colors duration-(--duration-fast) " +
    "ease-(--ease-standard) hover:border-border-strong focus-within:border-link",
} as const;

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

export function Card({ variant = "default", padding = "md", children, className }: CardProps) {
  return (
    <div className={cn("rounded-lg", variants[variant], paddings[padding], className)}>
      {children}
    </div>
  );
}
