import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { ActionButton, DisabledActionButton } from "@/components/admin/ActionButton";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import { CheckCircleIcon } from "@/components/ui/icons";
import {
  deleteImageAction,
  moveImageAction,
  setPrimaryImageAction,
} from "@/lib/admin/image-actions";
import { publicImageUrl } from "@/lib/admin/storage";

/*
  Ürün görselleri yöneticisi.

  Sunucu bileşenidir: liste ve URL üretimi sunucuda yapılır, yalnız tek tek
  eylem butonları ve yükleme formu istemciye iner.

  ANA GÖRSEL kavramı şemada `is_primary` ile temsil edilir ve ürün başına en
  fazla bir satır taşıyabilir (`product_images_one_primary_idx`). Arayüz bunu
  bir liste içinde "ana görsel yap" eylemiyle anlatır — sürükle-bırak yoktur,
  çünkü klavye ve dokunmatik desteği gerektiren, kırılgan bir etkileşimdir.
*/

export interface ManagedImage {
  id: string;
  storagePath: string;
  altText: string;
  isPrimary: boolean;
  displayOrder: number;
}

export function ImageManager({
  productId,
  images,
  supabaseUrl,
}: {
  productId: string;
  images: ManagedImage[];
  /** Sunucudan geçirilir; istemci ayrıca env okumak zorunda kalmasın. */
  supabaseUrl: string | null;
}) {
  const ordered = [...images].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h3 className="text-h4">Görsel ekle</h3>
        <p className="mt-1 mb-4 text-caption text-text-muted">
          İlk yüklenen görsel otomatik olarak ana görsel olur.
        </p>
        <ImageUploadForm productId={productId} />
      </Card>

      {ordered.length === 0 ? (
        <p className="text-caption text-text-muted">
          Bu üründe henüz görsel yok. Görseli olmayan ürün katalogda yer tutucu ile gösterilir.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((image, index) => (
            <li key={image.id}>
              <Card padding="sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {supabaseUrl ? (
                    <Image
                      src={publicImageUrl(supabaseUrl, image.storagePath)}
                      alt={image.altText || "Alternatif metni girilmemiş ürün görseli"}
                      width={120}
                      height={120}
                      className="size-30 shrink-0 rounded-md border border-border object-cover"
                    />
                  ) : (
                    <div className="flex size-30 shrink-0 items-center justify-center rounded-md border border-border text-caption text-text-muted">
                      Önizleme yok
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {image.isPrimary && (
                        <span className="inline-flex items-center gap-1.5 rounded-sm border border-success/35 bg-success/10 px-2 py-1 text-caption font-semibold text-success">
                          <CheckCircleIcon className="size-4 shrink-0" />
                          Ana görsel
                        </span>
                      )}
                      <span className="text-caption text-text-muted">Sıra {index + 1}</span>
                    </div>

                    <p className="text-caption text-text-muted">
                      {image.altText ? (
                        <>Alternatif metin: {image.altText}</>
                      ) : (
                        <>Alternatif metin girilmemiş (dekoratif sayılır).</>
                      )}
                    </p>

                    <div className="flex flex-wrap items-start gap-2">
                      {image.isPrimary ? (
                        <DisabledActionButton
                          label="Ana görsel"
                          ariaLabel="Bu zaten ana görsel"
                        />
                      ) : (
                        <ActionButton
                          action={setPrimaryImageAction}
                          fields={{ imageId: image.id, productId }}
                          label="Ana görsel yap"
                          ariaLabel={`${index + 1}. görseli ana görsel yap`}
                        />
                      )}

                      {index === 0 ? (
                        <DisabledActionButton label="↑ Yukarı" ariaLabel="Zaten en üstte" />
                      ) : (
                        <ActionButton
                          action={moveImageAction}
                          fields={{ imageId: image.id, productId, direction: "up" }}
                          label="↑ Yukarı"
                          ariaLabel={`${index + 1}. görseli yukarı taşı`}
                        />
                      )}

                      {index === ordered.length - 1 ? (
                        <DisabledActionButton label="↓ Aşağı" ariaLabel="Zaten en altta" />
                      ) : (
                        <ActionButton
                          action={moveImageAction}
                          fields={{ imageId: image.id, productId, direction: "down" }}
                          label="↓ Aşağı"
                          ariaLabel={`${index + 1}. görseli aşağı taşı`}
                        />
                      )}

                      {/*
                        Görsel KALICI olarak silinir (gerekçe: image-actions.ts).
                        Bu yüzden tek tıkla değil, iki adımda yapılır.
                      */}
                      <ActionButton
                        action={deleteImageAction}
                        fields={{ imageId: image.id, productId }}
                        label="Sil"
                        ariaLabel={`${index + 1}. görseli sil`}
                        confirm={{
                          question:
                            "Bu görsel kalıcı olarak silinecek; dosya da kovadan kaldırılır. Bu işlem geri alınamaz.",
                          confirmLabel: "Evet, görseli sil",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
