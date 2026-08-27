import { Container } from "@/components/layout/Container";
import { ScrollChoreography } from "@/components/ui/scroll-choreography";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { HERO_CONTENT } from "@/lib/home/content";
import { whatsappCtaLabels } from "@/lib/site-config";

/*
  AÇILIŞ BÖLÜMÜ (bilgi dosyası §13/1).

  Bölüm SUNUCU bileşenidir. Başlık, açıklama ve dönüşüm eylemleri burada
  üretilir; yalnız görsel koreografi `ScrollChoreography` istemci sınırında
  yaşar. Böylece asenkron `WhatsAppButton` numarayı site ayarlarından sunucuda
  çözer ve temel içerik JavaScript çalışmadığında da HTML içinde kalır.

  Görsel fikir: dört ayrı cihaz/teknik detay önce yer değiştirir, ardından tek
  bir sahnede birleşir. Bu hareket markanın “önce teşhis, sonra doğru parça”
  yaklaşımını anlatır; dekoratif bir stok kolajı olarak kullanılmaz.
*/
export function Hero() {
  return (
    <section
      id="giris"
      aria-labelledby="hero-title"
      /*
        `isolate` — SAVUNMA AMAÇLI, bilinen bir hatayı kapatmıyor.

        Koreografinin intro örtüsü `z-50` taşır ve ilerleme %27'nin altındayken
        `pointer-events: auto`dur (`components/ui/scroll-choreography.tsx`).
        Yapışkan başlık da `z-50`. Bu bölüm kendi yığılma bağlamını kurmazsa
        iki `z-50` aynı bağlamda yarışır ve kâğıt üzerinde DOM'da sonra gelen
        örtü kazanır — yani başlıktaki bağlantılar tıklanamaz hâle gelmelidir.

        ÖLÇÜLDÜ: OLMUYOR. 1280px'te 50–750px arası altı kaydırma noktasında,
        `isolation: auto` ile `isolate` arasında A/B yapıldı;
        `elementFromPoint` her seferinde başlığı döndürdü. Örtü, `pointer-events`
        hâlâ `auto` iken bile başlığın tıklamasını yutmuyor.

        `isolate` yine de duruyor çünkü mevcut davranış boyama kurallarının
        ince bir ayrıntısına bağlı ve o ayrıntı bizim yazdığımız bir sözleşme
        değil. `isolate` ilişkiyi AÇIKÇA yazar: sahnenin tamamı tek bir
        yığılma bağlamına kapanır, içerideki `z-50` yalnız bölüm içinde
        anlamlı olur ve bölüm başlığın altında kalır. Bir sonraki `z-index`
        değişikliğinde bu bir varsayım değil, kural olur.
      */
      className="rf-on-dark rf-on-cinematic relative isolate"
    >
      <ScrollChoreography
        images={HERO_CONTENT.images}
        intro={
          <Container width="wide">
            <div className="max-w-3xl border-l-2 border-accent-tech bg-surface/95 px-5 py-6 shadow-(--shadow-hero) sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <p className="text-overline uppercase text-accent-tech">{HERO_CONTENT.overline}</p>

              <h1 id="hero-title" className="mt-4 text-display text-text">
                {HERO_CONTENT.title}
              </h1>

              <p className="mt-5 max-w-2xl text-body-lg text-text-muted">{HERO_CONTENT.body}</p>

              <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <ButtonLink
                  href={HERO_CONTENT.primaryCtaHref}
                  size="lg"
                  variant="primary"
                  className="sm:w-auto"
                  fullWidth
                >
                  {HERO_CONTENT.primaryCtaLabel}
                </ButtonLink>

                <WhatsAppButton
                  intent="service"
                  label={whatsappCtaLabels.service}
                  size="lg"
                  event="whatsapp_hero_service_click"
                  className="sm:w-auto"
                  fullWidth
                />
              </div>

              <p className="mt-4 max-w-2xl text-caption text-text-muted">{HERO_CONTENT.guidance}</p>
            </div>
          </Container>
        }
      />
    </section>
  );
}
