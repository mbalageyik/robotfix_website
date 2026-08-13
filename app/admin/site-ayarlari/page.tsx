import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  SiteSettingsForm,
  type SiteSettingsValues,
} from "@/components/admin/SiteSettingsForm";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import { getAdminSiteSettings } from "@/lib/admin/queries";
import { SITE_SETTING_KEYS } from "@/lib/data/site-settings";

export const metadata: Metadata = {
  title: "Site ayarları",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function AdminSiteSettingsPage() {
  const identity = await requireAdminPage();
  const settings = await getAdminSiteSettings();

  if (!settings.ok) {
    return (
      <AdminShell title="Site ayarları" adminEmail={identity.email}>
        <ErrorState
          title="Ayarlar yüklenemedi"
          description="Veritabanı sorgusu başarısız oldu."
        />
      </AdminShell>
    );
  }

  /*
    Her bilinen anahtar için bir dize garanti edilir. Tabloda satırı olmayan
    anahtar "" olur — form `defaultValue={undefined}` alıp kontrolsüz/kontrollü
    uyarısı üretmez ve panel tohumlanmış bir veritabanına bağımlı kalmaz.
  */
  const values = Object.fromEntries(
    SITE_SETTING_KEYS.map((key) => [key, settings.data[key] ?? ""]),
  ) as SiteSettingsValues;

  const emptyCount = SITE_SETTING_KEYS.filter((key) => !values[key]).length;

  return (
    <AdminShell
      title="Site ayarları"
      adminEmail={identity.email}
      description="WhatsApp numarası, iletişim bilgileri ve pazaryeri mağaza bağlantıları. Bu değerler sitenin her yerinde kullanılır."
    >
      {emptyCount > 0 && (
        <p className="text-caption text-text-muted" role="status">
          {emptyCount} ayar henüz doldurulmadı. Boş bırakılan bilgi sitede hiç gösterilmez —
          doğrulanmamış bir değer yazmak yerine boş bırakmak doğru olandır.
        </p>
      )}

      <SiteSettingsForm values={values} />
    </AdminShell>
  );
}
