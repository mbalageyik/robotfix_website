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

- ~~**`₺` sembolü test edilmedi.**~~ **Faz 2'de ölçüldü ve çözüldü** — aşağıdaki
  "₺ (U+20BA) — ölçüm" bölümüne bakınız.
- **`sm` buton yüksekliği 36px.** WCAG 2.2 AA (2.5.8, 24×24) geçer, AAA (44×44) geçmez.
  Yoğun/masaüstü bağlamlar için; birincil mobil CTA'larda `md`/`lg` kullanılmalı.
- **`.rf-on-dark` kartlarında `--color-border` yarı saydam beyaz.** Kontrast oranı zemine
  göre değişir; hesaplanabilir sabit değil. Dekoratif olduğu için kabul edildi.
- Odak halkası `outline-color` geçişi 140 ms sürer (`transition-colors` listesinde).
  Reduced-motion altında anında görünür.

---

# Veri katmanı kararları — Faz 2

> Şema `supabase/migrations/`, sorgular `lib/data/`. Bu bölüm **neden öyle**
> olduğunu kaydeder.

## 8. Fiyat tipi: `bigint` kuruş

`numeric(10,2)` yerine **kuruş cinsinden `bigint`** seçildi.

Gerekçe: `numeric` PostgREST üzerinden JSON'a **string** olarak gelir (kesinlik
kaybını önlemek için) ve JavaScript tarafında `parseFloat` gerektirir; o noktada
kayan nokta hatası geri döner. Tam sayı kuruş ise JSON'da `number`'dır, güvenle
taşınır ve `Intl.NumberFormat` girdi olarak zaten sayı ister.

`price_minor > 0` kısıtı vardır ve **`0` ile `NULL` asla aynı şey değildir**:

| Değer  | Anlamı                         | Arayüz                       |
| ------ | ------------------------------ | ---------------------------- |
| `NULL` | Fiyat doğrulanmadı/girilmedi   | "Fiyat için iletişime geçin" |
| `> 0`  | Doğrulanmış fiyat              | Biçimlendirilmiş tutar       |
| `0`    | **Şema düzeyinde imkânsız**    | —                            |

"0 TL" bir fiyat değil, bir veri hatasıdır; girilmesi engellenir (bilgi dosyası §6).

`compare_at_price_minor` yalnız güncel fiyat **varsa ve ondan büyükse** kabul edilir
(`products_compare_at_requires_price`). Yanıltıcı indirim gösterimi uygulama
katmanında değil **şemada** engellenir.

## 9. `product_specs`: tablo, JSON değil

Teknik özellikler `jsonb` sütunu yerine ayrı tabloya alındı.

| İhtiyaç                        | Tablo                      | JSONB                        |
| ------------------------------ | -------------------------- | ---------------------------- |
| Panelde tek tek düzenleme      | Satır güncelle             | Tüm belgeyi oku-değiştir-yaz |
| Sıra (`display_order`)         | Sütun + indeks             | Dizi sırasına güven          |
| Boş etiket/değer engeli        | `check` kısıtı             | Uygulama katmanı             |
| Aynı etiketin tekrarı engeli   | `unique (product_id,label)`| Uygulama katmanı             |
| İleride "özelliğe göre filtre" | Normal indeks              | GIN + operatör bilgisi       |

Belirleyici olan son üç satır: JSONB'de bütünlük garantisi **uygulamaya düşerdi**.
Bu, "veri bütünlüğünü uygulamaya bırakma" kuralına aykırı.

## 10. Tek `brands` tablosu + ayrı `device_models`

Bilgi dosyası §6'da "marka" iki anlamda geçer:

1. Ürünü üreten/satan marka → `products.brand_id`
2. Ürünün **uyumlu olduğu** robot süpürge markası/modeli → `device_models.brand_id`

İkisi de **aynı** `brands` tablosunu gösterir. Gerekçe: "Roborock" hem bir parça
markası hem bir cihaz markasıdır. İki ayrı tablo açmak aynı gerçek dünya varlığını
ikiye böler, adı iki yerde güncellemeyi gerektirir ve er geç ayrışır.

`device_models.slug` **marka içinde** benzersizdir (`unique (brand_id, slug)`) —
"Xiaomi S10" ve "Roborock S10" birlikte yaşayabilsin diye.

Uyumluluk çoktan-çoğadır (`product_compatibility`) ve `verified_note` taşır:
uyumluluk **doğrulanmış bir iddiadır** (§20). `NULL` = doğrulanmadı; arayüz bunu
"uyumluluk doğrulanmadı" diye açıkça yazar, sessizce "uyumlu" demez.

**Şemada bilinçli olarak OLMAYAN alanlar:** yetkili servis, marka ortaklığı,
sertifika. Bilgi dosyası §10 bunları yasaklıyor — *olmayan bir alan yanlışlıkla
doldurulamaz.* Yasağı yorumla değil şemayla uyguluyoruz.

## 11. `related_products`: elle seçim önce, türetme sonra

İki katmanlı strateji (bilgi dosyası §7):

1. `related_products` tablosunda yöneticinin **elle** seçtiği ilişkiler — `display_order`
   ile sıralı. Veri katmanı bu sırayı **korur** (veritabanının döndürdüğü sıraya güvenmez).
2. Tablo o ürün için boşsa, aynı kategoriden **türetilir**.

Elle seçim her zaman kazanır; türetme yalnız boşluğu doldurur. Böylece yönetici
istediği ürünü öne çıkarabilir ama hiçbir ürün "ilgili ürünü yok" diye boş kalmaz.

RLS'te `related_products` için **iki taraf da** aktif olmalıdır — yayımlanmamış bir
ürüne köprü kurulmaz.

## 12. Alt tablolar ürünün yayın durumunu MİRAS ALIR

`product_images`, `product_specs`, `product_compatibility`,
`product_marketplace_links` **kendi `status` sütununu taşımaz**. Görünürlükleri
`public.product_is_public(product_id)` üzerinden ürüne bağlanır.

Gerekçe: alt tabloya ayrı bir durum vermek, "ürün taslak ama görselleri yayında"
gibi tutarsız bir duruma izin verirdi — yayımlanmamış bir ürünün görselleri ve
fiyat ipuçları sızardı. Tek doğruluk kaynağı ürünün kendi durumudur.

`product_is_public()` `security definer` + sabit `search_path` ile yazıldı: politika
içinden çağrıldığında `products` tablosunun kendi RLS'ine takılmaz ve arama yolu
ele geçirilemez.

## 13. Yetki modeli: `admin_users` + `is_admin()`

Rol bilgisi JWT talebinde değil **veritabanı tablosunda** tutulur.

Gerekçe: JWT'ye yazılan bir `role` talebi, token yenilenene kadar geçerli kalır —
yetki alınmış bir kullanıcı token'ı dolana dek yazmaya devam edebilirdi. Tabloya
bakan `is_admin()` ise **anında** etkilidir.

- `is_admin()` `security definer`'dır → politika içinden çağrılınca `admin_users`
  tablosunun kendi RLS'ine takılmaz.
- `stable`'dır → planlayıcı satır başına yeniden çağırmaz.
- `admin_users` üzerinde **INSERT politikası yoktur**: kimse kendini yönetici
  yapamaz. Yeni yönetici yalnız `service_role` veya panelin SQL ekranından eklenir.
- `admin_users` **iki hatla** korunur: anon'un tabloda hiçbir grant'i yoktur **ve**
  yazma politikası yoktur. Faz 2 denetiminde yalnız ikinci hattın tuttuğu bulundu —
  Supabase'in varsayılan yetkileri anon'a insert/update/delete vermişti ve RLS
  migrasyonundaki `revoke` döngüsü bu tabloyu kapsamıyordu. Sömürülebilir değildi
  (RLS reddediyordu) ama **yetki yükseltmenin tek kapısı en zayıf korunan tablo
  olamaz**. Grant'ler geri alındı, `force row level security` açıldı; artık anon
  denemesi RLS'e varmadan `permission denied for table` ile düşüyor.
- Tüm yazma politikaları `to authenticated` + `is_admin()`'den geçer; `anon` rolüne
  hiçbir yazma politikası **ve** hiçbir yazma grant'i verilmez (iki savunma hattı).

Tek yönetici yeterlidir (§17). İleride rol çeşitlenirse `admin_users`'a `role` sütunu
eklenir; politika **metinleri değişmez** çünkü hepsi `is_admin()` üzerinden geçer.

## 14. Postgres `lower()` Türkçe'de yanlıştır

`slugify()` içinde büyük harfler `lower()` çağrılmadan **önce** elle çevrilir.

Sebep: Postgres'in `lower()` fonksiyonu C/ICU yerel ayarına göre çalışır ve
varsayılan kurulumda Türkçe kurallarını uygulamaz:

| Girdi | Postgres `lower()` | Türkçe doğrusu |
| ----- | ------------------ | -------------- |
| `I`   | `i`                | `ı`            |
| `İ`   | `i̇` (i + birleşen nokta) | `i`      |

İkincisi daha sinsi: `lower('İ')` iki kod noktalı bir dizi üretir; `[^a-z0-9]+`
kuralı birleşen noktayı tireye çevirir ve **"İstasyon" → `i-stasyon`** olur.

Çözüm — `translate()` ile açık eşleme, `lower()`'dan önce:

```sql
translate(input, 'İIĞÜŞÖÇ', 'iıgusoc')
```

`unaccent` eklentisi **kullanılmadı**: noktasız `ı` için doğru sonucu garanti etmez
ve `İ` için güvenilir değildir. Bu dönüşüm tahmin edilebilir olmalı, çünkü slug
kalıcı bir URL'dir. `__tests__/db/slugify.test.ts` bu davranışı kilitler.

## 15. PostgREST gömülü kaynak filtresi — sessiz tuzak

**Faz 2'de bulunan gerçek hata.** `lib/data/products.ts` marka/kategori filtresini
şöyle yazıyordu:

```ts
query.select("... brand:brands ( ... )").eq("brands.slug", filters.brandSlug)
```

SQL sezgisi bunun ürünleri filtreleyeceğini söyler. **Söylemez.** PostgREST'te gömme
varsayılan olarak LEFT JOIN'dir; gömülü kaynağa yazılan filtre **üst satırları elemez**,
yalnız eşleşmeyen satırların gömülü nesnesini `null` yapar.

Ölçülen sonuç (16 demo ürün, `ornek-filtreler` kategorisinde 2 ürün var):

| Sorgu                            | Dönen satır | `total` |
| -------------------------------- | ----------- | ------- |
| Gömme `!inner` **olmadan**       | **16**      | **16**  |
| Gömme `!inner` **ile**           | 2           | 2       |

Yani kategori sayfası tüm katalogu listeler, sayaç yanlış olur ve eşleşmeyen
ürünler "markasız/kategorisiz" görünürdü.

Çözüm: seçim metni filtreye göre kurulur (`buildListSelect`). `!inner` **yalnız
ilgili filtre varken** eklenir — aksi hâlde `brand_id`/`category_id` `NULL` olan
ürünler listeden tümüyle düşerdi.

**Bu hata neden 37 DB testinden geçti:** `rls.test.ts` doğrudan Postgres'e `pg` ile
bağlanır ve SQL düzeyinde politika davranışını ölçer. Ama veri katmanı Postgres'e
değil **PostgREST'e** konuşur; ikisinin sorgu anlamı aynı değildir. Bu yüzden
`__tests__/db/postgrest-queries.test.ts` eklendi: anon anahtarıyla, gerçek HTTP
üzerinden, `lib/data` fonksiyonlarının kendisini çağırır.

**Kural:** veri katmanının davranışı, veri katmanının konuştuğu protokol üzerinden
test edilir.

## 16. ₺ (U+20BA) — ölçüm

Faz 1'in açık bıraktığı soru ölçüldü. Yöntem: tarayıcıda canvas `measureText`
advance karşılaştırması (CSS beyanına bakmak değil).

| Aile           | ₺ advance (100px) | Sonuç              |
| -------------- | ----------------- | ------------------ |
| Archivo        | 57.80             | **glif VAR**       |
| Manrope        | 60.97             | **glif VAR**       |
| JetBrains Mono | 55.62             | **glif YOK**       |

JetBrains Mono için kanıt kesindir çünkü tek genişlikli bir fonttur: taşıdığı her
glif 100px'te **60** ölçülür — `A M i 0 W . ı ğ Ş € $ £` dâhil. Yalnız `₺` 55.62
ölçülür, yani o glif fontun kendisinden gelmiyor; tarayıcı yedeğe düşüyor.

> `document.fonts.check()` üç aile için de `true` döndürdü — **yanlış pozitif**.
> O API `@font-face` bildirimindeki `unicode-range`'e bakar, dosyada glifin
> gerçekten bulunup bulunmadığına değil. CSS'e bakarak ölçmemenin sebebi budur.

Çözüm — mono zincirine gövde fontu eklendi:

```css
--font-mono: var(--font-technical), var(--font-body), ui-monospace, "SFMono-Regular", monospace;
```

Böylece `₺` rastgele bir sistem fontundan değil, zaten yüklü olan **Manrope**'tan
gelir. Ölçümle doğrulandı: zincirle `A` = 60 (JetBrains Mono), `₺` = 60.97 (Manrope).
Harf ve rakamlar tek genişlikte kalır, yalnız para birimi simgesi yedeğe düşer;
`tabular-nums` hizayı korur.

`TL` metnine düşülmedi: `Intl.NumberFormat("tr-TR", { style: "currency" })` zaten
`₺` üretir, onu metinle değiştirmek biçimlendiriciyle savaşmak olurdu.
`__tests__/font-lira.test.ts` zinciri bekçiler.

## 17. Port ayrımı: 54341–54344

`supabase/config.toml` portları Supabase'in varsayılanı olan `5432x`'ten
`5434x`'e kaydırır.

| Servis    | Bu proje | Varsayılan |
| --------- | -------- | ---------- |
| API       | 54341    | 54321      |
| Postgres  | 54342    | 54322      |
| Studio    | 54343    | 54323      |
| Inbucket  | 54344    | 54324      |

Gerekçe: aynı makinede başka bir Supabase projesi (`vena-hospital-portal`)
varsayılan portlarda çalışıyor. Kaydırma olmasaydı `supabase start` ya port
çakışmasıyla düşerdi ya da — çok daha kötüsü — bu projenin araçları **öteki projenin
veritabanına** bağlanırdı. `db reset` gibi bir komutun yanlış veritabanında
çalışması geri alınamaz.

Bu yüzden portlar bir tercih değil **güvenlik sınırıdır**; değiştirilmez.

## 18. `dev_activate_demo.sql` / `dev_deactivate_demo.sql`

Tohum verisinin tamamı `status = 'draft'`'tır, dolayısıyla RLS onu anonim istemciye
**hiç döndürmez**. Bu doğru üretim davranışıdır ama geliştirirken sorun olur: anonim
istemcinin gördüğü yolu (RLS dâhil) gerçek veriyle denemek imkânsızlaşır.

İki betik bu boşluğu kapatır:

- `dev_activate_demo.sql` — demo satırları geçici olarak `active` yapar.
- `dev_deactivate_demo.sql` — `draft`'a geri çeker. **Varsayılan durum budur.**

**Yalnız yerel geliştirme. Üretimde asla.** Aktivasyon betiği iki bağımsız korumadan
geçer, ikisi de tutmalıdır:

1. **Yerel yığın mı?** `app.settings.jwt_secret` Supabase CLI'nin herkesçe bilinen
   sabit demo değerine eşit mi. Gerçek projede sır rastgeledir; okunamazsa `NULL`
   gelir ve karşılaştırma **kapalı tarafa** düşer (fail-closed).
2. **Veritabanı boş/demo mu?** `is_demo = false` olan tek bir katalog satırı bile
   varsa betik reddeder — yerel yığın taklit edilse bile dolu bir veritabanına
   dokunulmaz.

Betiğin tamamı tek `begin/commit` içindedir: koruma tetiklenirse hiçbir satır
değişmez, kısmi aktivasyon olamaz.

Her iki koruma da **çalıştırılarak** doğrulandı (taklit sır → reddetti; gerçek satır
eklendi → reddetti ve rollback yaptı).

Ek olarak `rls.test.ts` içindeki bir test "hiçbir demo satır anonime görünmez" der:
biri aktivasyonu geri almayı unutursa **test kırılır**. Beyan değil, bekçi.
