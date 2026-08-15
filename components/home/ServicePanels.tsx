"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { getServiceIcon } from "@/components/ui/icons";

/*
  HİZMET PANELLERİ — yatayda genişleyen şerit.

  Desen kaynağı: "elastic gallery" — `flex-grow` tabanlı genişleme, degrade
  örtü ve aktif/pasif içerik geçişi referans alındı. Veri, renkler, metinler
  ve ERİŞİLEBİLİRLİK tümüyle yeniden yazıldı.

  GÖRSEL YOK — ŞEMADA DA YOK.
  `services` tablosunda görsel alanı bulunmaz (bkz. migrasyon: name, slug,
  short/long_description, icon_key…). Kaynak desendeki stok fotoğraflar
  hotlink EDİLMEDİ ve uydurma görsel üretilmedi; panel zemini marka
  degradesi + `icon_key`ten gelen büyük, dekoratif simgedir. Simge yalnız
  dekordur (`aria-hidden`): hizmet adı her panelde METİN olarak durur
  (bilgi dosyası §15 — simge tek gösterge olamaz).

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
            {/* Dekoratif zemin: marka degradesi + büyük hizmet simgesi. */}
            <div aria-hidden="true" className="absolute inset-0">
              <div className="absolute inset-0 bg-linear-to-br from-surface-dark-raised to-surface-dark" />

              {ServiceIcon && (
                <ServiceIcon
                  className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    "text-accent-tech transition-all duration-(--duration-slow) ease-(--ease-emphasized)",
                    isActive ? "size-40 opacity-15" : "size-24 opacity-10",
                  )}
                />
              )}

              {/*
                Okunabilirlik örtüsü: metin degradenin en koyu ucunda durur.
                Aktif panelde daha güçlü — orada gerçek metin vardır.
              */}
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-t from-surface-dark via-surface-dark/55 to-transparent",
                  "transition-opacity duration-(--duration-slow) ease-(--ease-standard)",
                  isActive ? "opacity-95" : "opacity-70",
                )}
              />
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
