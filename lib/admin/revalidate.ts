import { revalidatePath } from "next/cache";

/*
  ============================================================================
  ÜRÜN DEĞİŞİKLİĞİNDEN ETKİLENEN GENEL YÜZEYLER — tek yerde.
  ============================================================================

  NEDEN AYRI DOSYA: bu liste üç ayrı aksiyonda (kaydet, çoğalt, durum
  değiştir) tekrar ediyordu ve tekrar ederken EKSİK kaldı — üçünün hiçbiri
  `/urunler` ile ürün detayını tazelemiyordu. Liste tek yerde durursa bir
  sonraki aksiyon onu unutmaz.

  HANGİ YÜZEY GERÇEKTEN BAYATLIYOR — ÖLÇÜLDÜ, VARSAYILMADI.

  Bir kod incelemesi "arşivlenen ürün beş dakikaya kadar katalogda yayında
  kalıyor" demişti. Üretim derlemesinde ölçüldüğünde bu DOĞRU ÇIKMADI:

    | Yüzey                 | Tür                  | Ham DB değişikliğini yansıtma |
    | --------------------- | -------------------- | ----------------------------- |
    | `/urunler`            | dinamik (ƒ)          | ANINDA                        |
    | `/urunler/[slug]`     | dinamik (ƒ)          | ANINDA (arşivlenince 404)     |
    | `/`                   | statik, 5 dk         | tazelenmezse 5 dakikaya kadar |
    | `/sitemap.xml`        | statik, 1 saat       | tazelenmezse 1 saate kadar    |

  Yani asıl kusur katalogda değildi: `setProductStatusAction` (arşivle /
  yayımla) genel yüzeylerin HİÇBİRİNİ tazelemiyordu. Bir ürün arşivlendiğinde
  ana sayfadaki "Robot Fix Seçkisi" onu beş dakika daha gösterebiliyor,
  sitemap ise bir saat boyunca arama motoruna var olmayan bir sayfayı
  bildirmeye devam ediyordu.

  Dinamik iki yol da listede tutuluyor: bugün gereksizler ama ücretsizler ve
  o rotalar yarın `revalidate` kazanırsa liste kendiliğinden doğru kalır.

  `revalidateTag` KULLANILMADI: veri katmanı `fetch` üzerinden gitmiyor
  (Supabase istemcisi), dolayısıyla etiket tabanlı geçersizleştirmenin
  tutunacağı bir yer yok. Yol tabanlı tazeleme bu mimaride doğru araçtır.
*/

/**
 * Bir ürün değiştiğinde tazelenmesi gereken genel yollar.
 *
 * @param slug Ürünün adresi. Biliniyorsa detay sayfası da tazelenir;
 *   bilinmiyorsa yalnız liste ve ana sayfa tazelenir — yanlış bir yolu
 *   tazelemektense atlamak doğrudur.
 */
export function revalidateProductSurfaces(slug?: string | null): void {
  // Katalog listesi: ürünün kendisi, sırası ve filtre sayıları burada.
  revalidatePath("/urunler");

  if (slug) {
    revalidatePath(`/urunler/${slug}`);
  }

  /*
    Ana sayfa: "Robot Fix Seçkisi" bölümü öne çıkan ürünleri okur. Ürünün
    yayın durumu değiştiyse seçkiden düşmesi ya da girmesi gerekir.
  */
  revalidatePath("/");

  // Sitemap yalnız yayındaki ve demo olmayan ürünleri listeler.
  revalidatePath("/sitemap.xml");
}
