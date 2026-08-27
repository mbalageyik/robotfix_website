"use client";

import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";

export interface ScrollChoreographyImage {
  src: string;
  alt: string;
  /** `next/image` kırpmasının odak noktası. Örnek: `60% 50%`. */
  objectPosition?: string;
}

interface ScrollChoreographyProps {
  className?: string;
  images: {
    topLeft: ScrollChoreographyImage;
    topRight: ScrollChoreographyImage;
    bottomLeft: ScrollChoreographyImage;
    bottomRight: ScrollChoreographyImage;
  };
  /** Sunucu bileşeninde üretilen başlık, açıklama ve CTA alanı. */
  intro?: ReactNode;
}

const COMPACT_QUERY = "(max-width: 768px)";

/**
 * Dört görseli önce çapraz hareketle yer değiştirir, ardından tek bir sahnede
 * toplar. Son karede sağ üst görsel, oranı bozulmadan ekranı kaplar.
 *
 * Metin bu istemci sınırının içinde tanımlanmaz; `intro` olarak sunucudan
 * geçirilir. Böylece WhatsApp ayarları sunucuda çözülür ve içerik JavaScript
 * çalışmadığında da HTML içinde kalır.
 */
export function ScrollChoreography({ className, images, intro }: ScrollChoreographyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 400,
    damping: 50,
    mass: 1.2,
    restDelta: 0.001,
  });

  const xLeft = isCompact ? "-9vw" : "-22vw";
  const xRight = isCompact ? "9vw" : "22vw";
  const yTop = isCompact ? "-25vh" : "-17vh";
  const yBottom = isCompact ? "19vh" : "17vh";

  // Faz 1: karşı köşeler yer değiştirir. Faz 2: dört kare merkezde toplanır.
  const tlX = useTransform(
    smoothProgress,
    [0, 0.3, 0.36, 0.66, 1],
    [xLeft, xLeft, xLeft, "0vw", "0vw"],
  );
  const tlY = useTransform(
    smoothProgress,
    [0, 0.3, 0.36, 0.66, 1],
    [yTop, yBottom, yBottom, "0vh", "0vh"],
  );

  const brX = useTransform(
    smoothProgress,
    [0, 0.3, 0.36, 0.66, 1],
    [xRight, xRight, xRight, "0vw", "0vw"],
  );
  const brY = useTransform(
    smoothProgress,
    [0, 0.3, 0.36, 0.66, 1],
    [yBottom, yTop, yTop, "0vh", "0vh"],
  );

  const blX = useTransform(
    smoothProgress,
    [0, 0.3, 0.36, 0.66, 1],
    [xLeft, xLeft, xLeft, "0vw", "0vw"],
  );
  const blY = useTransform(
    smoothProgress,
    [0, 0.3, 0.36, 0.66, 1],
    [yBottom, yBottom, yBottom, "0vh", "0vh"],
  );

  const trX = useTransform(
    smoothProgress,
    [0, 0.3, 0.36, 0.66, 1],
    [xRight, xRight, xRight, "0vw", "0vw"],
  );
  const trY = useTransform(
    smoothProgress,
    [0, 0.3, 0.36, 0.66, 1],
    [yTop, yTop, yTop, "0vh", "0vh"],
  );

  // Tek eksenli esnetme görseli bozar; eş oranlı büyütme ekranı taşarak kaplar.
  const heroScale = useTransform(
    smoothProgress,
    [0, 0.66, 0.72, 0.92, 1],
    isCompact ? [1, 1, 1, 4.25, 4.25] : [1, 1, 1, 3.4, 3.4],
  );
  const underImagesOpacity = useTransform(smoothProgress, [0.74, 0.86], [1, 0]);
  const introOpacity = useTransform(smoothProgress, [0, 0.08, 0.24, 0.31], [1, 1, 0, 0]);
  const introY = useTransform(smoothProgress, [0, 0.12, 0.3], [0, 0, -32]);
  const introPointerEvents = useTransform(smoothProgress, (progress) =>
    progress < 0.27 ? "auto" : "none",
  );

  /*
    ============================================================================
    YÜKLEME STRATEJİSİ — dört görselden YALNIZ BİRİ preload alır.
    ============================================================================

    LCP elemanı `topRight`tir; `PerformanceObserver` ile ölçülerek doğrulandı.
    Yalnız o `preload` taşır: `<head>`e bir `<link rel="preload">` koyar ve
    tarayıcı onu gövdeyi ayrıştırmadan indirmeye başlar.

    DİĞER ÜÇÜ `loading="eager"` TAŞIYORDU VE BU BİR HATAYDI. next/image
    belgesi `loading`in preload üretmediğini söylüyor ("When not to use
    preload: when the `loading` property is used"), ama ÜRETİM ÇIKTISI
    tersini gösterdi: `curl` ile alınan HTML'de dört görselin DÖRDÜ de
    `<link rel="preload" as="image">` alıyordu. Sonuç, LCP adayının kendi
    preload'unu diğer üçüyle bant genişliği için yarıştırmasıydı — mobil
    throttle koşusunda LCP 4,21 sn (bütçe 2,5 sn).

    Bu yüzden üçü `fetchPriority="low"`a çevrildi. Belge zaten bunu öneriyor
    ("In most cases, you should use `loading="eager"` or `fetchPriority="high"`
    instead of `preload`"); burada ters yönü kullanıyoruz çünkü amaç
    hızlandırmak değil, LCP'nin önünden ÇEKİLMEK.

    NEDEN `lazy` DEĞİL, `fetchPriority="low"`: üç görsel de ilk ekranda
    GERÇEKTEN görünür (hero bir kolajdır). Görünür bir öğeyi tembel yapmak
    onu geciktirmez ama niyeti yanlış anlatır; `fetchPriority` tam olarak
    "indir, ama sıranı bekle" demenin yoludur.
  */
  const staticCardStyle = { x: 0, y: 0, opacity: 1 } as const;
  const baseImageClasses =
    "absolute left-1/2 top-1/2 h-[24vh] w-[74vw] -translate-x-1/2 -translate-y-1/2 " +
    "overflow-hidden rounded-lg bg-surface-dark-raised will-change-transform md:h-[30vh] md:w-[40vw]";

  return (
    <div
      ref={containerRef}
      data-rf-choreography
      className={cn("relative h-[300svh] w-full", className)}
    >
      <div
        data-rf-choreography-sticky
        className="sticky top-0 h-[100svh] w-full overflow-hidden bg-surface"
      >
        <div aria-hidden="true" className="absolute inset-y-0 left-0 z-1 w-1 bg-accent-tech" />

        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            data-rf-choreography-card
            data-rf-card="top-left"
            style={
              prefersReducedMotion
                ? staticCardStyle
                : { x: tlX, y: tlY, opacity: underImagesOpacity }
            }
            className={cn(
              baseImageClasses,
              "z-10 border border-border-strong shadow-(--shadow-e2)",
            )}
          >
            <Image
              fill
              src={images.topLeft.src}
              alt={images.topLeft.alt}
              sizes="(max-width: 768px) 74vw, 40vw"
              fetchPriority="low"
              className="object-cover"
              style={{ objectPosition: images.topLeft.objectPosition }}
            />
            <span aria-hidden="true" className="absolute inset-0 bg-surface-dark/20" />
          </motion.div>

          <motion.div
            data-rf-choreography-card
            data-rf-card="bottom-right"
            style={
              prefersReducedMotion
                ? staticCardStyle
                : { x: brX, y: brY, opacity: underImagesOpacity }
            }
            className={cn(
              baseImageClasses,
              "z-20 border border-border-strong shadow-(--shadow-e2)",
            )}
          >
            <Image
              fill
              src={images.bottomRight.src}
              alt={images.bottomRight.alt}
              sizes="(max-width: 768px) 74vw, 40vw"
              fetchPriority="low"
              className="object-cover"
              style={{ objectPosition: images.bottomRight.objectPosition }}
            />
            <span aria-hidden="true" className="absolute inset-0 bg-surface-dark/20" />
          </motion.div>

          <motion.div
            data-rf-choreography-card
            data-rf-card="bottom-left"
            style={
              prefersReducedMotion
                ? staticCardStyle
                : { x: blX, y: blY, opacity: underImagesOpacity }
            }
            className={cn(
              baseImageClasses,
              "z-30 border border-border-strong shadow-(--shadow-e2)",
            )}
          >
            <Image
              fill
              src={images.bottomLeft.src}
              alt={images.bottomLeft.alt}
              sizes="(max-width: 768px) 74vw, 40vw"
              fetchPriority="low"
              className="object-cover"
              style={{ objectPosition: images.bottomLeft.objectPosition }}
            />
            <span aria-hidden="true" className="absolute inset-0 bg-surface-dark/20" />
          </motion.div>

          <motion.div
            data-rf-choreography-card
            data-rf-card="top-right"
            style={
              prefersReducedMotion ? { x: 0, y: 0, scale: 1 } : { x: trX, y: trY, scale: heroScale }
            }
            className={cn(baseImageClasses, "z-40 origin-center")}
          >
            <Image
              fill
              preload
              src={images.topRight.src}
              alt={images.topRight.alt}
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: images.topRight.objectPosition }}
            />
            <span aria-hidden="true" className="absolute inset-0 bg-surface-dark/15" />
          </motion.div>
        </div>

        {intro ? (
          <motion.div
            data-rf-choreography-intro
            style={
              prefersReducedMotion
                ? { opacity: 1, y: 0, pointerEvents: "auto" }
                : { opacity: introOpacity, y: introY, pointerEvents: introPointerEvents }
            }
            className="absolute inset-0 z-50 flex items-center"
          >
            <div className="w-full">{intro}</div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

export default ScrollChoreography;
