import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { AlertCircleIcon, CheckCircleIcon } from "@/components/ui/icons";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import { getDashboardCounts } from "@/lib/admin/queries";
import type { PublicationStatus } from "@/lib/data/types";

export const metadata: Metadata = {
  title: "Panel",
  robots: ADMIN_ROBOTS,
};

// Oturum çerezi okunur; statik üretilemez.
export const dynamic = "force-dynamic";

const STATUS_ORDER: readonly PublicationStatus[] = ["active", "draft", "passive", "archived"];

export default async function AdminDashboardPage() {
  // SAYFA KENDİ yetkisini doğrular — layout'a güvenilmez (bkz. lib/auth/dal.ts).
  const identity = await requireAdminPage();
  const counts = await getDashboardCounts();

  if (!counts.ok) {
    return (
      <AdminShell
        title="Panel"
        adminEmail={identity.email}
        description="Katalog özeti ve dikkat gerektiren kayıtlar."
      >
        <ErrorState
          title="Özet yüklenemedi"
          description="Veritabanı sorgusu başarısız oldu. Yerel Supabase yığınının çalıştığından emin olun."
        />
      </AdminShell>
    );
  }

  const data = counts.data;
  const totalProducts = STATUS_ORDER.reduce((sum, status) => sum + data.products[status], 0);

  return (
    <AdminShell
      title="Panel"
      adminEmail={identity.email}
      description="Katalog özeti ve dikkat gerektiren kayıtlar. Sayılar doğrudan veritabanından gelir."
    >
      {/* ---- Dikkat gerektirenler ------------------------------------- */}
      <section aria-labelledby="uyarilar-baslik" className="flex flex-col gap-3">
        <h2 id="uyarilar-baslik" className="text-h4">
          Dikkat gerektirenler
        </h2>

        {data.warnings.length === 0 ? (
          <Card>
            <p className="flex items-center gap-2 text-body text-text">
              <CheckCircleIcon className="size-5 shrink-0 text-success" />
              Bekleyen bir uyarı yok.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.warnings.map((warning) => (
              <li key={warning.label}>
                <Card padding="sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-body text-text">
                      <AlertCircleIcon className="size-5 shrink-0 text-warning" />
                      <span>
                        <strong className="font-bold">{warning.count}</strong> {warning.label}
                      </span>
                    </p>
                    <ButtonLink href={warning.href} variant="secondary" size="sm">
                      İncele
                    </ButtonLink>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Ürün durumları ------------------------------------------- */}
      <section aria-labelledby="urunler-baslik" className="flex flex-col gap-3">
        <h2 id="urunler-baslik" className="text-h4">
          Ürünler ({totalProducts})
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <Card key={status} padding="sm">
              <Link
                href={`/admin/urunler?durum=${status}`}
                className="flex flex-col gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <StatusBadge status={status} className="self-start" />
                <span className="text-h3 tabular-nums">{data.products[status]}</span>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* ---- Diğer kayıtlar ------------------------------------------- */}
      <section aria-labelledby="taksonomi-baslik" className="flex flex-col gap-3">
        <h2 id="taksonomi-baslik" className="text-h4">
          Diğer kayıtlar
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Marka", count: data.brands, href: "/admin/markalar" },
            { label: "Kategori", count: data.categories, href: "/admin/kategoriler" },
            { label: "Cihaz modeli", count: data.deviceModels, href: "/admin/cihaz-modelleri" },
            { label: "Hizmet", count: data.services, href: "/admin/hizmetler" },
          ].map((entry) => (
            <Card key={entry.href} padding="sm">
              <Link
                href={entry.href}
                className="flex flex-col gap-1 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="text-caption font-semibold text-text-muted">{entry.label}</span>
                <span className="text-h3 tabular-nums">{entry.count}</span>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/*
        DOĞRULUK NOTU (bilgi dosyası §20): panelde uydurulmuş hiçbir istatistik
        gösterilmez. Yukarıdaki her sayı canlı bir sorgudan gelir; "toplam
        satış", "memnuniyet oranı" gibi doğrulanmamış metrikler burada YOKTUR.
      */}
      <p className="text-caption text-text-muted">
        Tüm sayılar canlı sorgudan gelir. Örnek veriler (<code>[ÖRNEK]</code> önekli) taslak
        durumda tutulur ve siteye çıkmaz.
      </p>
    </AdminShell>
  );
}
