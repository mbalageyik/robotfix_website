import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";
import { LoginForm } from "@/components/admin/LoginForm";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";

export const metadata: Metadata = {
  title: "Yönetici girişi",
  robots: ADMIN_ROBOTS,
};

// Oturum çerezine bakılır; statik üretilemez.
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ devam?: string }>;
}) {
  const { devam } = await searchParams;

  /*
    Açık yönlendirme (open redirect) koruması: `devam` yalnız kendi panelimizin
    içine, tek eğik çizgiyle başlayan bir yola işaret edebilir. `//baska.site`
    biçimi tarayıcıda protokol-göreli MUTLAK URL'dir; bu yüzden ayrıca elenir.
    Aynı kontrol sunucu tarafında `signInAction` içinde TEKRARLANIR — buradaki
    yalnız gizli alana yazılan değeri temizler.
  */
  const continueTo =
    devam && devam.startsWith("/admin") && !devam.startsWith("//") ? devam : undefined;

  return (
    <Container width="narrow" className="flex min-h-dvh flex-col justify-center py-12">
      <div className="mb-6">
        {/* `uppercase` yok: Türkçe büyütme marka adını yasak varyanta çevirir
            (gerekçe: components/admin/AdminShell.tsx). */}
        <p className="text-overline text-accent-tech">Robot Fix</p>
        <h1 className="mt-2 text-h2">Yönetim paneli</h1>
        <p className="mt-2 text-body text-text-muted">
          Devam etmek için yönetici hesabınızla giriş yapın.
        </p>
      </div>

      <Card>
        <LoginForm continueTo={continueTo} />
      </Card>
    </Container>
  );
}
