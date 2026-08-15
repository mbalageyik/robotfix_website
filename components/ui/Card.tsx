import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
  Kart — ürün, hizmet ve bilgi bloklarının taşıyıcısı.

  Bileşen dili: SINIR ÖNCE, GÖLGE SONRA. Teknik ve sakin bir his için ayrım
  öncelikle 1px sınırla kurulur; gölge o sınırın üstüne derinlik ekler. Koyu
  zeminde `.rf-on-dark` sınırı görünür tutar (bilgi dosyası §15: "Koyu
  arayüzde ... kart sınırları görünür olmalı") ve yükselti tokenlarını
  `none`'a düşürür — laciverti laciverti üstüne düşen gölge görünmez.

  FAZ 8: `default` artık e1 taşır. Önceden gölgesizdi ve sayfa, kartların
  zeminle aynı düzlemde durduğu düz bir tel kafes gibi görünüyordu. e1
  bilinçle çok hafiftir (2 katman, %5 alfa): kartı zeminden ayırır ama
  "kabarcık" hâline getirmez.

  YARIÇAP: `rounded-lg` — kart/panel rolünün kademesi (kural `app/globals.css`
  içindeki yarıçap notunda).
*/

export interface CardProps {
  /**
   * `interactive` yalnız kartın tamamı tıklanabilir olduğunda kullanılır;
   * hover/odakta `.rf-lift` ile kalkar.
   */
  variant?: "default" | "raised" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

const variants = {
  default: "border border-border bg-surface-raised shadow-(--shadow-e1)",
  raised: "border border-border bg-surface-raised shadow-(--shadow-e2)",
  /*
    KALDIRMA `.rf-lift` içindedir (tek kaynak; azaltılmış hareket istisnası da
    orada). GÖLGE ADIMI ise burada, yardımcı sınıflarla yazılır — Tailwind v4'te
    `utilities` katmanı `components` katmanını yendiği için gölgenin bileşen
    sınıfından verilmesi çalışmaz (ayrıntılı gerekçe `app/globals.css`
    `.rf-lift` notunda).
  */
  interactive:
    "rf-lift border border-border bg-surface-raised shadow-(--shadow-e1) " +
    "hover:border-border-strong hover:shadow-(--shadow-e2) " +
    "focus-within:border-link focus-within:shadow-(--shadow-e2)",
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
