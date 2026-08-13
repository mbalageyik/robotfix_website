import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionButton } from "@/components/admin/ActionButton";
import { DemoBadge, StatusBadge } from "@/components/admin/StatusBadge";
import { setTaxonomyStatusAction } from "@/lib/admin/taxonomy-actions";
import type { PublicationStatus } from "@/lib/data/types";

/*
  Marka / Kategori / Cihaz modeli / Hizmet listelerinin ortak gövdesi.

  Dört ekran da aynı şeyi yapar: kayıtları listele, satır içinde düzenlet,
  durumunu değiştirt. Tek fark her satırın düzenleme formu ve alt bilgisidir;
  ikisi de prop olarak geçilir.

  DÜZENLEME SATIR İÇİNDEDİR (`<details>`): ayrı bir düzenleme rotası, dört
  ekran için sekiz rota daha demekti ve bu kayıtlar 5-6 alanlık küçük
  kayıtlar. Açılır düzenleme saf HTML'dir; JS olmadan da açılır.
*/

export interface TaxonomyRecord {
  id: string;
  name: string;
  slug: string;
  status: PublicationStatus;
  isDemo?: boolean;
  /** Satırın altındaki gri bilgi satırı (marka adı, üst kategori vb.). */
  meta?: ReactNode;
  /** Bağlı kayıt uyarısı — arşivlemeden ÖNCE görünür. */
  dependencyNote?: string;
  /** Bu kayda ait düzenleme formu. */
  editForm: ReactNode;
}

/** Mevcut duruma göre teklif edilen geçişler (ürün sayfasıyla aynı mantık). */
const TRANSITIONS: Record<PublicationStatus, { status: PublicationStatus; label: string }[]> = {
  draft: [{ status: "active", label: "Yayımla" }],
  active: [
    { status: "passive", label: "Yayından kaldır" },
    { status: "draft", label: "Taslağa al" },
  ],
  passive: [
    { status: "active", label: "Yeniden yayımla" },
    { status: "draft", label: "Taslağa al" },
  ],
  archived: [{ status: "draft", label: "Arşivden çıkar" }],
};

export function TaxonomyList({
  table,
  records,
  emptyTitle,
  emptyDescription,
  itemNoun,
}: {
  table: "brands" | "categories" | "device_models" | "services";
  records: TaxonomyRecord[];
  emptyTitle: string;
  emptyDescription: string;
  /** "marka", "kategori" — onay metinlerinde kullanılır. */
  itemNoun: string;
}) {
  if (records.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {records.map((record) => (
        <li key={record.id}>
          <Card padding="sm">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-body-lg font-semibold">{record.name}</h3>
                  <p className="mt-1 text-caption text-text-muted">
                    <code>{record.slug}</code>
                    {record.meta && <> · {record.meta}</>}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {record.isDemo && <DemoBadge />}
                  <StatusBadge status={record.status} />
                </div>
              </div>

              {/*
                BAĞLI KAYIT UYARISI. Arşivleme yetim kayıt bırakmaz — bağlı
                ürünler silinmez — ama yönetici neyin etkileneceğini önceden
                bilmelidir.
              */}
              {record.dependencyNote && (
                <p className="text-caption text-text-muted">{record.dependencyNote}</p>
              )}

              <div className="flex flex-wrap items-start gap-2">
                {TRANSITIONS[record.status].map((transition) => (
                  <ActionButton
                    key={transition.status}
                    action={setTaxonomyStatusAction}
                    fields={{ table, id: record.id, status: transition.status }}
                    label={transition.label}
                    ariaLabel={`${record.name}: ${transition.label}`}
                  />
                ))}

                {record.status !== "archived" && (
                  <ActionButton
                    action={setTaxonomyStatusAction}
                    fields={{ table, id: record.id, status: "archived" }}
                    label="Arşivle"
                    ariaLabel={`${record.name} kaydını arşivle`}
                    confirm={{
                      question: record.dependencyNote
                        ? `${record.dependencyNote} Kayıt arşivlenecek, bağlı kayıtlar SİLİNMEYECEK.`
                        : `Bu ${itemNoun} arşivlenecek ve siteden kaldırılacak. Kayıt silinmez.`,
                      confirmLabel: "Evet, arşivle",
                    }}
                  />
                )}
              </div>

              <details className="group">
                <summary className="inline-flex cursor-pointer list-none items-center rounded-md py-1 text-caption font-semibold text-link underline underline-offset-4 hover:text-link-hover">
                  Düzenle
                </summary>
                <div className="mt-3 border-t border-border pt-4">{record.editForm}</div>
              </details>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/** Yeni kayıt formunu saran açılır blok — liste ekranlarının üst kısmı. */
export function NewRecordDisclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <details>
        <summary className="inline-flex cursor-pointer list-none items-center rounded-md py-1 text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover">
          {label}
        </summary>
        <div className="mt-4 border-t border-border pt-4">{children}</div>
      </details>
    </Card>
  );
}
