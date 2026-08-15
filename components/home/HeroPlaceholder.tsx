import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/layout/Section";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { whatsappCtaLabels } from "@/lib/site-config";

/*
  ============================================================================
  TODO: hero-decision — 21st.dev bileşeni burada değiştirilecek.

  BU BÖLÜM GEÇİCİDİR. Bilgi dosyası §13/1 sinematik ve 3D destekli bir açılış
  ister; o tasarım kararı (hangi bileşen, hangi sahne) henüz verilmedi ve
  AYRI bir görevdir. Buradaki yer tutucu bilinçli olarak:

    - 3D, canvas, video veya animasyon İÇERMEZ,
    - yeni bir bağımlılık getirmez,
    - istemci JS gerektirmez (saf sunucu bileşeni).

  Gerçek hero geldiğinde DEĞİŞMEYECEK OLAN sözleşme (bilgi dosyası §14):
  başlık, değer önerisi ve iki CTA DOM'da metin olarak kalır. 3D sahne
  yüklenmese bile kullanıcı ne satıldığını okur ve WhatsApp'a ulaşır —
  "Canvas'ta metin yok" kuralı (CLAUDE.md) bu yüzden vardır.

  Hareket: bu bölümde hiç animasyon yok. Gelecekteki geçişler için azaltılmış
  hareket tercihi zaten global olarak çözülür (`app/globals.css`,
  `prefers-reduced-motion`), bileşen başına kontrol gerekmez.
  ============================================================================
*/

export function HeroPlaceholder() {
  return (
    <Section surface="dark" id="giris" labelledBy="hero-title" width="wide">
      <div className="flex max-w-3xl flex-col gap-6">
        <p className="text-overline uppercase text-accent-tech">
          Gaziantep · Robot süpürge teknik servisi ve yedek parça
        </p>

        <h1 id="hero-title" className="text-display text-text">
          Robot süpürgeniz için parça ve teknik servis
        </h1>

        <p className="max-w-2xl text-body-lg text-text-muted">
          Robot Fix; robot süpürgelerin bakımını, onarımını ve yedek parça tedarikini tek bir
          uzmanlık altında toplar. Cihazınızın markasını ve modelini iletin, uygun çözümü birlikte
          belirleyelim.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/urunler" size="lg" variant="primary" className="sm:w-auto" fullWidth>
            Ürünleri İncele
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
    </Section>
  );
}
