"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";

/*
  SEÇKİ SAHNESİ — kaydırmayla üst üste yığılan kartlar (Faz 9).

  Desen kaynağı: "sticky stacking scroll cards". Yapısı referans alındı — her
  kart kendi `position: sticky` kabında durur, ortak bir kaydırma ilerlemesi
  okunur, sonraki kartlar öncekini örterken öncekiler hafifçe küçülür. Veri,
  yerleşim, ölçüler, erişilebilirlik ve yedek davranışlar yeniden yazıldı;
  kaynaktaki sabit piksel ölçüleri (`h-[200px] w-[280px]` gibi) kullanılmadı.

  ---------------------------------------------------------------------------
  LENİS KULLANILMADI — ölçülerek verilmiş karar
  ---------------------------------------------------------------------------
  Kaynak desen `<ReactLenis root>` ile TÜM belgeyi yumuşak kaydırmaya sarıyor.
  Denendi ve reddedildi:

    - Projede tek düzen dosyası var (`app/layout.tsx`); `root` sarmalama
      YÖNETİM PANELİNİ de kapsardı. Ölçümde `window.scrollTo(0, 1000)` ve
      `(0, 2000)` çağrıları Lenis'siz tam isabet ederken Lenis açıkken ikisi de
      187px'te takıldı — ürün formundaki "ilk hatalı alana kaydır" akışının
      dayandığı yol tam olarak budur.
    - Sayfada zaten `html { scroll-behavior: smooth }` var; üstüne bir JS ara
      katmanı koymak iki yumuşatma katmanını üst üste bindirir.
    - Yeni bir çalışma zamanı bağımlılığı; kaynağın kendisi de Lenis'i zorunlu
      saymıyor.

  DÜRÜST NOT: Lenis, framer-motion'ın `useScroll` okumasını BOZMADI. Aynı
  kaydırma konumunda Hero ve servis vitrininin dönüşüm değerleri Lenis'li ve
  Lenis'siz birebir aynı çıktı. Red gerekçesi senkron kayması değil, programatik
  kaydırmanın ele geçirilmesi ve bağımlılık maliyetidir.

  ---------------------------------------------------------------------------
  METİN BU DOSYADA YOKTUR — BİLİNÇLİ
  ---------------------------------------------------------------------------
  Kartların tamamı sunucuda üretilir (`FeaturedProductPanel`) ve buraya
  `ReactNode` olarak gelir. Hero ve servis vitrininde kurulan sözleşmenin
  aynısı: ürün adı, fiyatı ve bağlantısı istemci paketine girmeden sunucu
  HTML'inde durur; JS yüklenmese de okunur ve tıklanır (bilgi dosyası §14).

  ---------------------------------------------------------------------------
  TEK DOM, İKİ YERLEŞİM
  ---------------------------------------------------------------------------
  Dar ekran ile geniş ekran arasındaki fark CSS medya sorgularıyla kurulur,
  JS dalıyla DEĞİL. Sebep: `useMediaQuery`nin sunucu anlık görüntüsü `false`
  olduğu için JS dalı, masaüstünde hidrasyondan sonra yerleşimi değiştirir
  (gözle görülür sıçrama) ve JS kapalıyken masaüstü kullanıcısını kalıcı
  olarak dar ekran yerleşiminde bırakırdı. CSS ikisini de çözer.

  JS'e kalan TEK iş, ölçek dönüşümünü bağlayıp bağlamamaktır — ilerleme 0'da
  ölçek zaten 1 olduğu için bu geçiş görünmez.
*/

/** Yığılmanın başladığı alt sınır — Tailwind `md` ile aynı nokta. */
const STACK_QUERY = "(min-width: 768px)";

/**
 * Bir kartın inebileceği EN KÜÇÜK ölçek.
 *
 * Kaynak desen kart başına 0.08 kısıp 0.6'da duruyordu; sekiz kartta en
 * alttaki kart %60'a inip okunmaz hâle gelirdi. Burada ürün adı ve FİYAT
 * okunur kalmak zorunda (§6 — fiyat gösterimi yanıltıcı olamaz, silik de
 * olamaz), bu yüzden taban 0.88: yığın hissi korunur, metin küçülmez.
 */
const MIN_SCALE = 0.88;

/** Kart başına kısılan ölçek payı. */
const SCALE_STEP = 0.03;

/** Üst üste binen kartlarda alttakinin görünen pay yüksekliği (px). */
const STACK_OFFSET_PX = 22;

export interface FeaturedStackItem {
  id: string;
  /** Sunucuda üretilmiş kart. */
  content: ReactNode;
}

function StackedCard({
  index,
  total,
  content,
  progress,
  animate,
}: {
  index: number;
  total: number;
  content: ReactNode;
  progress: MotionValue<number>;
  /** `false` ise ölçek dönüşümü stile hiç bağlanmaz. */
  animate: boolean;
}) {
  /*
    Hedef ölçek: en üstteki kart en çok küçülür (altına en çok kart binecek
    olan odur), sonuncusu hiç küçülmez.
  */
  const targetScale = Math.max(MIN_SCALE, 1 - (total - index - 1) * SCALE_STEP);

  /*
    Kartın kendi penceresi. Kaynak desendeki `[i * 0.2, 1]` sabiti kart
    sayısından bağımsızdı ve beşten fazla kartta pencereler [0,1] aralığının
    dışına taşıyordu (altıncı kart 1.2'de başlıyordu, yani hiç hareket
    etmiyordu). Payda kart sayısına bağlanınca pencere her zaman içeride kalır.
  */
  const start = total > 1 ? index / total : 0;

  // Hook'lar KOŞULSUZ çağrılır (React kuralı); tercih yalnız hangi değerin
  // stile bağlanacağını seçer.
  const scale = useTransform(progress, [start, 1], [1, targetScale]);

  return (
    <div
      className={[
        /*
          Dar ekran: şeritte sabit genişlikli bir öğe. KONUMLANDIRMA YOK —
          `static` kalması ŞART. Burada `relative` yazmak, aşağıdaki satır içi
          `top` değerinin dar ekranda da uygulanmasına yol açıyordu: kart
          şeridin içinde 88px aşağı kayıyor ve şeridin alt kenarından taşan
          kısmı kırpılıyordu (`overflow-x: auto`, `overflow-y`yi de `auto`ya
          çevirir). `static` konumlandırmada `top` yok sayılır.
        */
        "w-[85vw] max-w-sm shrink-0 snap-start",
        // Geniş ekran: ortalanmış yapışkan bir kat.
        "md:sticky md:flex md:w-full md:max-w-none md:shrink md:justify-center",
      ].join(" ")}
      /*
        Azaltılmış hareket tercihinde `globals.css` bu katı `static`e çevirir:
        yığılmanın KENDİSİ de kaydırmaya bağlı bir harekettir, yalnız ölçeği
        durdurmak yetmez. CSS katmanında yapılır ki JS olmadan da geçerli olsun.
      */
      data-rf-stack-layer
      /*
        Her kart bir öncekinden biraz aşağıda yapışır; alttaki kartların üst
        kenarı görünür kalır ve yığın "deste" gibi okunur. Yalnız `md:sticky`
        devredeyken etkilidir (yukarıdaki nota bakınız).
      */
      style={{ top: `calc(var(--rf-stack-top) + ${index * STACK_OFFSET_PX}px)` }}
    >
      <motion.div
        style={animate ? { scale } : { scale: 1 }}
        /*
          `data-rf-scroll-motion`: azaltılmış hareket tercihinde `globals.css`
          satır içi dönüşümü `!important` ile sıfırlar — JS'ten ÖNCE ve JS
          OLMADAN. Buradaki `animate` bayrağı o güvencenin tamamlayıcısıdır
          (kare kare hesabı da bırakır), yerine geçmez.

          `origin-top`: kart küçülürken üst kenarı sabit kalır; aksi hâlde
          yığındaki katlar birbirinden ayrılıp aralarında boşluk açardı.

          Yükseklik `clamp`: kaynaktaki sabit `h-[200px]` 375px'te taşıyor,
          1440px'te kayboluyordu. 13–17rem arası, görünüm yüksekliğinin
          %26'sına bağlı.
        */
        data-rf-scroll-motion
        className="h-[clamp(13rem,26vh,17rem)] w-full origin-top md:max-w-3xl"
      >
        {content}
      </motion.div>
    </div>
  );
}

export function FeaturedStackStage({ items }: { items: FeaturedStackItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  /*
    Sorgu `min-width` yönünde SORULUR ve bu bilinçlidir: sunucu anlık görüntüsü
    `false` olduğu için sunucu "dar ekran" varsayar ve dönüşümü hiç bağlamaz.
    Telefonda hidrasyondan önce bile ölçek hesabı yapılmaz.
    (Gerekçenin tamamı `lib/hooks/use-media-query.ts` içinde.)
  */
  const canStack = useMediaQuery(STACK_QUERY);

  const animate = canStack && !prefersReducedMotion;

  /*
    Kaydırma penceresi: kabın üstü ekranın üstüne geldiğinde 0, kabın altı
    ekranın altına geldiğinde 1. Yığının tamamı bu pencerede açılır.
  */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div
      ref={containerRef}
      data-rf-stack
      style={{ "--rf-stack-top": "5.5rem" } as CSSProperties}
      className={[
        /*
          DAR EKRAN: yatay kaydırmalı şerit. Yığılma deseni dar ekranda zayıf
          çalışır — kart yüksekliği, yapışma çizgisi ve adres çubuğuyla oynayan
          görünüm yüksekliği bir araya gelince kartlar ya ekranı doldurur ya da
          başlığı iter. Şerit NATIVE kaydırmadır: kütüphane yok, JS yok,
          dokunmatikte ve klavyede kendiliğinden çalışır.

          Negatif kenar boşlukları `Container`ın `px-5 sm:px-6` değerlerini
          birebir karşılar; şerit kenardan kenara akar ama kartlar hizada durur.

          `snap-proximity` seçildi, `mandatory` DEĞİL: zorunlu tutturma
          kaydırmayı ele geçirip küçük düzeltmeleri engelliyor.
        */
        "-mx-5 flex snap-x snap-proximity gap-4 overflow-x-auto px-5 pb-4 sm:-mx-6 sm:px-6",
        /*
          GENİŞ EKRAN: dikey yığın. Kartların üst üste binebilmesi için kabın
          kart sayısıyla orantılı bir yüksekliği olmalı; her kart kendi
          `sticky` kabında durup doğal akışta yer kapladığı için bu kendiliğinden
          sağlanır. Alttaki boşluk son kartın da yapışıp küçülmesine izin verir.
        */
        "md:mx-0 md:block md:gap-0 md:overflow-x-visible md:px-0 md:pb-[35vh]",
      ].join(" ")}
    >
      {items.map((item, index) => (
        <StackedCard
          key={item.id}
          index={index}
          total={items.length}
          content={item.content}
          progress={scrollYProgress}
          animate={animate}
        />
      ))}
    </div>
  );
}
