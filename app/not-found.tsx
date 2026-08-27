import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/*
  404 sayfası.

  Next.js `notFound()` çağrısında sayfaya zaten `noindex` enjekte eder; başlık
  yine de açıkça "bulunamadı" der ki paylaşılan bağlantı önizlemesi yanıltmasın.

  Metin bir VAAT İÇERMEZ ve var olmayan sayfalara (ör. hizmet detayları)
  bağlantı vermez — yalnız gerçekten mevcut olan iki yola yönlendirir.

  NEDEN KABUK BURADA ELLE ÇAĞRILIYOR. Diğer genel sayfalar kabuğu
  `app/(site)/layout.tsx` üzerinden alır. Bu dosya o grubun DIŞINDADIR ve
  olması gerekir: hiçbir rotayla eşleşmeyen bir adres KÖK düzende render
  edilir, grup düzeni ona uygulanmaz. Dosya `(site)` içine konduğunda 404
  gerçekten başlıksız/alt bilgisiz çıktı — ölçüldü. Bu yüzden kabuk burada
  açıkça eklenir; tek çoğaltma noktası budur ve sebebi budur.
*/

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="icerik" tabIndex={-1} className="flex flex-1 items-center">
        <Container width="narrow" className="flex flex-col gap-4 py-24">
          <p className="text-overline uppercase text-text-muted">404</p>
          <h1 className="text-h1">Aradığınız sayfa bulunamadı</h1>
          <p className="max-w-prose text-body-lg text-text-muted">
            Bağlantı değişmiş veya sayfa kaldırılmış olabilir. Ürün arıyorsanız katalogdan
            arayabilir, bulamazsanız bize doğrudan yazabilirsiniz.
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            <Link
              href="/urunler"
              className="text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
            >
              Ürünlere göz at
            </Link>
            <Link
              href="/"
              className="text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
            >
              Ana sayfaya dön
            </Link>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
