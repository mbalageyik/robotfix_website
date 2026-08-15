"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";

/*
  AÇILIŞ SAHNESİ — kaydırmaya bağlı kart (Faz 6).

  Desen kaynağı: "container scroll" (Aceternity UI tarzı) — yapı ve mantık
  referans alındı, tüm görsel değerler Robot Fix'e göre yeniden yazıldı.
  Kaynak koddaki nötr gri kart zemini, açık gri kalın kenarlığı ve siyah
  gölge yığını KULLANILMADI; yüzey, kenar ve gölge `app/globals.css`
  tokenlarından gelir (bileşen kodunda ham hex yasaktır —
  `__tests__/source-hygiene.test.ts`).

  BU DOSYA NEDEN İSTEMCİ BİLEŞENİ: `useScroll` kaydırma konumunu okur, bu da
  yalnız tarayıcıda mümkündür.

  METİN BU DOSYADA YOKTUR — BİLİNÇLİ.
  Başlık, değer önerisi ve iki CTA sunucu tarafında üretilir ve buraya
  `header` / `children` olarak GEÇİRİLİR. Üç kazanç:
    1. WhatsApp butonu bir ASENKRON SUNUCU bileşenidir (numarayı site
       ayarlarından okur); istemci bileşeninin içine yazılamazdı.
    2. Metin, istemci paketine girmeden sunucu HTML'inde yer alır — JS
       yüklenmese de okunur (bilgi dosyası §14).
    3. Sunum katmanı içerikten ayrı kalır: hero'nun görseli yeniden
       tasarlandığında metin sözleşmesine dokunulmaz.
*/

export interface HeroScrollStageProps {
  /** Sunucuda üretilen başlık bloğu: overline + h1 + değer önerisi + CTA'lar. */
  header: ReactNode;
  /** Kartın içinde gösterilecek görsel (sunucuda üretilen `next/image`). */
  children: ReactNode;
}

/**
 * Kartın kaydırma boyunca aldığı açı (derece). Kaynak desen 20° kullanıyordu;
 * 20° başlıkla kart arasındaki mesafeyi mobilde gereksiz büyütüyor ve kartın
 * üst kenarını fazla eziyor. 16° aynı "masaya yatık ekran" hissini verir.
 */
const START_ROTATION_DEG = 16;

/*
  Kartın küçük ekrana geçtiği sınır — Tailwind `md` ile aynı nokta.

  Sorgu `max-width` yönündedir ve bu BURADA doğrudur: `useMediaQuery`nin
  sunucu anlık görüntüsü `false` olduğu için sunucu "masaüstü, hareket açık"
  varsayar — hero için istenen varsayım budur. (Servis vitrini videoyu
  koşullu yüklediği için sorguyu tersine, `min-width` yönünde sorar;
  gerekçe `lib/hooks/use-media-query.ts` içinde.)

  Azaltılmış hareket tercihi olan kullanıcı bu tek kareyi GÖRMEZ, çünkü CSS
  katmanı (aşağıdaki nota bakınız) dönüşümü ilk boyamadan itibaren sıfırlar.
*/
const COMPACT_QUERY = "(max-width: 768px)";

export function HeroScrollStage({ header, children }: HeroScrollStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /*
    AZALTILMIŞ HAREKET — İKİ KATMAN, İKİSİ DE GEREKLİ.

    1. CSS (asıl güvence): `app/globals.css` içindeki
       `@media (prefers-reduced-motion: reduce)` bloğu `[data-rf-scroll-motion]`
       öğelerinin dönüşümünü `!important` ile sıfırlar. JS'ten ÖNCE, JS
       OLMADAN ve hidrasyon beklemeden çalışır; tercihe ilk boyamadan
       itibaren uyulur.

    2. Buradaki okuma (tamamlayıcı): hidrasyondan sonra kare kare hesabı
       tümüyle bırakır — CSS yalnız sonucu bastırır, işi durdurmaz.
  */
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  /*
    Mobilde kart daha küçük başlar: dar ekranda 1.04'lük başlangıç ölçeği
    kartı görünür alanın dışına taşırıyordu.
  */
  const isCompact = useMediaQuery(COMPACT_QUERY);

  /*
    Kaydırma penceresi: kartın üstü ekranın üstüne geldiğinde 0, bölüm
    tamamen yukarı çıktığında 1. Kaynak desen bunu 60–80rem'lik dev bir boş
    alanla kuruyordu; burada bölümün KENDİ yüksekliği kullanılır, böylece
    ana sayfanın geri kalanı aşağı itilmez.
  */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  /*
    Hook'lar KOŞULSUZ çağrılır (React kuralı); tercih kontrolü yalnız hangi
    değerin STİLE bağlanacağını seçer.
  */
  const rotateX = useTransform(scrollYProgress, [0, 1], [START_ROTATION_DEG, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], isCompact ? [0.94, 1] : [1.04, 1]);
  const headerTranslateY = useTransform(scrollYProgress, [0, 1], [0, -64]);

  const cardStyle = prefersReducedMotion
    ? // Sabit son durum: düz, tam ölçekli, kaydırmadan bağımsız.
      { rotateX: 0, scale: 1 }
    : { rotateX, scale };

  const headerStyle = prefersReducedMotion ? { y: 0 } : { y: headerTranslateY };

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      {/* Başlık bloğu: sunucudan gelir, yalnız hafifçe yukarı süzülür. */}
      <motion.div style={headerStyle} data-rf-scroll-motion className="w-full">
        {header}
      </motion.div>

      {/*
        `perspective` X ekseni dönüşünün derinlik kazanması için ŞART; aksi
        hâlde kart yalnız dikeyde ezilmiş görünür. Ölçü ana öğede durur ki
        kartın kendi dönüşümü ondan etkilensin.
      */}
      <div
        className="mt-10 w-full sm:mt-12"
        /*
          `center top` = `50% 0%`. Anahtar sözcük biçimi bilinçli: ana sayfa
          metin denetimi yüzde işareti + rakam dizisini doğrulanmamış bir
          istatistik iddiası sayar (§10) ve stil değerini kopyadan ayırt
          edemez. Anahtar sözcük hem okunur hem de o bekçiyi gevşetmez.
        */
        style={{ perspective: "1400px", perspectiveOrigin: "center top" }}
      >
        <motion.div
          style={cardStyle}
          data-rf-scroll-motion
          /*
            Kart çerçevesi: Servis Laciverti yüzey + koyu zeminde görünür
            kenar (marka kitabı §3.6.1 — koyu arayüzde kart sınırları görünür
            olmalı) + laciverte boyanmış yükselti gölgesi.
          */
          className="mx-auto w-full max-w-5xl rounded-xl border border-border-strong bg-surface-dark-raised p-2 shadow-(--shadow-hero) sm:rounded-2xl sm:p-3"
        >
          {/* İç yüzey: sinematik zemin — görselin çerçeveden ayrıştığı yer. */}
          <div className="overflow-hidden rounded-lg bg-surface-sunken sm:rounded-xl">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
