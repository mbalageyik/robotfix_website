"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { getServiceIcon } from "@/components/ui/icons";
import type { ServiceImage } from "@/lib/home/service-media";

/*
  HİZMET PANELLERİ — yatayda genişleyen şerit.

  Desen kaynağı: "elastic gallery" — `flex-grow` tabanlı genişleme, degrade
  örtü ve aktif/pasif içerik geçişi referans alındı. Veri, renkler, metinler
  ve ERİŞİLEBİLİRLİK tümüyle yeniden yazıldı.

  ZEMİN: FOTOĞRAF VARSA FOTOĞRAF, YOKSA DEGRADE + SİMGE.
  `services` tablosunda hâlâ görsel alanı yoktur; panel fotoğrafı `icon_key`
  üzerinden bir KOD EŞLEMESİNDEN gelir (`lib/home/service-media.ts` — nedeni
  ve yer tutucu statüsü orada yazılıdır). Eşleme bulunmayan hizmet eski
  görünümünü korur: marka degradesi + büyük dekoratif simge. Yani fotoğraf
  bir katmandır, hizmetin görünmesinin koşulu değildir.

  Fotoğraflar DEKORATİFTİR (`alt=""`): hizmet adı ve açıklaması panelde METİN
  olarak durur, görsel hiçbir bilgiyi tek başına taşımaz. Simge de öyle
  (bilgi dosyası §14, §15 — simge/renk tek gösterge olamaz).

  KONTRAST — fotoğrafın üstündeki metin nasıl okunur kalıyor:
  metnin durduğu iki bant fotoğrafı neredeyse tamamen kapatır. Panelin
  tamamına düz bir lacivert perde serilir (kapalı panelde daha koyu, böylece
  açık panel öne çıkar), sonra ÜSTE başlık bandı, ALTA açıklama/CTA bandı için
  iki degrade biner. Başlığın oturduğu en üst sırada perde ~%94, açıklamanın
  oturduğu en alt sırada %100 opaktır; yani kontrast fotoğrafın o karesindeki
  parlaklığa BIRAKILMAZ. Fotoğraflar ayrıca tek reçeteyle lacivert iki tonuna
  çevrildiği için perdenin altındaki en parlak nokta bile sınırlıdır.

  ERİŞİLEBİLİRLİK SÖZLEŞMESİ:
    - Her panelin tıklama/odak hedefi GERÇEK bir `<button>`tır; paneli
      kaplar, erişilebilir adı hizmet adıdır.
    - `aria-expanded` + `aria-controls` ile açılan içerik bildirilir.
    - Klavye: Tab ile odaklanınca panel açılır (`onFocus`), Enter/Space
      `onClick` ile de çalışır.
    - Fare: `onMouseEnter` panelin KENDİSİNDE durur, butonda değil —
      böylece açıklama metninin üstünde gezinmek paneli kapatmaz.
    - Kapalı panellerin CTA'sı HİÇ RENDER EDİLMEZ: görünmez ama
      odaklanılabilir bir bağlantı klavye kullanıcısı için tuzaktır.
    - `<a>` bir `<button>` içine YERLEŞTİRİLEMEZ (geçersiz HTML). Bu yüzden
      buton ve CTA kardeştir; buton paneli kaplar, CTA onun üstünde durur.
*/

export interface ServicePanelItem {
  id: string;
  name: string;
  description: string | null;
  /** `services.icon_key` — tanınmayan anahtar simgesiz render edilir. */
  iconKey: string | null;
  /**
   * Panel zemininin yerel fotoğrafı. `null` ise panel degrade + simge
   * zemininde kalır — bu bir hata hâli değil, geçerli bir görünümdür.
   */
  image: ServiceImage | null;
  /**
   * Sunucuda üretilmiş WhatsApp CTA'sı. İstemci bileşeni içinde
   * oluşturulamaz: `WhatsAppButton` numarayı site ayarlarından okuyan
   * ASENKRON bir sunucu bileşenidir.
   */
  cta: ReactNode;
}

export function ServicePanels({ items }: { items: ServicePanelItem[] }) {
  /*
    Başlangıçta ilk hizmet açık. Sabit ve veriden türetilmiş bir değer:
    sunucu ve istemcinin ilk render'ı aynı olur, hidrasyon uyuşmazlığı
    doğmaz.
  */
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  return (
    <ul
      className={cn(
        // Mobil: dikey akordeon (gerekçe ServicesSection'da).
        "mt-(--spacing-heading-gap) flex flex-col gap-2",
        /*
          Masaüstü: sabit yükseklikli yatay şerit.

          32rem → 36rem (Faz 7, +%12,5): teknik servis anlatımının sayfadaki
          görsel ağırlığını artırmak için (§22 · 1). Ölçü keyfî değil —
          32rem'de açık panelin açıklaması ve CTA'sı `mt-auto` ile alta
          yaslandığında başlıkla arasında nefes kalmıyordu. 36rem, 900px'lik
          bir dizüstü ekranında bölümü hâlâ tek bakışta bırakır; daha
          yükseği başlığı ekran dışına iterdi.
        */
        "md:h-[36rem] md:flex-row md:gap-3",
      )}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const contentId = `hizmet-panel-${item.id}`;
        const ServiceIcon = getServiceIcon(item.iconKey);

        return (
          <li
            key={item.id}
            /*
              Fare etkileşimi panelin tamamında geçerli. Klavye karşılığı
              butonun `onFocus`udur — yani bu işleyici tek erişim yolu değil.
            */
            onMouseEnter={() => setActiveId(item.id)}
            className={cn(
              // `rf-on-dark`: panel koyu bir yüzeydir; semantik renk rolleri
              // koyu sete çevrilir (metin, kenar, odak halkası dâhil).
              "rf-on-dark relative overflow-hidden rounded-lg border border-border",
              "transition-[flex-grow] duration-(--duration-slow) ease-(--ease-emphasized)",
              // Mobilde büyüme YÜKSEKLİKTEN gelir; dokunma hedefi korunur.
              "min-h-14 md:min-h-0",
              /*
                Açık panelin şeritteki payı 4/1'den 5/1'e çıkarıldı (Faz 7):
                dört hizmette okunan panel şeridin %57'sinden %62,5'ine
                genişler. Kapalı paneller dikey adlarını taşıyacak kadar
                yerini korur — 6/1'de adlar sıkışmaya başlıyordu.
              */
              isActive ? "md:flex-[5]" : "md:flex-[1]",
            )}
          >
            {/* Dekoratif zemin: fotoğraf (varsa) ya da marka degradesi + simge. */}
            <div aria-hidden="true" className="absolute inset-0">
              {/*
                Degrade HER ZAMAN serilir: fotoğraf yüklenene kadar (ve hiç
                yüklenmezse) panelin zemini boş beyaz bir dikdörtgen olmaz.
              */}
              <div className="absolute inset-0 bg-linear-to-br from-surface-dark-raised to-surface-dark" />

              {item.image ? (
                /*
                  `fill` + `object-cover`: panelin genişliği açık/kapalı
                  durumuna göre değiştiği için görselin en-boy oranı sabit
                  tutulamaz; kaynak dosyalar bu yüzden 3:4 dikey hazırlandı —
                  dar şeritte de geniş panelde de kadraj ayakta kalır.

                  `sizes` iki durumun ÜST SINIRINI söyler: masaüstünde açık
                  panel şeridin ~%62'sidir, kapalı panel bunun çok altında
                  kalır; tek değer verilmek zorunda olduğu için büyük olan
                  yazılır (küçültmek kapalı panelde bulanıklık üretirdi).

                  `priority` YOK: bölüm ilk ekranda değil, LCP adayı da değil.
                */
                <Image
                  src={item.image.src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className={cn(
                    "object-cover",
                    "transition-transform duration-(--duration-slow) ease-(--ease-emphasized)",
                    // Kapalı panelde hafif yakınlaşma: açılırken kadraj
                    // geri çekilir, şerit "nefes alır".
                    isActive ? "scale-100" : "scale-110",
                  )}
                />
              ) : (
                ServiceIcon && (
                  <ServiceIcon
                    className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                      "text-accent-tech transition-all duration-(--duration-slow) ease-(--ease-emphasized)",
                      isActive ? "size-40 opacity-15" : "size-24 opacity-10",
                    )}
                  />
                )
              )}

              {item.image ? (
                /*
                  FOTOĞRAFLI PANELİN ÜÇ KATMANI. Değerler keyfî değil,
                  ölçülmüş bir üst sınırdan türetildi: iki tonlamanın beyaz
                  ucu kapatıldığı için hiçbir fotoğrafın en parlak noktası
                  bağıl parlaklık 0,56'yı geçmiyor (reçete:
                  `docs/varlik-lisanslari.md`). Aşağıdaki perde oranları o
                  değere göre seçildi; metnin kontrastı fotoğrafın hangi
                  karesine denk geldiğine BIRAKILMIYOR.
                */
                <>
                  {/*
                    1. DÜZ PERDE. Kapalı panelde %75: dikey ad üstünde beyaz
                    metin ≈5,2:1 kalır ve okunan panel şeritte kendiliğinden
                    öne çıkar. Açık panelde %15 — fotoğraf orada görünsün diye.

                    Bu bir "renkle anlatma" değildir: hangi panelin açık
                    olduğu ayrıca metinle (açıklama + CTA) ve `aria-expanded`
                    ile bellidir.

                    AÇIK PANELDE MOBİL %70, MASAÜSTÜ %15 — NEDEN İKİ DEĞER:
                    aşağıdaki iki bant panelin YÜZDESİYLE ölçülür (üstte 2/5,
                    altta 3/5), metin bloğu ise PİKSELLE büyür. Masaüstünde
                    panel 576px'tir: açıklama alt çeyrekte, bandın opak
                    ucunda oturur (ölçülen ≈5,8:1). Mobilde aynı panel 243px'e
                    iner ve açıklama tek başına 112px tutar — yani bandların
                    %40 çizgisinde BİRLEŞTİĞİ, ikisinin de saydam olduğu
                    dikişin tam üstüne düşer. Orada perde %15'ken fotoğrafın
                    en parlak noktasına karşı ölçülen kontrast 1,52:1'e kadar
                    düşüyordu (375px'te ölçüldü, AA sınırı 4,5:1).

                    Mobilde çözüm bandları büyütmek değil: 243px'lik bir
                    panelde metnin kaplamadığı "orta" zaten yoktur, fotoğraf
                    orada resim değil DOKU'dur. Perde bu yüzden %70'e çıkar —
                    aynı en parlak nokta ≈5,8:1'e döner. Masaüstü ölçüsüne
                    dokunulmaz.
                  */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-surface-dark",
                      "transition-opacity duration-(--duration-slow) ease-(--ease-standard)",
                      isActive ? "opacity-70 md:opacity-15" : "opacity-75",
                    )}
                  />

                  {/*
                    2. BAŞLIK BANDI. Başlık panelin ÜSTÜNDE durur; alttaki
                    okunabilirlik degradesi oraya yetişmez. Üst kenarda %85 →
                    açık panelde başlık ≈6,7:1.
                  */}
                  <div className="absolute inset-x-0 top-0 h-2/5 bg-linear-to-b from-surface-dark/85 via-surface-dark/40 to-transparent" />

                  {/*
                    3. AÇIKLAMA BANDI. Açıklama ve CTA panelin alt %25'inde
                    durur; bant orada ≥%85 opaktır (gövde metni ≈5,8:1).
                    Yüksekliği 3/5 ile sınırlı: panelin ortası fotoğrafa
                    kalsın diye.
                  */}
                  <div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-surface-dark via-surface-dark/85 to-transparent" />
                </>
              ) : (
                /*
                  Fotoğrafsız panelin tek örtüsü: metin degradenin en koyu
                  ucunda durur. Aktif panelde daha güçlü — orada gerçek metin
                  vardır.
                */
                <div
                  className={cn(
                    "absolute inset-0 bg-linear-to-t from-surface-dark via-surface-dark/55 to-transparent",
                    "transition-opacity duration-(--duration-slow) ease-(--ease-standard)",
                    isActive ? "opacity-95" : "opacity-70",
                  )}
                />
              )}
            </div>

            {/*
              AKIŞTAKİ İÇERİK — panelin yüksekliğini MOBİLDE bu belirler.

              Mutlak konumlandırılsaydı `<li>` boş kalır ve mobil akordeon
              hiç büyümezdi (masaüstünde yükseklik sabit olduğu için sorun
              görünmez, mobilde içerik taşardı).

              `pointer-events-none`: tıklama ve hover altındaki butona geçer.
              Yalnız CTA yeniden tıklanabilir yapılır.
            */}
            <div className="pointer-events-none relative z-20 flex h-full flex-col p-4 md:p-6">
              <h3
                className={cn(
                  "font-semibold text-text transition-all duration-(--duration-slow) ease-(--ease-emphasized)",
                  isActive ? "text-h4" : "text-body",
                  /*
                    Kapalı panelde masaüstünde ad DİKEY yazılır: şerit dar
                    olduğunda yatay metin kesilirdi. Mobilde şerit tam
                    genişlikte olduğu için ad her zaman yataydır.
                  */
                  !isActive && "md:[writing-mode:vertical-rl] md:rotate-180 md:self-center",
                )}
              >
                {item.name}
              </h3>

              <div
                id={contentId}
                /* Kapalıyken açıklama ekran okuyucuya tekrar edilmez. */
                aria-hidden={!isActive}
                className={cn(
                  // `mt-auto`: açıklama ve CTA panelin ALTINA yaslanır,
                  // başlıkla çakışmaz.
                  "mt-auto flex flex-col gap-3",
                  "transition-all duration-(--duration-slow) ease-(--ease-emphasized)",
                  isActive
                    ? "translate-y-0 pt-6 opacity-100"
                    : "h-0 translate-y-4 overflow-hidden opacity-0",
                )}
              >
                {item.description && (
                  <p className="max-w-prose text-body text-text-muted">{item.description}</p>
                )}

                {/*
                  CTA yalnız AÇIK panelde var olur — kapalı panelde hiç
                  render edilmez, böylece görünmez bir odak durağı oluşmaz.
                */}
                {isActive && <div className="pointer-events-auto">{item.cta}</div>}
              </div>
            </div>

            {/*
              Tıklama/odak hedefi: paneli kaplayan gerçek buton. İçeriğin
              ALTINDA (z-10) durur; içerik `pointer-events-none` olduğu için
              panelin her yerine yapılan tıklama buraya ulaşır.

              Erişilebilir adı hizmet adıdır. Ad görsel olarak yukarıdaki
              `<h3>`te durduğu için burada `sr-only` kopya kullanılır —
              butonun adsız kalması ekran okuyucuda "boş buton" demektir.
            */}
            <button
              type="button"
              aria-expanded={isActive}
              aria-controls={contentId}
              onClick={() => setActiveId(item.id)}
              onFocus={() => setActiveId(item.id)}
              className="absolute inset-0 z-10 cursor-pointer"
            >
              <span className="sr-only">{item.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
