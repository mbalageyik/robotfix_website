"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

/*
  Ürün galerisi — sayfadaki TEK istemci bileşeni.

  Neden istemci: küçük görsel seçimi anlık olmalı, sunucuya gidiş dönüş
  yapmamalı. Bunun dışındaki her şey (ad, fiyat, açıklama, uyumluluk, CTA)
  sunucuda render edilir ve JS olmadan da okunur.

  JS YÜKLENMEZSE: ilk (ana) görsel zaten sunucu HTML'inde işaretlenmiş olarak
  gelir; galeri etkileşimsiz ama görünür kalır. Ürün bilgisi kaybolmaz.

  ERİŞİLEBİLİRLİK:
  - Küçük görseller gerçek `<button>`'dır (klavye ile gezilebilir).
  - Seçili olan `aria-pressed` ile bildirilir — yalnız görsel çerçeveye
    güvenilmez.
  - Geçiş `motion-reduce` ile kapatılır (azaltılmış hareket tercihi).
*/

export interface GalleryImage {
  id: string;
  /** Hazır, mutlak URL. Yol→URL çevrimi sunucuda yapılır. */
  url: string;
  altText: string;
}

export interface ProductGalleryProps {
  images: GalleryImage[];
  /** Alt metni boş olan görseller için yedek (ürün adı). */
  fallbackAlt: string;
}

export function ProductGallery({ images, fallbackAlt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-border bg-surface-sunken px-6 text-center">
        <p className="text-body text-text-disabled">Bu ürün için görsel henüz eklenmedi.</p>
      </div>
    );
  }

  // Dizi dışına taşan bir index kalırsa ilk görsele düş.
  const active = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-sunken">
        <Image
          key={active.id}
          src={active.url}
          alt={active.altText.trim() || fallbackAlt}
          fill
          sizes="(min-width: 1024px) 32rem, 92vw"
          /* Detay sayfasının LCP görseli — tembel yüklenmemeli. */
          priority
          className="object-contain"
        />
      </div>

      {images.length > 1 && (
        <ul className="flex flex-wrap gap-2" aria-label="Ürün görselleri">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative size-16 overflow-hidden rounded-md border-2 transition-colors duration-(--duration-fast)",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    "motion-reduce:transition-none",
                    isActive ? "border-link" : "border-border hover:border-border-strong",
                  )}
                >
                  <Image src={image.url} alt="" fill sizes="4rem" className="object-cover" />
                  {/* Görsel numarası yalnız ekran okuyucu için — düğme boş kalmaz. */}
                  <span className="sr-only">
                    {index + 1}. görseli göster{isActive ? " (seçili)" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
