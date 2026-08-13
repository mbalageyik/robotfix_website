import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { getAuthUser, getIsAdmin } from "@/lib/auth/dal";
import { signOutAction } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Yetkiniz yok",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

/*
  403 durumu — AÇIKÇA gösterilir.

  Gereksinim: "Admin olmayan kimliği doğrulanmış kullanıcı /admin altına girmeye
  çalışırsa 403 benzeri bir durum göstersin, sessizce yönlendirip hatayı
  gizleme." Bu sayfa tam olarak bunu yapar: ne olduğunu, neden olduğunu ve ne
  yapabileceğini söyler.

  Bu sayfa yönetici yetkisi İSTEMEZ (aksi hâlde döngüye girerdi) ama oturum
  ister — oturumsuz biri buraya gelirse giriş sayfasına gönderilir.
*/
export default async function ForbiddenPage() {
  const user = await getAuthUser();
  if (!user) redirect("/admin/giris");

  // Bu arada yetki verilmişse kullanıcıyı burada tutmanın anlamı yok.
  if (await getIsAdmin()) redirect("/admin");

  return (
    <Container width="narrow" className="flex min-h-dvh flex-col justify-center py-12">
      <Card>
        <ErrorState
          title="403 — Bu alana erişim yetkiniz yok"
          description={
            `${user.email ?? "Hesabınız"} ile giriş yaptınız, ancak bu hesap yönetici ` +
            "listesinde değil. Yönetim paneli yalnız yetkili hesaplara açıktır."
          }
        />

        <div className="mt-5 flex flex-col gap-3">
          <p className="text-caption text-text-muted">
            Bunun bir hata olduğunu düşünüyorsanız site sorumlusuyla iletişime geçin.
            Yetki, veritabanındaki yönetici listesinden verilir; panelden talep edilemez.
          </p>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              Çıkış yap ve başka hesapla dene
            </Button>
          </form>
        </div>
      </Card>
    </Container>
  );
}
