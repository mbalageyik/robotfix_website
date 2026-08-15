import Image from "next/image";
import Link from "next/link";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { productImageUrl } from "@/lib/images";
import type { ProductListItem } from "@/lib/data/types";

/*
  Katalog kartı — sunucu bileşeni, istemci JS gerektirmez.

  ERİŞİLEBİLİRLİK: kartın tamamı tıklanabilir ama tıklama alanı bağlantının
  KENDİSİDİR (`after:absolute inset-0`), sarmalayıcı bir onClick değil. Böylece
  klavye kullanıcısı tek bir odak durağı görür, ekran okuyucu tek bir bağlantı
  duyurur ve bağlantı yeni sekmede açılabilir.

  Görsel yoksa kart bozulmaz: aynı orandaki nötr bir yer tutucu gösterilir.
  "Görsel yok" bilgisi metin olarak da vardır — yalnız boş bir kutu bırakmayız.
*/

export interface ProductCardProps {
  product: ProductListItem;
  /**
   * İlk ekranda görünen kartlar için `true`. LCP görselinin lazy kalmaması
   * gerekir; geri kalan her kart tembel yüklenir (varsayılan).
   */
  priority?: boolean;
}

/*
  `w-full` ZORUNLU (aşağıdaki Card'da): kart, ızgara hücresi olan
  `<li className="flex">` içinde bir FLEX ÖĞESİDİR. Genişlik verilmezse flex
  öğesi içeriğine göre daralır ve aynı satırdaki kartlar farklı genişliklerde
  çıkar — adı uzun olan geniş, kısa olan dar görünür. `h-full` yüksekliği
  hizalar, genişliği hizalamaz.
*/
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const imageUrl = product.primaryImage ? productImageUrl(product.primaryImage.storagePath) : null;

  /*
    Alt metin: yönetici bir alt metin yazdıysa o kullanılır. Yazmadıysa ürün
    adına düşeriz — ürün görseli dekoratif değildir, alt metni boş bırakılamaz.
  */
  const altText = product.primaryImage?.altText?.trim() || product.name;

  return (
    <Card variant="interactive" padding="none" className="relative flex h-full w-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-surface-sunken">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={altText}
            fill
            /* Izgara: mobilde 1, sm'de 2, lg'de 3, xl'de 4 sütun. */
            sizes="(min-width: 1280px) 22rem, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <span className="text-caption text-text-disabled">Ürün görseli henüz eklenmedi</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-caption text-text-muted">
          {product.brand?.name ?? "Marka belirtilmedi"}
          {product.category && (
            <>
              <span aria-hidden="true"> · </span>
              {product.category.name}
            </>
          )}
        </p>

        <h3 className="text-body-lg font-semibold text-text">
          <Link
            href={`/urunler/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:text-link"
          >
            {product.name}
          </Link>
        </h3>

        {product.sku && (
          <p className="font-mono text-caption text-text-muted">
            <span className="sr-only">Ürün kodu: </span>
            {product.sku}
          </p>
        )}

        {/* mt-auto: kart yüksekliği ne olursa olsun fiyat ve durum alta hizalanır. */}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          <AvailabilityBadge status={product.availability} className="self-start" />
          <Price
            amount={product.priceMinor === null ? null : product.priceMinor / 100}
            compareAtAmount={
              product.compareAtPriceMinor === null ? null : product.compareAtPriceMinor / 100
            }
            currency={product.currency}
          />
        </div>
      </div>
    </Card>
  );
}
