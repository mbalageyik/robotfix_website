import Image from "next/image";
import Link from "next/link";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { Price } from "@/components/ui/Price";
import { PartsIcon } from "@/components/ui/icons";
import { productImageUrl } from "@/lib/images";
import type { ProductListItem } from "@/lib/data/types";

/*
  SEÇKİ KARTI — yığılan vitrinin tek bir katı.

  SUNUCU BİLEŞENİDİR ve bu bir tercih değil, bölümün varlık şartı. Kart
  yığınının hareketi istemcide (`FeaturedStackStage`) yaşar; kartın KENDİSİ —
  bağlantı, ad, marka, fiyat, stok durumu — sunucu HTML'inde üretilir ve oraya
  `ReactNode` olarak geçirilir. Böylece JavaScript hiç çalışmasa bile ziyaretçi
  ürünü okur ve detay sayfasına gider (bilgi dosyası §14; CLAUDE.md).

  `ProductCard` ile NEDEN AYRI: katalog kartı dikey bir ızgara hücresidir
  (kare görsel üstte, metin altta). Bu kart yatay bir sahne katıdır — görsel
  solda, metin sağda, yükseklik sabit. Aynı bileşeni iki yerleşime zorlamak
  ikisini de bozardı. PAYLAŞILAN ŞEY VERİ SUNUMUDUR: fiyat `Price`, stok
  `AvailabilityBadge` ile gösterilir; ikisi de tek kaynaktır ve burada yeniden
  yazılmaz (fiyat/indirim kuralları §6 — `components/ui/Price.tsx`).
*/

export interface FeaturedProductPanelProps {
  product: ProductListItem;
}

export function FeaturedProductPanel({ product }: FeaturedProductPanelProps) {
  const imageUrl = product.primaryImage ? productImageUrl(product.primaryImage.storagePath) : null;

  /*
    ALT METNİ BOŞ BIRAKILMAZ. Hizmet panellerindeki fotoğraf dekoratifti —
    orada görsel hiçbir bilgi taşımıyordu. Burada görsel ÜRÜNÜN KENDİSİDİR:
    görmeyen kullanıcı en azından neyin resmedildiğini bilmelidir. Yönetici bir
    alt metin yazdıysa o kullanılır, yazmadıysa ürün adına düşülür.
  */
  const altText = product.primaryImage?.altText?.trim() || product.name;

  return (
    <article
      /*
        `rf-on-dark`: kart koyu bir yüzeydir; semantik renk rolleri (metin,
        kenar, odak halkası) koyu sete çevrilir. Ham renk yazılmaz.
        `h-full`: yığındaki her kat aynı yüksekliktedir, aksi hâlde üst üste
        binen katların kenarları kaymış görünür.
      */
      className="rf-on-dark relative flex h-full w-full overflow-hidden rounded-xl border border-border-strong bg-surface-dark-raised shadow-(--shadow-hero) sm:rounded-2xl"
    >
      {/* ---- Görsel yarısı ------------------------------------------- */}
      <div className="relative w-2/5 shrink-0 overflow-hidden bg-surface-sunken sm:w-[45%]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={altText}
            fill
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 40vw, 45vw"
            /*
              PRELOAD/PRIORITY YOK — hiçbir seçki kartı LCP adayı değildir.

              Burada eskiden ilk kart `priority` alıyordu ve gerekçesi "ilk
              kart LCP adayıdır" diye yazılmıştı. Ölçüldüğünde tutmadı:
              seçki bölümü ana sayfanın çok aşağısında, katlanmanın ALTINDA.
              O `priority` `<head>`e ikinci bir `<link rel="preload">`
              koyuyor ve gerçek LCP elemanı olan hero görseliyle bant
              genişliği için yarışıyordu.

              `priority` ayrıca Next 16'da kullanımdan kaldırıldı (yerine
              `preload`). Buraya `preload={false}` yazmıyoruz çünkü varsayılan
              zaten o; kart görselleri `loading="lazy"` ile görünüm alanına
              yaklaşınca inecek. Kardeş desen:
              `components/ui/scroll-choreography.tsx`.
            */
            className="object-cover"
          />
        ) : (
          /*
            GÖRSEL YOKSA: hizmet panellerindeki desen — marka degradesi +
            büyük dekoratif simge. Stok fotoğraf İNDİRİLMEZ; olmayan bir
            fotoğrafın yerine başkasınınkini koymak ürünü yanlış tanıtmaktır.
            Simge `aria-hidden`: ürün adı zaten metin olarak yanında duruyor.
          */
          <div className="flex h-full items-center justify-center bg-linear-to-br from-surface-dark-raised to-surface-sunken">
            <PartsIcon aria-hidden="true" className="size-16 text-text-disabled sm:size-20" />
            <span className="sr-only">Bu ürünün görseli henüz eklenmedi.</span>
          </div>
        )}
      </div>

      {/* ---- Metin yarısı -------------------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:gap-3 sm:p-6">
        <p className="truncate text-caption text-text-muted">
          {product.brand?.name ?? "Marka belirtilmedi"}
        </p>

        <h3 className="text-body-lg font-semibold text-text sm:text-h4">
          {/*
            TIKLAMA HEDEFİ GERÇEK BİR BAĞLANTIDIR — sarmalayıcı bir `onClick`
            değil. `after:inset-0` bağlantının tıklama alanını kartın tamamına
            yayar; klavye kullanıcısı tek bir odak durağı görür, ekran okuyucu
            tek bir bağlantı duyurur ve bağlantı yeni sekmede açılabilir.
            JavaScript olmadan da düz bir <a href> olarak çalışır.
          */}
          <Link
            href={`/urunler/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:text-link"
          >
            <span className="line-clamp-2">{product.name}</span>
          </Link>
        </h3>

        {/* mt-auto: kart yüksekliği sabit olduğu için fiyat ve durum alta oturur. */}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <AvailabilityBadge status={product.availability} className="self-start" />
          {/*
            Fiyat ve indirim TEK KAYNAKTAN gelir. Yüzde `Price` içinde
            gerçek iki değerden hesaplanır (§6): eski fiyat yoksa indirim de
            YOKTUR, fiyat yoksa "Fiyat için iletişime geçin" yazar. Bu
            bileşene uydurulacak bir şey bırakılmamıştır.
          */}
          <Price
            amount={product.priceMinor === null ? null : product.priceMinor / 100}
            compareAtAmount={
              product.compareAtPriceMinor === null ? null : product.compareAtPriceMinor / 100
            }
            currency={product.currency}
          />
        </div>
      </div>
    </article>
  );
}
