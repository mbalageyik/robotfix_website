# Tasarım kararları — Faz 1

> Marka gerekçeleri: [`brand-book.md`](./brand-book.md).
> Bu dosya, marka kitabının **koda nasıl indiği** ve nerede ondan ayrıldığıdır.
> Vault yok; kararlar bu dosyada tutulur.

## 1. Token mimarisi

**İki katman, tek yön.** Ham palet (`--rf-*`) `:root` içinde düz CSS değişkeni; semantik
roller (`--color-*`) Tailwind v4 `@theme` bloğunda. Bileşenler **yalnız semantik role**
yazılır.

**Açık/koyu ayrımı `-on-dark` soneki yerine kapsam (scope) ile çözüldü.** `.rf-on-dark`
sınıfı aynı semantik rolleri koyu sete çevirir:

```css
.rf-on-dark {
  --color-text: var(--rf-white);
  --color-link: var(--rf-cyan-400);
  --color-button-edge: var(--rf-edge-on-dark);
}
```

Gerekçe: bileşen `text-text` yazar ve iki zeminde de doğru çalışır. Sonek yaklaşımında her
bileşenin hangi zeminde olduğunu bilmesi gerekirdi. Marka kitabı §5.4 sonek öneriyor;
**bilinçli sapma**, semantik roller birebir aynı.

> Bu, Tailwind v4'te `@theme` (`inline` **değil**) gerektirir: yardımcı sınıflar
> `var(--color-text)` yayar, `@theme inline` ise değeri satır içine gömer ve kapsam
> değişimini imkânsız kılar. Tarayıcıda doğrulandı.

## 2. Palet — kilitli, iki türetilmiş token

Onaylı 11 renk + 5 durum rengi değişmedi. İki türetilmiş token eklendi:

| Token               | Değer     | Neden                            |
| ------------------- | --------- | -------------------------------- |
| `--rf-edge-on-dark` | `#7E8D99` | Koyu zeminde dolu buton kenarı   |
| `--rf-steel-400`    | `#537C99` | Koyu zeminde form/kontrol sınırı |

Hover tonları (`--rf-green-800`, `--rf-blue-700`, `--rf-whatsapp-900`) da paletten türetildi.
**Neon yeşil `#20D994` kullanılmadı** — bir test bunu bekçiliyor.

### Marka kitabının bulduğu üç kısıt ve koddaki karşılığı

| Bulgu                                             | Ölçüm                  | Koddaki çözüm                                                                                                                |
| ------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Sis Grisi form sınırı olarak yetersiz (§3.6.1)    | 1.34:1 (3:1 gerekli)   | `--color-border` (dekoratif) / `--color-border-strong` (etkileşimli, `#475467`, 7.69:1) ayrıldı; `Field` ikincisini kullanır |
| Güven Mavisi koyu zeminde okunmaz (§3.6.2)        | 2.89:1 (4.5:1 gerekli) | `.rf-on-dark` bağlantı ve odağı camgöbeğine çevirir (8.20:1) + kalıcı alt çizgi                                              |
| Dolu buton kenarı koyu zeminden ayrışmaz (§3.6.3) | 2.67:1 / 2.18:1        | Dolu butonlar **her zaman** 1px kenarlık taşır; açık zeminde saydam, koyu zeminde `#7E8D99`                                  |

Marka kitabı kenar için `#677684` önerdi; **ölçtüm, Servis Laciverti kartlarda 2.49:1 ile
kaldı**. `#7E8D99`'a çıkarıldı → 4.89 / 3.40 / 5.63, üç koyu yüzeyde de ≥3:1.

Kilitli paletin kabul edilmiş sınırları (`palette-contrast.test.ts` bunları da kayıt altına
alır, ki biri ileride "çalışıyor sanıp" kullanmasın):

- Camgöbeği üzerine **asla beyaz metin** (2.03:1) — metin daima Gece Laciverti.
- Camgöbeği **açık zeminde metin/ikon/sınır olamaz**; yalnız dolgu öğesi.
- Güven Mavisi **koyu zeminde metin olamaz**.

## 3. Tipografi

**Archivo** (başlık, 600/700) + **Manrope** (gövde, 400–700) + **JetBrains Mono** (ürün/stok
kodu, teknik veri). Üçü de değişken font, `next/font/google` ile **self-host** — üretim
çıktısında 15 woff2, sıfır harici font isteği (doğrulandı).

Gerekçe (marka kitabı §4.1): Archivo ve Manrope aynı sınıfta ama zıt apertürde — Archivo
kapalı/sıkı "teknik otorite", Manrope açık/ferah "okunur". Bu, markanın servis↔mağaza
gerilimini tipografiye taşır. JetBrains Mono `I·l·1` ve `0·O` ayrımı yapar; parça
kataloğunda bu okunabilirlik değil **doğruluk** meselesi.

- **Inter değil:** her rakipte aynı derecede çalışır, hiçbir şey söylemez.
- **SF Pro değil:** lisansı web dağıtımına izin vermez; §14 kopyalamayı yasaklıyor.

**`latin-ext` alt kümesi zorunlu** — `ğ ş ı İ` yalnız orada. Unutulursa Türkçe metin sessizce
yedek fonta düşer.

**Gövde 17px (mobil) → 18px (masaüstü).** Türkçe kelimeleri İngilizceden uzun; 16px yetersiz.
Tarayıcıda doğrulandı: 375px→17px, 1440px→18px.

**Display satır yüksekliği 0.98 değil `1`.** Marka kitabı 0.98 önerdi ama `İ` (U+0130) sıkı
satır yüksekliğinde üstten kırpılır. Styleguide'daki display örneği bilerek `İLGİ ışık`
içerir.

Fiyat, ürün kodu ve teknik değerlerde `tabular-nums` — hizasız fiyat listesi güveni düşürür.

## 4. Bileşen sözleşmeleri

- **`className` yalnız yerleşim içindir** (margin, genişlik, grid alanı). Renk/dolgu/yarıçap
  varyant API'siyle değişir. Bu sayede `tailwind-merge` bağımlılığı **eklenmedi** — sınıf
  çakışması tasarımla önlendi. Ödünleşim: sözleşme ihlal edilirse çakışma sessizdir.
- **Varsayılan sunucu bileşeni.** Faz 1'de `"use client"` alan **hiçbir** bileşen yok.
- **`Field` render fonksiyonu alır.** `useId` sunucu bileşeninde çalışmadığından id açıkça
  verilir; `aria-describedby` / `aria-invalid` / `aria-required` kontrole otomatik yayılır.
  input/textarea/select farkı olmadan doğru bağlantı garanti edilir, istemci JS'i gerekmez.
- **`AvailabilityBadge` yalnız-simge modu sunmaz** — metin kaldırılamaz (§15).
- **`Price` sahte değer basmaz.** Fiyat yoksa `0` veya `—` değil, "Fiyat için iletişime
  geçin".
- **`WhatsAppButton` numara yoksa `null` döner** — bozuk `wa.me` bağlantısı üretmez.
- **Buton varyantları arasında kırmızı yok.** Kırmızı yalnız `ErrorState` ve form hatası.

## 5. Hareket

Süre/easing tokenları `@theme` içinde. `prefers-reduced-motion: reduce` **tek global
katmanda** çözülür — bileşenler ayrıca kontrol yapmaz. Üretim CSS'inde doğrulandı:
`transition-duration`, `animation-duration`, `animation-iteration-count`, `scroll-behavior`
hepsi bastırılıyor.

## 6. WhatsApp motoru

`lib/whatsapp.ts` saf ve env'den bağımsız; `lib/site-config.ts` env'i okur. Faz 3'te aynı
arayüz `site_settings` tablosundan beslenecek — **tüketiciler değişmeyecek**.

Numara koda gömülmez. `lib/whatsapp.ts` JSDoc'unda bile telefon numarası **örneği**
yazılmaz; biçimler soyut anlatılır, somut örnekler yalnız testlerde. Bir test bunu
bekçiliyor (`source-hygiene.test.ts`).

Fiyat yoksa mesajda fiyat satırı **tümüyle çıkarılır** — boş, `undefined` veya `null`
görünmez (§8).

## 7. Bilinen açıklar

- **`₺` sembolü test edilmedi.** `latin-ext` alt kümesinde garanti değil. Fiyat gerçek
  veriyle render edilmeden önce (Faz 4) üç ailede de kontrol edilmeli; yoksa para birimi
  için yedek zincir veya `TL` metni gerekir.
- **`sm` buton yüksekliği 36px.** WCAG 2.2 AA (2.5.8, 24×24) geçer, AAA (44×44) geçmez.
  Yoğun/masaüstü bağlamlar için; birincil mobil CTA'larda `md`/`lg` kullanılmalı.
- **`.rf-on-dark` kartlarında `--color-border` yarı saydam beyaz.** Kontrast oranı zemine
  göre değişir; hesaplanabilir sabit değil. Dekoratif olduğu için kabul edildi.
- Odak halkası `outline-color` geçişi 140 ms sürer (`transition-colors` listesinde).
  Reduced-motion altında anında görünür.
