"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import { useSaveData } from "@/lib/hooks/use-save-data";

/*
  SERVİS VİTRİNİ SAHNESİ — kaydırmaya duyarlı video çerçevesi.

  Teknik yaklaşım açılışın önceki kaydırma sahnesinden devralındı (framer-motion `useScroll` +
  hidrasyon güvenli medya sorgusu); yeni bir desen icat edilmedi. Fark, sahnenin
  içinde bir <video> olması ve videonun KOŞULLU yüklenmesidir.

  BU DOSYA NEDEN İSTEMCİ BİLEŞENİ: kaydırma konumu, medya sorguları ve görünüm
  alanı kesişimi yalnız tarayıcıda okunur.

  METİN BU DOSYADA YOKTUR — BİLİNÇLİ. Başlık, gövde ve CTA sunucuda üretilir ve
  `header` olarak geçirilir; poster görseli de öyle (`poster`). Böylece metin
  istemci paketine girmeden sunucu HTML'inde durur: JavaScript hiç çalışmasa
  bile bölüm okunur ve WhatsApp'a ulaşılır (bilgi dosyası §14).

  ---------------------------------------------------------------------------
  VİDEO NE ZAMAN YÜKLENİR — dört kapının HEPSİ açık olmalı
  ---------------------------------------------------------------------------
  1. Geniş ekran           : `(min-width: 768px)`. Bilgi dosyası §14 mobil ve
                             düşük güçlü cihazlar için "daha hafif alternatif"
                             ister; dar ekranda 2 MB'lık dosya hiç istenmez.
  2. Hareket tercihi açık  : `prefers-reduced-motion: reduce` ise oynatma yok.
  3. Veri tasarrufu kapalı : kullanıcı tasarruf istiyorsa yalnız poster kalır.
  4. Bölüm yaklaşmışsa     : görünüm alanına 300px kalana kadar hiç indirilmez;
                             uzaklaşınca DOM'dan çıkar ve kaynak serbest kalır.

  Kapılardan biri kapalıyken poster görseli TEK BAŞINA durur — bir "eksik
  içerik" hâli değil, bölümün tam ve geçerli hâlidir. Poster zaten HER ZAMAN
  render edilir; video onun ÜSTÜNE biner. Bu yüzden JS yüklenmese, video 404
  verse veya codec desteklenmese bile bölüm boş bir kutu olarak kalmaz.

  Sunucu HTML'inde <video> HİÇ BULUNMAZ: `useMediaQuery`nin sunucu anlık
  görüntüsü `false`'tur ve sorgu bilinçli olarak `min-width` yönünde yazılmıştır
  (gerekçe: `lib/hooks/use-media-query.ts`). Böylece dar ekran, hidrasyonu
  beklemeden bile videoyu indirmeye başlamaz.
*/

/** Videonun yükleneceği alt sınır — Tailwind `md` ile aynı nokta. */
const WIDE_QUERY = "(min-width: 768px)";

/** Görünüm alanına bu kadar kala video DOM'a girer. */
const PRELOAD_MARGIN = "300px 0px";

/**
 * Çerçevenin içindeki medyanın ölçeği. Paralaks kaydırması ±%5 olduğu için
 * 1.12'lik ölçek kenarlarda boşluk kalmasını engeller (pay bilerek bırakıldı).
 */
const MEDIA_SCALE = 1.12;

export interface ServiceShowcaseStageProps {
  /** Sunucuda üretilen metin bloğu: üst etiket + h2 + gövde + CTA. */
  header: ReactNode;
  /**
   * Sunucuda üretilen poster görseli (`next/image`, `fill`). HER ZAMAN
   * render edilir; video yalnız onun üstüne biner.
   */
  poster: ReactNode;
  /** Yerel video dosyası. Dış CDN'e bağlanılmaz. */
  videoSrc: string;
}

/*
  Videonun kendisi AYRI bir bileşendir ve bu bir yerleşim tercihi değil.

  "İlk kare boyandı mı" bilgisi videonun ömrüne bağlıdır: bölüm görünüm
  alanından çıkıp video DOM'dan düştüğünde bu bayrağın da sıfırlanması
  gerekir. Bayrak dışarıda tutulsaydı sıfırlama bir efektle yapılmak
  zorunda kalır ve efekt gövdesinde setState çağrılırdı (React 19'un
  basamaklı render uyarısı). Bileşeni ayırmak sıfırlamayı React'in kendi
  bağlama/çözme mekanizmasına devreder — kod hem kısalır hem doğrulanır.
*/
function ShowcaseVideo({ src }: { src: string }) {
  /** İlk kare boyanana kadar poster görünür kalır; geçiş yumuşak olur. */
  const [isReady, setIsReady] = useState(false);

  return (
    /*
      DEKORATİFTİR: anlatının tamamı DOM metnindedir, bu yüzden `aria-hidden`
      ve odak dışı. Ses YOKTUR — dosyada ses kanalı bile yok — ama `muted`
      ayrıca yazılır, çünkü tarayıcıların otomatik oynatma politikası bu
      özniteliği arar. `playsInline` iOS'ta videonun tam ekrana atlamasını
      engeller.
    */
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      onCanPlay={() => setIsReady(true)}
      className={[
        "absolute inset-0 size-full object-cover",
        "transition-opacity duration-(--duration-slow) ease-(--ease-standard)",
        isReady ? "opacity-100" : "opacity-0",
      ].join(" ")}
    />
  );
}

export function ServiceShowcaseStage({ header, poster, videoSrc }: ServiceShowcaseStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const isWide = useMediaQuery(WIDE_QUERY);
  const savesData = useSaveData();

  /** Bölüm görünüm alanına yaklaştı mı (yukarıdaki 4. kapı). */
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    /*
      setState BURADA değil, gözlemcinin GERİ ÇAĞIRMASINDA çağrılır: efektin
      gövdesinde durum yazmak React 19'da basamaklı render'a yol açar ve
      `react-hooks/set-state-in-effect` bunu reddeder. Efektin işi bir dış
      sisteme abone olmaktır — tam olarak yaptığı şey budur.
    */
    const observer = new IntersectionObserver(([entry]) => setIsNear(entry.isIntersecting), {
      rootMargin: PRELOAD_MARGIN,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const showVideo = isWide && !prefersReducedMotion && !savesData && isNear;

  /*
    Kaydırma penceresi: bölümün üstü ekranın altına girdiğinde 0, bölümün altı
    ekranın üstünden çıktığında 1. Hero'daki pencereden farkı, sahnenin sayfanın
    ORTASINDA olması — bu yüzden giriş ve çıkışın ikisi de hesaba katılır.
  */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Hook'lar KOŞULSUZ çağrılır (React kuralı); tercih yalnız hangi değerin
  // stile bağlanacağını seçer.
  const frameScale = useTransform(scrollYProgress, [0, 0.45], [0.94, 1]);
  const mediaY = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);

  /*
    AZALTILMIŞ HAREKET — İKİ KATMAN, İKİSİ DE GEREKLİ (gerekçe Hero'da).
      1. `app/globals.css` içindeki `[data-rf-scroll-motion]` kuralı satır içi
         dönüşümü `!important` ile sıfırlar; JS'ten önce ve JS olmadan çalışır.
      2. Buradaki okuma kare kare hesabı tümüyle bırakır ve videoyu hiç
         yüklemez — CSS yalnız sonucu bastırır, işi durdurmaz.
  */
  const frameStyle = prefersReducedMotion ? { scale: 1 } : { scale: frameScale };
  const mediaStyle = prefersReducedMotion ? { y: 0, scale: 1 } : { y: mediaY, scale: MEDIA_SCALE };

  return (
    <div
      ref={containerRef}
      className="grid items-center gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-14"
    >
      {header}

      <motion.div
        style={frameStyle}
        data-rf-scroll-motion
        /*
          Çerçeve: koyu zeminde görünür kenar (marka kitabı §3.6.1) + laciverte
          boyanmış yükselti gölgesi. Değerler tokenlardan gelir; bileşende ham
          renk yazılmaz (`__tests__/source-hygiene.test.ts`).
        */
        className="relative aspect-16/10 overflow-hidden rounded-xl border border-border-strong bg-surface-sunken shadow-(--shadow-hero) sm:rounded-2xl lg:aspect-video"
      >
        <motion.div style={mediaStyle} data-rf-scroll-motion className="absolute inset-0">
          {poster}

          {showVideo && <ShowcaseVideo src={videoSrc} />}
        </motion.div>

        {/*
          Marka örtüsü: gümüş gri görüntüyü Gece Laciverti'ye bağlar ve
          çerçevenin alt kenarını bölüm zeminine karıştırır. Metin bu örtünün
          ÜSTÜNDE DEĞİL, yanındaki sütundadır — kontrast görüntünün
          parlaklığına bağlı bırakılmaz.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-surface-dark/70 via-surface-dark/20 to-transparent"
        />
      </motion.div>
    </div>
  );
}
