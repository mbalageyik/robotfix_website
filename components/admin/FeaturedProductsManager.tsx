import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AlertCircleIcon, CheckCircleIcon } from "@/components/ui/icons";
import { ActionButton, DisabledActionButton } from "@/components/admin/ActionButton";
import { DemoBadge, StatusBadge } from "@/components/admin/StatusBadge";
import {
  moveFeaturedProductAction,
  setProductFeaturedAction,
} from "@/lib/admin/featured-actions";
import { publicImageUrl } from "@/lib/admin/storage";
import type { AdminFeaturedProductRow } from "@/lib/admin/queries";

/*
  Robot Fix Seçkisi yöneticisi.

  Sunucu bileşenidir: liste, sıra ve görünürlük hesabı sunucuda yapılır; yalnız
  tek tek eylem butonları istemciye iner (`ActionButton`).

  ADLANDIRMA: ekranda geçen ad, ana sayfada BASILAN adla aynıdır — "Robot Fix
  Seçkisi". Alanın panelde "Öne çıkan ürün" diye anılıp sitede "Seçki" diye
  görünmesi, yöneticinin alanı bulamamasının sebeplerinden biriydi.

  SIRALAMA: `ImageManager`'daki ↑/↓ deseni. Sürükle-bırak yoktur; klavye ve
  dokunmatik desteği gerektiren, kırılgan bir etkileşimdir.
*/

/**
 * Bir satırın ana sayfada GERÇEKTEN görünüp görünmeyeceği.
 *
 * Seçkide işaretli olmak yetmez. İki bağımsız engel daha vardır ve ikisi de
 * yöneticiye görünmez şekilde çalışır:
 *   - `status !== "active"` → RLS satırı genel (anon) sorgudan eler.
 *   - `is_demo` + demo kapalı → `listProducts` satırı eler.
 * Ekran bu sessiz elemeleri satır satır söyler; aksi hâlde yönetici işaretini
 * koyar, siteye bakar, hiçbir şey görmez ve nedenini bilemez.
 */
function visibilityBlocker(
  row: AdminFeaturedProductRow,
  showDemoContent: boolean,
): string | null {
  if (row.status !== "active") {
    return "Yayında değil — seçkide işaretli olsa bile ana sayfada görünmez. Görünmesi için ürünü yayımlayın.";
  }
  if (row.isDemo && !showDemoContent) {
    return "Örnek (demo) kayıt — seçkide işaretli olsa bile sitede gösterilmez.";
  }
  return null;
}

function Thumbnail({
  row,
  supabaseUrl,
}: {
  row: AdminFeaturedProductRow;
  supabaseUrl: string | null;
}) {
  if (!row.primaryImage || !supabaseUrl) {
    return (
      <div className="flex size-20 shrink-0 items-center justify-center rounded-md border border-border text-center text-caption text-text-muted">
        Görsel yok
      </div>
    );
  }

  return (
    <Image
      src={publicImageUrl(supabaseUrl, row.primaryImage.storagePath)}
      alt={row.primaryImage.altText || `${row.name} ürününün görseli`}
      width={80}
      height={80}
      className="size-20 shrink-0 rounded-md border border-border object-cover"
    />
  );
}

export function FeaturedProductsManager({
  rows,
  supabaseUrl,
  showDemoContent,
}: {
  rows: AdminFeaturedProductRow[];
  /** Sunucudan geçirilir; istemci ayrıca env okumak zorunda kalmasın. */
  supabaseUrl: string | null;
  showDemoContent: boolean;
}) {
  const blocked = rows.filter((row) => visibilityBlocker(row, showDemoContent) !== null);
  const visibleCount = rows.length - blocked.length;

  if (rows.length === 0) {
    return (
      <Card>
        <h2 className="text-h4">Seçki şu an boş</h2>
        <p className="mt-2 max-w-prose text-body text-text-muted">
          Ana sayfadaki Robot Fix Seçkisi bölümünde hiçbir ürün gösterilmiyor. Aşağıdaki
          &laquo;Seçkiye ürün ekle&raquo; bölümünden ürün seçin. Bölüm, hiç ürün yokken sahte
          kart göstermez; ziyaretçiye kataloğa giden bir çıkış sunar.
        </p>
      </Card>
    );
  }

  return (
    <section aria-labelledby="secki-liste-baslik" className="flex flex-col gap-3">
      <h2 id="secki-liste-baslik" className="text-h4">
        Seçkideki ürünler ({rows.length})
      </h2>

      <p className="text-caption text-text-muted" role="status">
        {visibleCount === rows.length
          ? `${rows.length} ürünün tamamı ana sayfada görünüyor.`
          : `${rows.length} üründen ${visibleCount} tanesi ana sayfada görünüyor; ${blocked.length} tanesi aşağıda işaretlendiği gibi görünmüyor.`}{" "}
        Ana sayfa en fazla 8 ürün gösterir.
      </p>

      {/*
        PAYLAŞILAN ALAN UYARISI. `display_order` hem seçki sırasını hem
        katalogdaki elle sıralamayı belirler. Bunu söylememek, yöneticinin
        "neden ürün listesinin sırası değişti?" diye aramasına yol açardı.
      */}
      <p className="text-caption text-text-muted">
        Sıra numarası ürünün genel <strong className="font-semibold text-text">Sıra</strong>{" "}
        alanıdır. Buradan değiştirmek ürünün katalog listesindeki sırasını da etkiler — ikisi
        aynı veridir.
      </p>

      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const blocker = visibilityBlocker(row, showDemoContent);

          return (
            <li key={row.id}>
              <Card padding="sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <Thumbnail row={row} supabaseUrl={supabaseUrl} />

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-body-lg font-semibold">
                          <Link
                            href={`/admin/urunler/${row.id}`}
                            className="rounded-sm hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            {row.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-caption text-text-muted">
                          <code>{row.slug}</code> · Sıra: {row.displayOrder}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-caption text-text-muted">
                          Seçkide {index + 1}. sırada
                        </span>
                        {row.isDemo && <DemoBadge />}
                        <StatusBadge status={row.status} />
                      </div>
                    </div>

                    {/*
                      Durum YALNIZ RENKLE anlatılmaz (bilgi dosyası §15):
                      görünmeyen satırda açık bir cümle, görünende de açık bir
                      cümle vardır.
                    */}
                    {blocker ? (
                      <p className="flex items-start gap-1.5 rounded-md border border-warning/35 bg-warning/10 p-3 text-caption font-medium text-warning">
                        <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                        <span>
                          <span className="sr-only">Uyarı: </span>
                          {blocker}
                        </span>
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-caption text-success">
                        <CheckCircleIcon className="size-4 shrink-0" />
                        Ana sayfadaki seçkide görünüyor.
                      </p>
                    )}

                    <div className="flex flex-wrap items-start gap-2">
                      {index === 0 ? (
                        <DisabledActionButton label="↑ Yukarı" ariaLabel="Zaten en üstte" />
                      ) : (
                        <ActionButton
                          action={moveFeaturedProductAction}
                          fields={{ productId: row.id, direction: "up" }}
                          label="↑ Yukarı"
                          ariaLabel={`${row.name} ürününü seçkide yukarı taşı`}
                        />
                      )}

                      {index === rows.length - 1 ? (
                        <DisabledActionButton label="↓ Aşağı" ariaLabel="Zaten en altta" />
                      ) : (
                        <ActionButton
                          action={moveFeaturedProductAction}
                          fields={{ productId: row.id, direction: "down" }}
                          label="↓ Aşağı"
                          ariaLabel={`${row.name} ürününü seçkide aşağı taşı`}
                        />
                      )}

                      {/*
                        Çıkarmak yalnız `is_featured` bayrağını düşürür; ürün
                        silinmez, arşivlenmez, sırası bozulmaz. Geri almak tek
                        tıktır, bu yüzden onay adımı yoktur.
                      */}
                      <ActionButton
                        action={setProductFeaturedAction}
                        fields={{ productId: row.id, featured: "false" }}
                        label="Seçkiden çıkar"
                        ariaLabel={`${row.name} ürününü Robot Fix Seçkisi'nden çıkar`}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
