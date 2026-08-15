import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { HomeSectionsForm, type HomeSectionRow } from "@/components/admin/HomeSectionsForm";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import { getAdminHomeSectionsConfig } from "@/lib/admin/queries";
import { HOMEPAGE_SECTION_META, resolveHomeSections } from "@/lib/home/section-registry";

/*
  ANA SAYFA BÖLÜMLERİ EKRANI (bilgi dosyası §17).

  NEDEN AYRI BİR SAYFA, SİTE AYARLARININ İÇİNDE DEĞİL: site ayarları formu tek
  bir `upsert` ile `SITE_SETTING_KEYS` listesindeki TÜM anahtarları yazar —
  boş bırakılan alan o anahtarı boşaltır. Bölüm yapılandırması bir metin alanı
  değil, satır satır bir listedir ve aynı forma konsaydı ya listeye dâhil
  edilmesi (ve her ayar kaydında sıfırlanma riski) ya da aynı form içinde iki
  ayrı yazma yolu gerekirdi. Ayrıca ekranların işleri farklıdır: biri işletme
  BİLGİSİNİ, diğeri sayfanın YAPISINI yönetir.

  Bu ekran içerik DÜZENLEMEZ. Metinler `lib/home/content.ts` ve veritabanında
  kalır; buradan yalnız hangi bölümün görüneceği ve onay bekleyen metinlerin
  yayımlanıp yayımlanmayacağı seçilir.
*/

export const metadata: Metadata = {
  title: "Ana sayfa bölümleri",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function AdminHomeSectionsPage() {
  const identity = await requireAdminPage();
  const config = await getAdminHomeSectionsConfig();

  if (!config.ok) {
    return (
      <AdminShell title="Ana sayfa bölümleri" adminEmail={identity.email}>
        <ErrorState
          title="Bölüm ayarları yüklenemedi"
          description="Veritabanı sorgusu başarısız oldu."
        />
      </AdminShell>
    );
  }

  /*
    Formun başlangıç değerleri BİRLEŞMİŞ değerlerdir: panelin gösterdiği şey,
    ziyaretçinin gördüğü şeyle aynı olmalıdır. Onay durumu seçicisinin
    gösterilip gösterilmeyeceği ise KOD VARSAYILANINA bakar (aşağıda).
  */
  const rows: HomeSectionRow[] = resolveHomeSections(HOMEPAGE_SECTION_META, config.data).map(
    (section, index) => ({
      id: section.id,
      label: section.label,
      enabled: section.enabled,
      contentStatus: section.contentStatus,
      locked: section.locked,
      order: index + 1,
      /*
        Onay durumu YALNIZ kod içi varsayılanı "draft" olan bölümlerde
        yönetilir: onay bekleyen metin yalnız onlarda vardır (servis süreci,
        SSS). Diğer bölümlerin içeriği ya veritabanından gelir ya da bilgi
        dosyasındaki doğrulanmış metindir; onları "taslak" yapabilmek
        anlamsız bir ikinci kapatma yolu olurdu.
      */
      statusManageable: HOMEPAGE_SECTION_META[index].contentStatus === "draft",
      isVisible: section.isVisible,
    }),
  );

  const hiddenCount = rows.filter((row) => !row.isVisible).length;

  return (
    <AdminShell
      title="Ana sayfa bölümleri"
      adminEmail={identity.email}
      description="Ana sayfadaki bölümlerin görünürlüğü. Sıra sabittir; içerik metinleri bu ekrandan düzenlenmez."
    >
      <p className="text-caption text-text-muted" role="status">
        {hiddenCount > 0
          ? `${hiddenCount} bölüm şu anda ana sayfada gösterilmiyor.`
          : "Tüm bölümler ana sayfada gösteriliyor."}{" "}
        Bir bölüm ancak açıksa ve içeriği onaylıysa görünür. Kapatılan bölüm sunucuda hiç üretilmez.
      </p>

      <HomeSectionsForm sections={rows} />
    </AdminShell>
  );
}
