import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { ServiceShowcaseStage } from "@/components/home/ServiceShowcaseStage";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { SERVICE_SHOWCASE } from "@/lib/home/content";
import { whatsappCtaLabels } from "@/lib/site-config";

/*
  SERVİS VİTRİNİ (bilgi dosyası §2, §14, §22 · 1).

  NE ANLATIR: teknik servisin markanın çekirdeği olduğunu — "yalnızca yedek
  parça satıcısı değil" konumlandırmasının görsel karşılığı. Hemen üstündeki
  `ServicesSection` HANGİ hizmetlerin verildiğini (veritabanından) sayar; bu
  bölüm o listenin arkasındaki uzmanlık iddiasını taşır. `ServiceProcessSection`
  ise İŞLEYİŞİ anlatır ve işletme onayı bekler — üçü ayrı içerik parçasıdır,
  metinleri birbirinden kopyalanmaz.

  SUNUCU BİLEŞENİDİR. Kaydırmaya bağlı hareket ve videonun koşullu yüklenmesi
  `ServiceShowcaseStage` içinde (istemci) yaşar; başlık, gövde, CTA ve poster
  görseli BURADA, sunucuda üretilip oraya geçirilir. Gerekçe Hero'dakiyle
  aynıdır: `WhatsAppButton` numarayı site ayarlarından okuyan ASENKRON bir
  sunucu bileşenidir ve bir istemci bileşeninin içine yazılamaz; ayrıca metin
  istemci paketine girmeden sunucu HTML'inde durur (§14).

  YÜZEY: koyu. Bilgi dosyası §15 koyu yüzeyi MARKA ANLATIMI için ayırır; burası
  bir katalog ya da karar alanı değildir.

  KONTRAST: metin videonun ÜSTÜNDE DEĞİL, yanındaki sütundadır. Kaydırılan bir
  görüntünün üstündeki metnin kontrastı kareden kareye değişir ve ölçülemez;
  bu yüzden metin bölümün kendi koyu zemininde durur, video ayrı bir çerçevede.
*/

export function ServiceShowcaseSection() {
  return (
    <Section
      id="servis-vitrini"
      labelledBy="servis-vitrini-baslik"
      surface="cinematic"
      width="wide"
    >
      <ServiceShowcaseStage
        videoSrc={SERVICE_SHOWCASE.media.videoSrc}
        header={
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-overline uppercase text-accent-tech">{SERVICE_SHOWCASE.overline}</p>

            <h2 id="servis-vitrini-baslik" className="text-h2">
              {SERVICE_SHOWCASE.title}
            </h2>

            <p className="text-body-lg text-text-muted">{SERVICE_SHOWCASE.body}</p>

            <div className="mt-2">
              {/*
                Numara yapılandırılmamışsa bu buton HİÇ render edilmez
                (WhatsAppButton içinde çözülür) — bozuk wa.me bağlantısı
                gösterilmez. Bölüm o durumda metniyle ayakta kalır.
              */}
              <WhatsAppButton
                intent="service"
                label={whatsappCtaLabels.service}
                size="lg"
                event="whatsapp_showcase_click"
              />
            </div>
          </div>
        }
        poster={
          /*
            POSTER HER ZAMAN RENDER EDİLİR ve videonun altında durur: dar
            ekranda, azaltılmış hareket tercihinde, veri tasarrufunda ve JS
            hiç çalışmadığında bölümün görseli budur (gerekçe ve dört kapı:
            `ServiceShowcaseStage`).

            `fill` + `object-cover`: çerçeve en-boy oranını kendi belirler,
            görsel ona uyar. `sizes` masaüstünde çerçevenin gerçek payını
            söyler — aksi hâlde `next/image` 100vw varsayıp gereksiz büyük
            dosya indirir.

            `priority` YOKTUR: bu bölüm ilk ekranda değildir, LCP adayı da
            değildir; tembel yüklenmesi doğrudur.
          */
          <Image
            src={SERVICE_SHOWCASE.media.poster.src}
            alt={SERVICE_SHOWCASE.media.poster.alt}
            fill
            sizes="(min-width: 1024px) 60rem, 100vw"
            className="object-cover"
          />
        }
      />
    </Section>
  );
}
