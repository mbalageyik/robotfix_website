import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { CATALOG_GRID_SIZES } from "@/lib/catalog/layout-modes";
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

/**
 * Kartın yerleşimi.
 *
 * `grid` dikey karttır (görsel üstte) ve VARSAYILANDIR — ana sayfa seçkisi ve
 * ilgili ürünler bu hâli kullanır. `list` yatay satırdır: görsel solda küçük
 * bir küçük resim, metin sağda. Yatay yerleşimde satır başına daha çok yer
 * kaldığı için kısa açıklama da gösterilir; ızgarada gösterilmez çünkü orada
 * kart yüksekliklerini birbirinden koparır.
 */
export type ProductCardLayout = "grid" | "list";

export interface ProductCardProps {
  product: ProductListItem;
  /**
   * İlk ekranda görünen kartlar için `true`. LCP görselinin lazy kalmaması
   * gerekir; geri kalan her kart tembel yüklenir (varsayılan).
   */
  priority?: boolean;
  layout?: ProductCardLayout;
  /**
   * `next/image` `sizes` değeri.
   *
   * NEDEN DIŞARIDAN VERİLEBİLİR: `sizes`, görselin GERÇEK render genişliğini
   * anlatır ve tarayıcı indireceği dosyayı buna bakarak seçer. Kart üç farklı
   * sütun düzeninde (liste / 2 sütun / 4 sütun) çok farklı genişliklerde
   * çizilir; tek bir sabit değer bu düzenlerin en az ikisinde yanlış olurdu —
   * ya gereğinden büyük dosya iner ya da görsel bulanık çıkar. Varsayılan,
   * sayfanın kendi 4 sütunlu ızgarasına göre ayarlıdır.
   */
  sizes?: string;
}

/*
  Varsayılan `sizes` katalog ızgarasınındır ve `lib/catalog/layout-modes.ts`
  içinde TEK KEZ tanımlıdır — görünüm değiştirici ile ürün detayındaki "İlgili
  ürünler" ızgarası aynı değeri kullanır, biri değişip diğeri eskide kalamaz.
*/

/*
  `w-full` ZORUNLU (aşağıdaki Card'da): kart, ızgara hücresi olan
  `<li className="flex">` içinde bir FLEX ÖĞESİDİR. Genişlik verilmezse flex
  öğesi içeriğine göre daralır ve aynı satırdaki kartlar farklı genişliklerde
  çıkar — adı uzun olan geniş, kısa olan dar görünür. `h-full` yüksekliği
  hizalar, genişliği hizalamaz.
*/
export function ProductCard({
  product,
  priority = false,
  layout = "grid",
  sizes = CATALOG_GRID_SIZES,
}: ProductCardProps) {
  const imageUrl = product.primaryImage ? productImageUrl(product.primaryImage.storagePath) : null;
  const isList = layout === "list";

  /*
    Alt metin: yönetici bir alt metin yazdıysa o kullanılır. Yazmadıysa ürün
    adına düşeriz — ürün görseli dekoratif değildir, alt metni boş bırakılamaz.
  */
  const altText = product.primaryImage?.altText?.trim() || product.name;

  return (
    <Card
      variant="interactive"
      padding="none"
      className={cn("relative flex h-full w-full", isList ? "flex-row items-stretch" : "flex-col")}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface-sunken",
          /*
            Listede küçük resim KARE DEĞİLDİR: kart bir flex satırıdır ve
            `items-stretch` görsel sütununu satır yüksekliğine uzatır —
            `aspect-square` yazılsaydı hiçbir etkisi olmazdı (yükseklik
            hizalamadan gelir), yalnız yanıltıcı ölü bir sınıf olurdu.
            Genişlik sabittir; `sizes` de bu sabit genişliği bildirir.
            `min-h` kısa kartlarda görselin ezilmesini engeller.
          */
          isList ? "min-h-28 w-28 shrink-0 rounded-l-lg sm:w-36" : "aspect-square rounded-t-lg",
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={altText}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center">
            <span className="text-caption text-text-disabled">
              {isList ? "Görsel yok" : "Ürün görseli henüz eklenmedi"}
            </span>
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

        {/*
          Kısa açıklama YALNIZ liste yerleşiminde. Izgarada satır başına yer
          dar olduğu için açıklama kartları farklı yüksekliklere iter ve
          hizalamayı bozar; listede zaten tam satır genişliği vardır.
        */}
        {isList && product.shortDescription && (
          <p className="line-clamp-2 text-caption text-text-muted">{product.shortDescription}</p>
        )}

        {/* mt-auto: kart yüksekliği ne olursa olsun fiyat ve durum alta hizalanır. */}
        <div
          className={cn(
            "mt-auto flex gap-2 pt-1",
            // Listede yatay yer bol: durum ve fiyat yan yana durur, satır
            // yüksekliği kısalır. Dar ekranda yine alt alta iner.
            isList ? "flex-col sm:flex-row sm:items-center sm:justify-between" : "flex-col",
          )}
        >
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
