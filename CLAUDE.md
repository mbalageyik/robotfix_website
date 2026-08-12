@AGENTS.md

# Robot Fix — proje kuralları

## Birincil bağlam kaynağı

`ROBOT_FIX_PROJE_BILGI_DOSYASI.md` (proje kökünde) marka, iş modeli, içerik, renk paleti
ve doğruluk sınırlarının tek kaynağıdır. Kullanıcının açık talebi bu dosyadan önceliklidir.

Yol haritası: `~/.claude/plans/rol-robot-fix-web-quizzical-pumpkin.md`

## Marka yazımı (ihlal edilemez)

Marka adı **her zaman iki kelimedir: "Robot Fix"**. Bu kural gövde metni, başlık, `<title>`,
meta açıklama, Open Graph, structured data (JSON-LD) ve görsel `alt` metinleri dâhil
**tüm metinsel yüzeylerde** geçerlidir.

Bitişik **"RobotFix" yalnızca logo varlığında** (SVG/görsel dosyanın kendi çizimi içinde)
serbesttir — orada yazım değil bir grafiktir. Logonun `alt` metni yine "Robot Fix" olur.

Yasak varyantlar: `RobotFix`, `Robotfix`, `ROBOT FİX`, `Robot-Fix`, `RoboFix`.

## Doğruluk kuralı (ihlal edilemez)

Bilgi dosyası §20'de listelenen bilgiler **uydurulamaz**: ürün listesi, fiyat, stok,
uyumluluk, garanti, teslimat, servis ücreti, satış adedi, müşteri yorumu, memnuniyet
oranı, yetkili servis statüsü, marka ortaklığı, sertifika, pazaryeri bağlantısı,
iade/kargo koşulları.

- Doğrulanmamış her nokta koda `// TODO(business):` olarak işaretlenir.
- Doğrulanmamış istatistik (500+ tamir, %95 memnuniyet, 1 gün teslimat) **kullanılmaz**.
- Tasarım için gereken örnek içerik açıkça `[ÖRNEK]` diye işaretlenir.

## Demo ürün politikası

Demo ürünler `status = 'draft'` **ve** `is_demo = true` ile tohumlanır, adları `[ÖRNEK]`
önekli olur, fiyatları boştur ("Fiyat için iletişime geçin"), üretim sorgularının ve
sitemap'in dışındadır. `NEXT_PUBLIC_SHOW_DEMO_PRODUCTS` ile kontrol edilir.

## Mimari kararlar

| Konu             | Karar                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| Framework        | Next.js 16 App Router + React 19 + TypeScript (strict)                       |
| Stil             | Tailwind v4, tokenlar `app/globals.css` `@theme` içinde                      |
| Veri             | Supabase Postgres + **elle yazılan SQL migrasyonları** (ORM yok)             |
| Görsel           | Supabase Storage + `next/image`                                              |
| Auth             | Supabase Auth (tek yönetici); kendi parola/oturum kodumuz yazılmaz           |
| Panel            | Özel `/admin`; toplu CSV içe aktarma yok, ürün formu + kopyalayarak çoğaltma |
| 3D               | Kalıcı Canvas + drei `View`, `next/dynamic` + `ssr:false`                    |
| Deploy           | Vercel                                                                       |
| Paket yöneticisi | npm                                                                          |

## Bulunabilirlik durumları

Şemadaki `availability_status` enum'unun **tek** Türkçe karşılığı vardır. Arayüzde
başka bir sözcük kullanılmaz; yeni bir eşanlamlı uydurulmaz.

| Enum değeri    | Arayüz metni    |
| -------------- | --------------- |
| `in_stock`     | Stokta          |
| `limited`      | Sınırlı stok    |
| `on_order`     | Siparişle       |
| `out_of_stock` | Tükendi         |

`on_order` şemada **kalır** — "siparişle temin edilir" gerçek bir satış durumudur ve
"tükendi" ile aynı şey değildir. Bu ayrım silinmez.

Durum **yalnız renkle** anlatılamaz (aşağıdaki kurala bakınız): `AvailabilityBadge`
metni her zaman gösterir, yalnız-simge modu sunmaz.

## İhlal edilemez teknik kurallar

- **Canvas'ta metin yok.** Tüm metin DOM'da olur. 3D yüklenmese de ürün, hizmet ve
  iletişim bilgisi erişilebilir kalır (bilgi dosyası §14).
- **Her admin server action kendi yetki kontrolünü yapar.** Sayfa/middleware korumasına
  güvenilmez.
- **WhatsApp numarası ve mesaj şablonları tek yerde** (`site_settings` tablosu). Kod
  içine numara yazılmaz.
- **Renk tek gösterge olamaz.** Stok/durum bilgisi metin + simge ile de anlatılır.
- Pazaryeri bağlantısı yoksa o pazaryerinin butonu **hiç gösterilmez**.
- Harici bağlantılar `rel="noopener noreferrer"` ile açılır.
- Gerçek `.env` içeriği okunmaz, loglanmaz, rapora yazılmaz.

## Doğrulama

Her fazın sonunda dördü de geçmeli:

```bash
npm run build && npm run lint && npm run typecheck && npm run test
```
