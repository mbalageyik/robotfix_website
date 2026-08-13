import type { Metadata } from "next";
import Link from "next/link";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";

/*
  Yönetim paneli düzeni.

  BU BİR GÜVENLİK SINIRI DEĞİLDİR. Burada yetki kontrolü YAPILMAZ; sebep
  `lib/auth/dal.ts` başındaki notta: layout gezinmede yeniden çalışmaz ve alt
  segmentlerin render edilmesini engellemez. Her sayfa `requireAdminPage()`
  çağırır, her aksiyon `requireAdminAction()` çağırır.

  Düzenin görevi yalnız kabuk (başlık, gezinme) ve `noindex` meta'sıdır.
  Gezinme, oturumu olmayan birine gösterilse bile hiçbir veri sızdırmaz —
  yalnız bağlantı adlarıdır.
*/

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Robot Fix Yönetim" },
  robots: ADMIN_ROBOTS,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-sunken">
      <Link
        href="#admin-icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        İçeriğe geç
      </Link>
      <main id="admin-icerik">{children}</main>
    </div>
  );
}
