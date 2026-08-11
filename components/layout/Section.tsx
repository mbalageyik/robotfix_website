import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container, type ContainerWidth } from "@/components/layout/Container";

/*
  Bölüm ritmi ve yüzey stratejisi.

  Bilgi dosyası §15: koyu yüzeyler MARKA ANLATIMI ve 3D sahneler için; açık
  nötr yüzeyler ürün kataloğu, ürün detayı, form ve karar alanları için.
  İkisi rastgele karıştırılmaz — bu yüzden yüzey, bölüm seviyesinde seçilir.
*/

export type SectionSurface = "light" | "raised" | "dark" | "cinematic";

const surfaces: Record<SectionSurface, string> = {
  /** Varsayılan sayfa zemini — katalog ve içerik. */
  light: "bg-surface",
  /** Ayrışan açık blok — form ve karar alanları. */
  raised: "bg-surface-raised",
  /** Marka anlatımı. `.rf-on-dark` semantik rolleri koyu sete çevirir. */
  dark: "rf-on-dark",
  /** YALNIZ 3D/sinematik sahneler. */
  cinematic: "rf-on-dark rf-on-cinematic",
};

export interface SectionProps {
  surface?: SectionSurface;
  width?: ContainerWidth;
  /** Dikey ritim: normal bölüm mü, sıkı bölüm mü. */
  spacing?: "default" | "tight" | "none";
  /** Bölümü adlandıran başlığın id'si — `aria-labelledby` için. */
  labelledBy?: string;
  id?: string;
  children: ReactNode;
  className?: string;
}

const spacings = {
  default: "py-(--spacing-section)",
  tight: "py-(--spacing-section-tight)",
  none: "",
} as const;

export function Section({
  surface = "light",
  width = "default",
  spacing = "default",
  labelledBy,
  id,
  children,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(surfaces[surface], spacings[spacing], className)}
    >
      <Container width={width}>{children}</Container>
    </section>
  );
}
