import type { Metadata } from "next";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AvailabilityBadge, type Availability } from "@/components/ui/AvailabilityBadge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { isWhatsAppConfigured, whatsappCtaLabels, whatsappPhone } from "@/lib/site-config";
import { buildProductMessage, buildServiceMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

/*
  Tasarım sistemi doğrulama sayfası.

  ÜRETİM NAVİGASYONUNDA YER ALMAZ ve indekslenmez. Buradaki tüm ürün, fiyat ve
  stok bilgileri UYDURMA DEĞİL, açıkça işaretlenmiş ÖRNEK VERİDİR (bilgi
  dosyası §20). Gerçek katalog Faz 3'te panelden girilecektir.
*/

export const metadata: Metadata = {
  title: "Tasarım Sistemi",
  robots: { index: false, follow: false, nocache: true },
};

/** [ÖRNEK] veri — gerçek ürün değildir. */
const SAMPLE_PRODUCT = {
  productName: "[ÖRNEK] Ana Fırça Modülü",
  brand: "[ÖRNEK] Marka",
  sku: "ORNEK-001",
  url: "https://example.com/urunler/ornek-urun",
} as const;

const rawColorTokens = [
  ["--rf-navy-900", "Gece Laciverti", "#0B1F33"],
  ["--rf-navy-700", "Servis Laciverti", "#123B5D"],
  ["--rf-blue-600", "Güven Mavisi", "#1769AA"],
  ["--rf-green-700", "Güven Yeşili", "#0B6E4F"],
  ["--rf-whatsapp-800", "Koyu WhatsApp Yeşili", "#075E54"],
  ["--rf-cyan-400", "Hassas Camgöbeği", "#3FC7D3"],
  ["--rf-ice-50", "Buz Beyazı", "#F5F8FA"],
  ["--rf-white", "Saf Beyaz", "#FFFFFF"],
  ["--rf-slate-700", "Koyu Arduvaz", "#334155"],
  ["--rf-mist-200", "Sis Grisi", "#D7E0E8"],
  ["--rf-cinematic-950", "Sinematik zemin", "#0B0F14"],
] as const;

const semanticTokens = [
  ["--color-surface", "Sayfa zemini", "bg-surface"],
  ["--color-surface-raised", "Kart / form zemini", "bg-surface-raised"],
  ["--color-surface-dark", "Marka anlatımı", "bg-surface-dark"],
  ["--color-surface-cinematic", "3D sahne", "bg-surface-cinematic"],
  ["--color-action", "Ana CTA", "bg-action"],
  ["--color-action-whatsapp", "WhatsApp eylemi", "bg-action-whatsapp"],
  ["--color-action-secondary", "İkincil eylem", "bg-action-secondary"],
  ["--color-accent-tech", "Teknoloji vurgusu", "bg-accent-tech"],
] as const;

/*
  Örneklerde Türkçe'nin riskli karakterleri bilinçli olarak yer alır:
  `İ` sıkı satır yüksekliğinde üstten kırpılabilir, `ı`/`i` ayrımı fontta
  eksikse satır içinde yedek fonta düşme görülür (marka kitabı §4.3).
*/
const typeScale = [
  ["display", "text-display", "İLGİ ışık — Robot süpürgeniz için tek uzman nokta"],
  ["h1", "text-h1", "İSTASYON: teknik servis, bakım ve yedek parça"],
  ["h2", "text-h2", "Arızanızı birlikte tespit edelim"],
  ["h3", "text-h3", "Batarya ve şarj sorunları"],
  ["h4", "text-h4", "Fırça, tekerlek ve mekanik parçalar"],
  ["body-lg", "text-body-lg", "Iıİi ĞğŞş Çç Öö Üü — IŞIK ışık İLGİ ilgi ÇİĞ çiğ"],
  ["body", "text-body", "Gövde metni: robot süpürgenizin modelini ve yaşadığınız sorunu iletin."],
  ["caption", "text-caption", "Yardımcı metin ve etiketler"],
  ["overline", "text-overline uppercase", "Bölüm etiketi"],
  ["mono", "text-mono font-mono", "RF-101 · 0O1lI · 1.249,00 ₺"],
] as const;

const availabilities: Availability[] = ["in_stock", "limited", "backorder", "out_of_stock"];

function Swatch({ token, name, hex }: { token: string; name: string; hex: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="size-11 shrink-0 rounded-md border border-border"
        style={{ backgroundColor: `var(${token})` }}
      />
      <span className="min-w-0">
        <span className="block text-caption font-semibold text-text">{name}</span>
        <code className="block truncate text-caption text-text-muted">{token}</code>
        <code className="block text-caption text-text-muted">{hex}</code>
      </span>
    </div>
  );
}

function Block({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 border-t border-border pt-10">
      <h2 id={id} className="text-h2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  const productMessage = buildProductMessage(SAMPLE_PRODUCT);
  const serviceMessage = buildServiceMessage();
  const productHref = whatsappPhone
    ? buildWhatsAppUrl({ phone: whatsappPhone, message: productMessage })
    : null;
  const serviceHref = whatsappPhone
    ? buildWhatsAppUrl({ phone: whatsappPhone, message: serviceMessage })
    : null;

  return (
    <>
      <Section surface="dark" spacing="tight" labelledBy="sg-title">
        <p className="text-overline text-accent-tech uppercase">Faz 1 · Doğrulama</p>
        <h1 id="sg-title" className="mt-2 text-display">
          Robot Fix Tasarım Sistemi
        </h1>
        <p className="mt-4 max-w-prose text-body-lg text-text-muted">
          Bu sayfa üretim navigasyonunda yer almaz ve arama motorlarınca indekslenmez. Buradaki
          ürün, fiyat ve stok bilgileri <strong>örnek veridir</strong>; gerçek katalog yönetim
          panelinden girilecektir.
        </p>
      </Section>

      <Container width="wide" className="flex flex-col gap-10 py-12">
        <Block title="Ham palet" id="sg-raw">
          <p className="max-w-prose text-body text-text-muted">
            Onaylı &ldquo;Güven veren teknoloji&rdquo; paleti. Bileşenler bu değerleri doğrudan
            kullanmaz; yalnız aşağıdaki semantik roller üzerinden erişir.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rawColorTokens.map(([token, name, hex]) => (
              <Swatch key={token} token={token} name={name} hex={hex} />
            ))}
          </div>
        </Block>

        <Block title="Semantik roller" id="sg-semantic">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {semanticTokens.map(([token, usage, className]) => (
              <div key={token} className="flex flex-col gap-2">
                <span
                  aria-hidden="true"
                  className={`h-14 rounded-md border border-border ${className}`}
                />
                <code className="text-caption text-text">{token}</code>
                <span className="text-caption text-text-muted">{usage}</span>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Tipografi ölçeği" id="sg-type">
          <dl className="flex flex-col gap-6">
            {typeScale.map(([name, className, sample]) => (
              <div key={name} className="flex flex-col gap-1">
                <dt className="text-caption text-text-muted">
                  <code>{name}</code>
                </dt>
                <dd className={`${className} text-text`}>{sample}</dd>
              </div>
            ))}
          </dl>
        </Block>

        <Block title="Butonlar" id="sg-buttons">
          <div className="flex flex-col gap-6">
            {(["primary", "secondary", "whatsapp", "ghost", "marketplace"] as const).map(
              (variant) => (
                <div key={variant} className="flex flex-col gap-2">
                  <code className="text-caption text-text-muted">{variant}</code>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant={variant} size="sm">
                      Küçük
                    </Button>
                    <Button variant={variant} size="md">
                      Orta
                    </Button>
                    <Button variant={variant} size="lg">
                      Büyük
                    </Button>
                    <Button variant={variant} disabled>
                      Devre dışı
                    </Button>
                    <Button variant={variant} loading>
                      Yükleniyor
                    </Button>
                  </div>
                </div>
              ),
            )}
            <div className="flex flex-col gap-2">
              <code className="text-caption text-text-muted">
                marketplace — pazaryeri adı açıkça yazılır, harici bağlantı
              </code>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="https://example.com" external variant="marketplace">
                  [ÖRNEK] Pazaryerinde görüntüle
                </ButtonLink>
              </div>
            </div>
          </div>
        </Block>

        <Block title="Bulunabilirlik durumları" id="sg-availability">
          <p className="max-w-prose text-body text-text-muted">
            Durum asla yalnız renkle anlatılmaz: her rozette metin ve simge vardır.
          </p>
          <div className="flex flex-wrap gap-3">
            {availabilities.map((status) => (
              <AvailabilityBadge key={status} status={status} />
            ))}
          </div>
        </Block>

        <Block title="Fiyat" id="sg-price">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="mb-2 text-caption text-text-muted">Fiyat yok</p>
              <Price amount={null} />
            </Card>
            <Card>
              <p className="mb-2 text-caption text-text-muted">Tek fiyat [ÖRNEK]</p>
              <Price amount={1249} />
            </Card>
            <Card>
              <p className="mb-2 text-caption text-text-muted">İndirimli [ÖRNEK]</p>
              <Price amount={1249} compareAtAmount={1499} />
            </Card>
          </div>
        </Block>

        <Block title="Form alanları" id="sg-form">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="sg-model" label="Robot süpürge modeli" hint="Örn. marka ve model adı">
              {(props) => <input type="text" placeholder="Marka / model" {...props} />}
            </Field>
            <Field id="sg-brand" label="Marka" required error="Lütfen bir marka seçin.">
              {(props) => (
                <select defaultValue="" {...props}>
                  <option value="" disabled>
                    Seçiniz
                  </option>
                  <option>[ÖRNEK] Marka A</option>
                  <option>[ÖRNEK] Marka B</option>
                </select>
              )}
            </Field>
            <Field
              id="sg-issue"
              label="Yaşadığınız sorun"
              hint="Ne zaman başladı, hangi belirtiler var?"
              className="sm:col-span-2"
            >
              {(props) => <textarea rows={3} {...props} />}
            </Field>
            <Field id="sg-disabled" label="Devre dışı alan">
              {(props) => <input type="text" disabled placeholder="Düzenlenemez" {...props} />}
            </Field>
          </div>
        </Block>

        <Block title="Yükleme, boş ve hata durumları" id="sg-states">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card>
              <div className="flex flex-col gap-3" aria-busy="true">
                <Skeleton shape="block" className="h-28" />
                <Skeleton className="h-4 w-2/3" />
                <SkeletonText lines={2} />
                <span className="sr-only">İçerik yükleniyor</span>
              </div>
            </Card>
            <EmptyState
              title="Sonuç bulunamadı"
              description="Bu filtrelerle eşleşen ürün yok. Filtreleri temizleyip yeniden deneyin."
              action={
                <Button variant="secondary" size="sm">
                  Filtreleri temizle
                </Button>
              }
            />
            <ErrorState
              description="Liste yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin."
              action={
                <Button variant="secondary" size="sm">
                  Tekrar dene
                </Button>
              }
            />
          </div>
        </Block>

        <Block title="WhatsApp şablonları" id="sg-whatsapp">
          {isWhatsAppConfigured ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <h3 className="text-h4">Ürün mesajı</h3>
                <pre className="overflow-x-auto rounded-md border border-border bg-surface-raised p-4 text-caption whitespace-pre-wrap text-text-muted">
                  {productMessage}
                </pre>
                <p className="text-caption text-text-muted">
                  Örnek üründe fiyat <strong>yok</strong>; şablonda fiyat satırı hiç yazılmadı.
                </p>
                {productHref && (
                  <p className="text-caption break-all text-text-muted">
                    <code data-testid="wa-product-href">{productHref}</code>
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <WhatsAppButton
                    intent="product"
                    product={SAMPLE_PRODUCT}
                    label={whatsappCtaLabels.productInfo}
                    event="whatsapp_product_info_click"
                  />
                  <WhatsAppButton
                    intent="product"
                    product={SAMPLE_PRODUCT}
                    label={whatsappCtaLabels.productOrder}
                    event="whatsapp_product_order_click"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-h4">Servis mesajı</h3>
                <pre className="overflow-x-auto rounded-md border border-border bg-surface-raised p-4 text-caption whitespace-pre-wrap text-text-muted">
                  {serviceMessage}
                </pre>
                {serviceHref && (
                  <p className="text-caption break-all text-text-muted">
                    <code data-testid="wa-service-href">{serviceHref}</code>
                  </p>
                )}
                <WhatsAppButton
                  intent="service"
                  label={whatsappCtaLabels.service}
                  event="whatsapp_service_click"
                />
              </div>
            </div>
          ) : (
            <ErrorState
              title="WhatsApp numarası yapılandırılmamış"
              description="NEXT_PUBLIC_WHATSAPP_PHONE tanımlı değil; bozuk bağlantı üretmemek için WhatsApp butonları gizlendi."
            />
          )}
        </Block>
      </Container>

      <Section surface="dark" labelledBy="sg-dark">
        <h2 id="sg-dark" className="text-h2">
          Koyu yüzey — marka anlatımı
        </h2>
        <p className="mt-3 max-w-prose text-body-lg text-text-muted">
          Aynı bileşenler, değişen tek şey bağlam. Semantik roller koyu sete geçer; bağlantı ve odak
          rengi camgöbeğine döner. <a href="#sg-dark">Örnek bağlantı</a>
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="primary">Ana eylem</Button>
          <Button variant="secondary">İkincil</Button>
          <Button variant="ghost">Bağlantı eylemi</Button>
          <AvailabilityBadge status="in_stock" />
        </div>
        <Card className="mt-6 max-w-md">
          <h3 className="text-h4">Koyu zeminde kart</h3>
          <p className="mt-2 text-body text-text-muted">
            Kart sınırı koyu arayüzde de görünür kalır.
          </p>
        </Card>
      </Section>

      <Section surface="cinematic" labelledBy="sg-cinematic">
        <h2 id="sg-cinematic" className="text-h2">
          Sinematik yüzey — yalnız 3D sahneler
        </h2>
        <p className="mt-3 max-w-prose text-body-lg text-text-muted">
          Bu zemin (#0B0F14) alternatif paletten alınan tek tokendır. Katalog ve karar alanlarında
          kullanılmaz.
        </p>
      </Section>
    </>
  );
}
