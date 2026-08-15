import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { HeroScrollStage } from "@/components/home/HeroScrollStage";
import { Section } from "@/components/layout/Section";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { HERO_CONTENT } from "@/lib/home/content";
import { whatsappCtaLabels } from "@/lib/site-config";

/*
  AÇILIŞ BÖLÜMÜ (bilgi dosyası §13/1).

  SUNUCU BİLEŞENİDİR. Kaydırmaya bağlı hareket `HeroScrollStage` içinde
  (istemci) yaşar; başlık, değer önerisi, iki CTA ve görsel BURADA, sunucuda
  üretilip oraya geçirilir.

  Bunun sebebi mimari bir zorunluluk ve aynı zamanda bir güvence:
    - `WhatsAppButton` asenkron bir SUNUCU bileşenidir (numarayı site
      ayarlarından okur) — bir istemci bileşeninin içine yazılamaz.
    - Böylece metin ve bağlantılar istemci paketine girmeden sunucu HTML'inde
      bulunur: JavaScript hiç çalışmasa bile kullanıcı ne satıldığını okur ve
      WhatsApp'a ulaşır (bilgi dosyası §14 — "3D sahne yüklenmese bile ...
      erişilebilir olmalıdır"; CLAUDE.md — "Canvas'ta metin yok").

  İÇERİK SÖZLEŞMESİ DEĞİŞMEDİ: metinler `lib/home/content.ts` içindeki
  `HERO_CONTENT`tan gelir, burada yeniden yazılmaz.

  HAREKET: azaltılmış hareket tercihi `HeroScrollStage` içinde `useReducedMotion`
  ile ele alınır — global CSS katmanı satır içi JS dönüşümlerini durduramaz.
*/

export function Hero() {
  return (
    <Section surface="dark" id="giris" labelledBy="hero-title" width="wide" spacing="tight">
      <HeroScrollStage
        header={
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <p className="text-overline uppercase text-accent-tech">{HERO_CONTENT.overline}</p>

            <h1 id="hero-title" className="text-display text-text">
              {HERO_CONTENT.title}
            </h1>

            <p className="max-w-2xl text-body-lg text-text-muted">{HERO_CONTENT.body}</p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
              <ButtonLink
                href={HERO_CONTENT.primaryCtaHref}
                size="lg"
                variant="primary"
                className="sm:w-auto"
                fullWidth
              >
                {HERO_CONTENT.primaryCtaLabel}
              </ButtonLink>
              {/*
                Numara yapılandırılmamışsa bu buton HİÇ render edilmez
                (WhatsAppButton içinde çözülür) — bozuk wa.me bağlantısı gösterilmez.
              */}
              <WhatsAppButton
                intent="service"
                label={whatsappCtaLabels.productInfo}
                size="lg"
                event="whatsapp_hero_click"
                className="sm:w-auto"
                fullWidth
              />
            </div>
          </div>
        }
      >
        {/*
          GÖRSEL YER TUTUCUDUR (gerekçe: `lib/home/content.ts` ve dosyanın
          kendi içindeki not). Alt metni bunu açıkça söyler; sessizce gerçek
          ürün fotoğrafıymış gibi sunulmaz.

          `priority`: kartın görseli ilk ekranda ve LCP adayıdır, tembel
          yüklenmemelidir.

          `unoptimized`: kaynak bir SVG'dir ve `next/image` iyileştirici SVG'yi
          bilinçli olarak reddeder (`dangerouslyAllowSVG` kapalı). O bayrağı
          TÜM site için açmak, ileride kullanıcı/panel kaynaklı bir SVG'nin
          iyileştiriciden geçmesine kapı aralardı; tek bir statik varlık için
          bu risk alınmaz. Vektör zaten yeniden boyutlandırmadan kazanç
          sağlamaz. Gerçek fotoğraf (JPEG/WebP) geldiğinde bu bayrak KALKAR.
        */}
        <Image
          src={HERO_CONTENT.image.src}
          alt={HERO_CONTENT.image.alt}
          width={HERO_CONTENT.image.width}
          height={HERO_CONTENT.image.height}
          priority
          unoptimized
          sizes="(min-width: 1024px) 64rem, 100vw"
          className="h-auto w-full"
        />
      </HeroScrollStage>
    </Section>
  );
}
