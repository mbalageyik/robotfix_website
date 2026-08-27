/*
  ============================================================================
  JSON-LD'yi `<script>` GÖVDESİNE GÜVENLE YAZMA
  ============================================================================

  SORUN. `JSON.stringify` çıktısı geçerli JSON'dur ama geçerli bir HTML
  `<script>` GÖVDESİ DEĞİLDİR. HTML ayrıştırıcısı bir script bloğunun içinde
  JavaScript sözdizimine bakmaz; yalnız kapanış dizisini arar. Bu yüzden
  veri içindeki `</script` dizisi bloğu ERKEN KAPATIR ve ondan sonrası
  belgeye HTML olarak girer.

  Bu soyut bir risk değildi: JSON-LD'yi besleyen alanların çoğu yöneticinin
  panelden yazdığı serbest metindir (ürün adı, açıklama, adres, mağaza
  bağlantıları). Yani bu yol depolanmış XSS'e açıktı.

  ÜÇ SINIF KARAKTER KAÇIRILIR:

  1. `<` → `<`
     `</script>` dizisini kırar. `>` ve `&` ayrıca kaçırılır; tek başlarına
     zararsızdır ama `<` ile birlikte tutarlı bir kural oluştururlar ve
     `<!--` gibi yorum açıcı dizileri de etkisiz bırakırlar.

  2. U+2028 / U+2029 (satır ve paragraf ayırıcı)
     JSON'da geçerli, ama JavaScript kaynak metninde SATIR SONU sayılırlar.
     `JSON.stringify` onları kaçırmaz; kaçırılmazsa üretilen betik
     ayrıştırma hatası verir.

  NEDEN DIŞ BAĞIMLILIK YOK: kural üç satırlık bir `replace` zinciri.
  Bir paket eklemek burada denetlenecek yüzeyi büyütmekten başka bir şey
  yapmazdı.

  KULLANIM — `JSON.stringify` doğrudan `dangerouslySetInnerHTML`'e ASLA
  verilmez:

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(data)} />
*/

/** `<script>` gövdesinde güvenli hâle getirilmiş JSON metni. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

/**
 * `dangerouslySetInnerHTML` için hazır nesne.
 *
 * Ayrı bir yardımcı olmasının sebebi çağrı yerinde `JSON.stringify` yazma
 * ihtimalini ortadan kaldırmaktır: doğru kullanım en kısa kullanım olsun.
 */
export function jsonLdHtml(data: unknown): { __html: string } {
  return { __html: serializeJsonLd(data) };
}
