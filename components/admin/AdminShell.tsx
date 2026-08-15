import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/lib/auth/actions";

/*
  Yetkili panel sayfalarının ortak kabuğu.

  Sayfa yetkisini KENDİ doğrular (`requireAdminPage()`) ve doğrulanmış kimliği
  buraya prop olarak geçer. Kabuk yetki kontrolü YAPMAZ — yaptığını sanmak,
  kontrolü unutulmuş bir sayfanın fark edilmemesine yol açardı.
*/

export interface AdminShellProps {
  title: string;
  description?: string;
  /** Başlığın yanındaki birincil eylemler (ör. "Yeni ürün"). */
  actions?: ReactNode;
  /** Doğrulanmış yöneticinin e-postası — yalnız gösterim. */
  adminEmail: string;
  children: ReactNode;
}

export function AdminShell({ title, description, actions, adminEmail, children }: AdminShellProps) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <Container width="wide" className="flex flex-col gap-3 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/*
              `uppercase` KULLANILMAZ — marka adı burada geçiyor.
              Belge `lang="tr"` olduğu için tarayıcı Türkçe büyütme uygular ve
              "Fix"in "i"si noktalı büyük harfe döner; ekranda CLAUDE.md'nin
              yasakladığı varyant belirir. Kaynak metin doğru yazıldığı için
              düz bir yazım denetimi bunu YAKALAMAZ.
              Aynı tuzak ana sayfada da çıkmıştı; çözüm orada da budur.
              Bekçi: `__tests__/home-content.test.ts` → "üst etiketlerde marka adı".
            */}
            <p className="text-overline text-accent-tech">Robot Fix · Yönetim</p>
            <form action={signOutAction} className="flex items-center gap-3">
              <span className="text-caption text-text-muted">{adminEmail}</span>
              <Button type="submit" variant="ghost" size="sm">
                Çıkış yap
              </Button>
            </form>
          </div>
          <AdminNav />
        </Container>
      </header>

      <Container width="wide" className="flex flex-col gap-5 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-h2">{title}</h1>
            {description && (
              <p className="mt-1 max-w-prose text-body text-text-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        {children}
      </Container>
    </>
  );
}
