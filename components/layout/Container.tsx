import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
  Yatay ölçü ve kenar boşluğu ilkeli. Sayfa genişliği tek yerden yönetilir.
*/

export type ContainerWidth = "narrow" | "default" | "wide";

const widths: Record<ContainerWidth, string> = {
  /** Uzun metin — okunabilirlik için ~70 karakter. */
  narrow: "max-w-2xl",
  default: "max-w-5xl",
  /** Katalog ızgaraları ve geniş görsel bölümler. */
  wide: "max-w-7xl",
};

export interface ContainerProps {
  as?: ElementType;
  width?: ContainerWidth;
  children: ReactNode;
  className?: string;
}

export function Container({
  as: Tag = "div",
  width = "default",
  children,
  className,
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-5 sm:px-6 lg:px-8", widths[width], className)}>
      {children}
    </Tag>
  );
}
