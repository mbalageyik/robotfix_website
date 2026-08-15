import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

/*
  404 sayfası.

  Next.js `notFound()` çağrısında sayfaya zaten `noindex` enjekte eder; başlık
  yine de açıkça "bulunamadı" der ki paylaşılan bağlantı önizlemesi yanıltmasın.

  Metin bir VAAT İÇERMEZ ve var olmayan sayfalara (ör. hizmet detayları)
  bağlantı vermez — yalnız gerçekten mevcut olan iki yola yönlendirir.
*/

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center">
      <Container width="narrow" className="flex flex-col gap-4 py-24">
        <p className="text-overline uppercase text-text-muted">404</p>
        <h1 className="text-h1">Aradığınız sayfa bulunamadı</h1>
        <p className="max-w-prose text-body-lg text-text-muted">
          Bağlantı değişmiş veya sayfa kaldırılmış olabilir. Ürün arıyorsanız katalogdan arayabilir,
          bulamazsanız bize doğrudan yazabilirsiniz.
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
  );
}
