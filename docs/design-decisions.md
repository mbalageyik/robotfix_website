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

| Değer  | Anlamı                       | Arayüz                       |
| ------ | ---------------------------- | ---------------------------- |
| `NULL` | Fiyat doğrulanmadı/girilmedi | "Fiyat için iletişime geçin" |
| `> 0`  | Doğrulanmış fiyat            | Biçimlendirilmiş tutar       |
| `0`    | **Şema düzeyinde imkânsız**  | —                            |

"0 TL" bir fiyat değil, bir veri hatasıdır; girilmesi engellenir (bilgi dosyası §6).

`compare_at_price_minor` yalnız güncel fiyat **varsa ve ondan büyükse** kabul edilir
(`products_compare_at_requires_price`). Yanıltıcı indirim gösterimi uygulama
katmanında değil **şemada** engellenir.

## 9. `product_specs`: tablo, JSON değil

Teknik özellikler `jsonb` sütunu yerine ayrı tabloya alındı.

| İhtiyaç                        | Tablo                       | JSONB                        |
| ------------------------------ | --------------------------- | ---------------------------- |
| Panelde tek tek düzenleme      | Satır güncelle              | Tüm belgeyi oku-değiştir-yaz |
| Sıra (`display_order`)         | Sütun + indeks              | Dizi sırasına güven          |
| Boş etiket/değer engeli        | `check` kısıtı              | Uygulama katmanı             |
| Aynı etiketin tekrarı engeli   | `unique (product_id,label)` | Uygulama katmanı             |
| İleride "özelliğe göre filtre" | Normal indeks               | GIN + operatör bilgisi       |

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
sertifika. Bilgi dosyası §10 bunları yasaklıyor — _olmayan bir alan yanlışlıkla
doldurulamaz._ Yasağı yorumla değil şemayla uyguluyoruz.

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

| Girdi | Postgres `lower()`       | Türkçe doğrusu |
| ----- | ------------------------ | -------------- |
| `I`   | `i`                      | `ı`            |
| `İ`   | `i̇` (i + birleşen nokta) | `i`            |

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
query.select("... brand:brands ( ... )").eq("brands.slug", filters.brandSlug);
```

SQL sezgisi bunun ürünleri filtreleyeceğini söyler. **Söylemez.** PostgREST'te gömme
varsayılan olarak LEFT JOIN'dir; gömülü kaynağa yazılan filtre **üst satırları elemez**,
yalnız eşleşmeyen satırların gömülü nesnesini `null` yapar.

Ölçülen sonuç (16 demo ürün, `ornek-filtreler` kategorisinde 2 ürün var):

| Sorgu                      | Dönen satır | `total` |
| -------------------------- | ----------- | ------- |
| Gömme `!inner` **olmadan** | **16**      | **16**  |
| Gömme `!inner` **ile**     | 2           | 2       |

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

| Aile           | ₺ advance (100px) | Sonuç        |
| -------------- | ----------------- | ------------ |
| Archivo        | 57.80             | **glif VAR** |
| Manrope        | 60.97             | **glif VAR** |
| JetBrains Mono | 55.62             | **glif YOK** |

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

| Servis   | Bu proje | Varsayılan |
| -------- | -------- | ---------- |
| API      | 54341    | 54321      |
| Postgres | 54342    | 54322      |
| Studio   | 54343    | 54323      |
| Inbucket | 54344    | 54324      |

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

---

# Faz 3 — Kimlik doğrulama ve yönetim paneli

## 19. Üç savunma hattı ve `proxy.ts`'in ne OLMADIĞI

Next.js 16'da `middleware.ts`'in adı **`proxy.ts`** oldu; davranış aynıdır.

Yetkilendirme **üç bağımsız hatta** kurulur ve hiçbiri tek başına yeterli sayılmaz:

| Hat | Dosya             | Görevi                                     | Tek başına yeterli mi |
| --- | ----------------- | ------------------------------------------ | --------------------- |
| 1   | `proxy.ts`        | Oturum çerezini tazeler + iyimser ön eleme | **Hayır**             |
| 2   | `lib/auth/dal.ts` | Her sayfa ve her aksiyonda gerçek kontrol  | Uygulama hattı        |
| 3   | Postgres RLS      | `is_admin()` politikaları                  | Veritabanı hattı      |

**`proxy.ts` yetkilendirme yapmaz.** Next.js dokümanı proxy'nin "tam oturum yönetimi
veya yetkilendirme çözümü" olarak kullanılmamasını açıkça söyler: proxy her rotada,
prefetch edilenler dâhil çalışır; oraya veritabanı sorgusu koymak hem yavaşlatır hem
de tek savunma hattı yanılsaması yaratır.

**`app/admin/layout.tsx` de bir güvenlik sınırı değildir.** Kısmi render nedeniyle
layout gezinmede yeniden çalışmaz ve alt segmentlerin render edilip edilmeyeceğini
kontrol etmez. Bu yüzden **her sayfa `requireAdminPage()`, her aksiyon
`requireAdminAction()` çağırır.**

`proxy.ts` silinse bile panel güvenli kalmalıdır — `__tests__/db/admin-actions.test.ts`
bunu doğrudan doğrular: yönetici olmayan bir oturumla aksiyonlar çağrılır ve hepsi
yazmadan reddeder.

**`getSession()` değil `getUser()`.** `getSession()` çerezdeki JWT'yi doğrulamadan
okur ve çerez istemci tarafından üretilebilir. `getUser()` her çağrıda token'ı Auth
sunucusuna doğrulatır.

## 20. Server Actions — route handler değil

Panelin tüm yazmaları **Server Actions** ile yapılır. Route handler yazılmadı.

Gerekçe:

- **CSRF çerçeveden gelir.** Next.js Server Actions isteğin `Origin` başlığını `Host`
  ile karşılaştırır ve uyuşmayanı reddeder; aksiyon kimlikleri build sırasında
  şifrelenir ve kullanılmayan aksiyonlar istemci paketinden çıkarılır. Kendi token
  mekanizmamızı yazmak, çerçevenin sağladığını yeni bir hata yüzeyiyle tekrar icat
  etmek olurdu.
- **JS olmadan da çalışır.** Form + action ilerleyici geliştirmedir; panel, istemci
  JS'i yüklenmeden de gönderilebilir.
- **Tip güvenliği.** `FormData` → zod → tiplenmiş satır zinciri tek dosyada durur;
  route handler'da istek/yanıt şeması elle senkron tutulurdu.

Yazma işlemleri **hiçbir zaman GET olmaz**: `ActionButton` bir bağlantı değil form
render eder, çünkü GET ile yazmak tarayıcı ön yüklemesi veya bir botun bağlantıyı
izlemesiyle istem dışı tetiklenebilir.

## 21. Panel yazmaları service role KULLANMAZ

Panelin RLS'i atlaması cazip ama yanlıştır: o durumda uygulamadaki tek bir hata tüm
veriyi açardı.

Bunun yerine **yöneticinin kendi oturumu** kullanılır (`getServerClient()`, anon
anahtar + çerez). RLS'teki "yönetici tam yetkili" politikası izin verici
(permissive) olduğu için "aktifleri okur" politikasıyla VEYA'lanır ve yönetici
taslak/pasif/arşiv dâhil her durumu görür — RLS ise ikinci savunma hattı olarak
yerinde kalır.

**Service role anahtarının kullanıldığı yerlerin tam listesi:**

| Yer                            | Amaç                             |
| ------------------------------ | -------------------------------- |
| `lib/supabase/admin-client.ts` | Anahtarın okunduğu **tek** dosya |

Faz 3 sonunda `getAdminClient()` **hiçbir yerden çağrılmıyor**. İstemci ileride
gerekebileceği için duruyor ve üç katmanlı korumasını koruyor (`server-only` importu,
`NEXT_PUBLIC_` öneki taşımayan ad, çalışma zamanı `window` kontrolü).

`__tests__/admin/security-hygiene.test.ts` bunu bekçiye bağlar: `SUPABASE_SERVICE_ROLE_KEY`
kaynakta yalnız `admin-client.ts` içinde geçebilir ve hiçbir aksiyon dosyası
`getAdminClient` çağıramaz.

## 22. Taslak-kaydet / yayımla ayrımı

Yayın durumu **form alanıdır**, ayrıca **tek tıklık geçiş butonları** vardır. İkisi
birlikte bulunur çünkü iki farklı iş akışına hizmet ederler:

- Form alanı: ürünü düzenlerken durumu da ayarlamak.
- Geçiş butonu: yalnız durumu değiştirmek — formu doldurup göndermeye gerek kalmadan.

**Yeni ürün daima `draft` doğar** (`EMPTY_PRODUCT_FORM`). Yeni ürünün varsayılan
bulunabilirliği `on_order`'dır, `in_stock` değil: stok durumu henüz bilinmiyorken
"Stokta" demek uydurmadır, "Siparişle" ise gerçek ve güvenli bir başlangıçtır.

**Kalıcı silme yoktur.** Ana kayıtlar arşivlenir (`status = 'archived'`). Tek istisna
**ürün görselleridir**: arşivlenmiş bir görselin anlamı yoktur ve dosyanın kovada
kalması sessiz bir depolama maliyetidir; bu yüzden gerçek `DELETE` kullanılır ve
arayüz iki adımlı onay ister.

Onay adımı `window.confirm()` ile **yapılmaz**: tarayıcı kipi sayfayı kilitler, ekran
okuyucu davranışı tutarsızdır ve stillendirilemez. Yerine `<details>` kullanılır —
saf HTML, klavyeyle çalışır, JS kapalıyken de açılır.

## 23. Storage kova politikası

Kova `product-images`, **`public = true`**.

Görünürlük gerekçesi: ürün görselleri zaten herkese açık bir katalogda gösterilecek ve
`next/image` imzalı URL yenilemesiyle uğraşmadan doğrudan okuyabilmeli. Kovanın public
olması **yazmayı açmaz** — üç yazma fiili (`insert`/`update`/`delete`) ayrı ayrı
`public.is_admin()` ile korunur.

**Kabul edilmiş ödünleşim:** taslak bir ürünün görseli de bu kovadadır ve URL'i bilen
biri görebilir. Görsel dosyası sır değildir; ürünün **yayın durumu** ise veritabanında
RLS ile korunur. Sır niteliğinde bir belge bu kovaya konulmaz.

**Dosya kısıtı iki katmanlıdır** ve ikisi aynı sabitlerden beslenir:

1. Kova düzeyi (`allowed_mime_types`, `file_size_limit` = 5 MB) — Storage API'si kendi
   uygular; uygulama kodu atlansa bile reddeder.
2. Uygulama düzeyi (`validateImageFile`) — kullanıcıya anlaşılır Türkçe mesaj verir.

`__tests__/admin/storage.test.ts` ikisinin ayrışmasını imkânsız kılar: kova adı, boyut
sınırı ve MIME listesi migrasyon dosyasıyla karşılaştırılır.

**Yol kullanıcının dosya adını taşımaz.** Dosya adı saldırgan girdisidir (yol geçişi,
Unicode hileleri, aşırı uzunluk); yol tamamen `products/<ürün-id>/<uuid>.<uzantı>`
biçiminde bizim ürettiğimiz değerlerden kurulur. Bu, düşmanca bir dosya adıyla
**çalıştırılarak** doğrulandı.

## 24. GoTrue NULL jeton tuzağı — `dev_create_admin.sql`

Supabase Auth (GoTrue) bir Go servisidir ve `auth.users` tablosundaki jeton sütunlarını
(`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`,
`email_change_token_current`, `phone_change`, `phone_change_token`,
`reauthentication_token`) **NULL kabul etmeyen** `string` alanlara okur.

Şema bu sütunlarda NULL'a izin verdiği için elle `insert` yapan bir betik onları
kolayca NULL bırakır. Sonuç: parola doğru olsa bile giriş **her zaman** 500 döner —

```
Scan error on column index 3, name "confirmation_token":
converting NULL to string is unsupported
```

— ve kullanıcıya "Database error querying schema" görünür.

Bu tuzağa **düşüldü**: `dev_create_admin.sql`'in ilk hâli bu sütunları boş bırakıyordu
ve oluşturulan yönetici hesabı hiçbir zaman giriş yapamıyordu. Betik artık hepsini
açıkça `''` kurar ve ayrıca daha önce oluşmuş satırları `coalesce` ile onarır, böylece
betiği yeniden çalıştırmak sorunu çözer.

Üretimde yönetici, Supabase panelinin kendi arayüzünden oluşturulur (bkz.
`docs/supabase-setup.md`); orada bu sütunlar servis tarafından doğru doldurulur.

## 25. Panel indekslenmez — iki katman

`ADMIN_ROBOTS` (`index: false, follow: false, nocache: true`) **her** admin sayfasında
ve düzende bulunur; `app/robots.ts` ayrıca `/admin` ve `/veri-kontrol` yollarını
taramaya kapatır.

İkisi de gereklidir: `robots.txt` taramayı engeller ama başka bir siteden bağlantı
verilirse sayfa yine de indekslenebilir — `noindex` bunu keser. Tersine `noindex`
yalnız sayfa alındığında görülür; `robots.txt` trafiği baştan keser.

Panel sayfaları ayrıca `force-dynamic`'tir: oturuma bağlı bir sayfanın statik
üretilmesi, bir yöneticinin gördüğü HTML'in önbelleğe alınıp başkasına sunulması
riskidir. Üçü de statik testle bekçiye bağlıdır.

## 26. Kullanıcı numaralandırma sızdırılmaz

Giriş formu "e-posta bulunamadı" ile "parola yanlış" durumlarını **ayırt ettirmez**;
tek bir genel mesaj döner. Ayırt ettirseydi form bir kullanıcı numaralandırma aracına
dönüşürdü.

Aynı sebeple `is_admin` durumu da girişte sızdırılmaz: yönetici olmayan geçerli bir
kullanıcı **giriş yapabilir**, panelde ise açık bir 403 görür (`/admin/yetkisiz`).
403 sessizce gizlenmez — ne olduğu, neden olduğu ve ne yapabileceği yazılır.

Hız sınırlaması Supabase Auth'un kendi korumasıyla yapılır (`config.toml` →
`[auth.rate_limit]`), yeniden icat edilmez. 429 ayrı bir mesajla gösterilir çünkü bu
bir kimlik bilgisi hatası değildir ve numaralandırma bilgisi taşımaz.

## 27. Açık yönlendirme (open redirect) koruması

Giriş sonrası dönüş adresi (`?devam=`) yalnız `/admin` ile başlayan ve `//` ile
başlamayan bir yol olabilir. `//baska.site` tarayıcıda **protokol-göreli mutlak
URL**'dir, bu yüzden ayrıca elenir.

Kontrol **iki yerde** yapılır: giriş sayfasında (gizli alana yazılan değeri temizler)
ve `signInAction` içinde (asıl kapı). Yalnız sayfada yapılsaydı aksiyona doğrudan
istek atarak atlanabilirdi.

## 28. Dinamik form koleksiyonları JSON olarak taşınır

Teknik özellik, pazaryeri bağlantısı, uyumlu model ve ilgili ürün seçimleri sayısı
değişken koleksiyonlardır. `specs[0][label]` biçiminde alan adı üretmek sunucuda elle
ayrıştırma gerektirirdi.

Bunun yerine her koleksiyon **tek bir gizli alana JSON** olarak yazılır ve sunucuda
zod ile ayrıştırılır: şema tek kaynak kalır, ayrıştırma hataya kapalıdır.

Alt tablolar **"sil ve yeniden yaz"** ile eşitlenir. Fark hesaplamak (hangi satır
eklendi/çıkarıldı/sıralandı) küçük tablolar için gereksiz ve hataya çok açıktır.
Ödünleşim: `product_specs.id` değerleri her kayıtta değişir — bu kimlikler dışarıya
verilmediği için sorun değildir. **Görseller bu kapsamda değildir**; kimlikleri
Storage yoluna bağlıdır ve ayrı yönetilir.

## 29. Kopyalayarak çoğaltma

CLAUDE.md toplu CSV içe aktarmayı kapsam dışı bırakır; yerine "ürün formu +
kopyalayarak çoğaltma" der.

Kopya **daima `draft`** doğar: benzer bir ürünü çoğaltıp düzenlemeyi unutmak, yanlış
bilgiyi yayına almanın en kolay yoludur. Kopyalanmayanlar ve sebepleri:

| Alan          | Neden kopyalanmaz                                                          |
| ------------- | -------------------------------------------------------------------------- |
| `sku`         | Benzersizdir; yönetici kendi girer                                         |
| Görseller     | İki ürün aynı Storage dosyasını gösterirdi; birini silmek diğerini kırardı |
| `is_demo`     | Kopya elle üretilmiş gerçek bir kayıttır, örnek veri değil                 |
| `is_featured` | Öne çıkarma bilinçli bir karardır, miras alınmaz                           |

Kopya için slug **çakışmayacak biçimde** üretilir (`ad-kopya`, `-2`, `-3`…) çünkü
kullanıcı hiçbir form doldurmadığından düzeltebileceği bir alan yoktur. Normal
kaydetmede bu yapılmaz — orada çakışma kullanıcıya bildirilir ve slug'ı kendisi seçer.

## 30. Slug üretimi TypeScript'te tekrarlanmaz

Slug, veritabanının `slugify()` fonksiyonuyla üretilir; panel bir RPC çağrısı yapar.

Gerekçe: tohum verisi, olası SQL taşımaları ve panel **aynı** slug'ı üretmelidir. İki
ayrı uygulama er geç ayrışır — özellikle Türkçe'de (`I → ı`, `İ → i`) bu ayrışma
sessiz ve **geri alınamaz** olur, çünkü slug kalıcı bir URL'dir.

Maliyet: kaydetme başına bir ağ gidiş-dönüşü. Kabul edilebilir.

## 31. Kategori döngüsü uygulama katmanında engellenir

Şemada yalnız `parent_id <> id` kısıtı vardır (kendi kendinin üstü olamaz). Daha derin
döngüler (A→B→A) `wouldCreateCycle()` ile engellenir: adayın ata zinciri yukarı
yürünür ve düzenlenen kategoriye rastlanırsa reddedilir. Veride hâlihazırda bir döngü
varsa `seen` kümesi sonsuz dönmeyi keser.

Kontrol **sunucudadır**; formdaki seçenek listesinden yalnız kaydın kendisi çıkarılır.
İstemci doğrulaması bir güvenlik sınırı değildir.

## 32. Bağlı kayıt uyarısı arşivlemeden ÖNCE görünür

Arşivleme yetim kayıt bırakmaz — bağlı ürünler silinmez — ama yönetici neyin
etkileneceğini önceden bilmelidir. Bu yüzden bağlı kayıt sayıları liste ekranında
gösterilir ve onay metnine yazılır.

Sayımlar **tek sorguda** okunup bellekte gruplanır (`getDependencyCounts`); kayıt
başına ayrı sayım sorgusu atmak N+1 olurdu.

## 33. `next.config.ts` → `images.remotePatterns` env'den türetilir

`next/image` uzak bir kaynaktan görsel almadan önce o kaynağın açıkça izinli olmasını
ister; aksi hâlde site açık bir görsel proxy'sine dönüşür.

Desen `NEXT_PUBLIC_SUPABASE_URL`'den **türetilir**, elle yazılmaz: yerelde
`127.0.0.1:54341`, üretimde proje alan adı olur. İkisini de sabit yazsaydık
ortamlardan biri sessizce bozulurdu. Yalnız `/storage/v1/object/public/**` yolu
izinlidir; imzalı/özel yollar buradan geçmez.

## 34. Vitest ve `server-only`

`server-only` paketi varsayılan girdisinde bilerek hata atar; Next.js bunu
`react-server` koşuluyla zararsız `empty.js`'e çözer. Vitest'in Node çözümleyicisinde
o koşul yoktur, bu yüzden `vitest.db.config.mts` aynı çözümü elle yapar.

Bu korumayı **zayıflatmaz**: koruma üretim derlemesinde çalışır ve `npm run build` her
fazın kapısıdır. Alias yalnız test koşucusunun modülü yükleyebilmesini sağlar.

## 35. `as unknown as` kaldırıldı — şablon literal tipiyle

Faz 2'den kalan dört `as unknown as` (`lib/data/products.ts` ×3,
`lib/data/taxonomy.ts` ×1) **sıfıra indirildi**. Bastırılmadı, sebebi ortadan
kaldırıldı.

**Kök sebep.** supabase-js seçim metnini _tip düzeyinde_ ayrıştırır ve sonuç
satırının tipini oradan üretir. Bu ayrıştırma yalnız metin bir **literal tip**
olduğunda çalışır. `buildListSelect()` dönüş tipi `string` diye işaretlendiği
için literallik kayboluyor, çıkarım çöküyor ve her çağrı yerinde elle yazılmış
bir şekle cast etmek gerekiyordu.

`taxonomy.ts`'teki cast ise **hiç gerekli değildi** — seçim zaten literaldi;
cast kaldırılınca hiçbir şey değişmedi.

**Çözüm.** Gömme adları ve şablon `as const` ile literal tutulur; dönüş tipi
açıklaması kaldırılır. TypeScript şablon literal tipini interpolasyon boyunca
korur, bu yüzden dönüş tipi dört olası seçim metninin **birleşimi** olur ve
çıkarım ayakta kalır — seçim metnini dört kez kopyalamadan.

**Neden kopyalamak yerine bu.** Dört ayrı literal metin yazmak da işe yarardı
ama sütun listesi dört yere dağılırdı; bir sütun eklerken birini unutmak
kolaydır. Şablon literal tipi tek kaynağı korur.

**Kazanç ölçüldü, varsayılmadı.** Cast'ler kaldırıldıktan sonra seçimde
olmayan bir sütuna (`row.this_column_does_not_exist`) erişim denendi ve
derleyici bunu **yakaladı** — üretilen tipin `availability` alanı gerçek enum
birleşimi (`"in_stock" | … | "out_of_stock"`) olarak çıkarılmıştı. Yani tip
artık gerçekten güçlü; `any`'ye düşüp testi sessizce geçiren bir çözüm değil.

Pratik sonuç: seçim metnine bir sütun eklenip `RawListRow`'a eklenmezse (veya
tersi) **derleyici hata verir**. Cast'li hâlde bu sapma sessizce kaçardı ve
çalışma zamanında `undefined` olarak ortaya çıkardı.

## 36. Faz 3'ün bilinen açıkları

- **Parola sıfırlama akışı yok.** Tek yönetici modelinde Supabase panelinden yapılır.
  Panelde "parolamı unuttum" bağlantısı bilinçli olarak yoktur — e-posta gönderimi
  yapılandırılmadan eklenirse çalışmayan bir bağlantı olurdu.
- **Yönetici davet/ekleme arayüzü yok.** Yetki yalnız `admin_users` tablosuna satır
  eklenerek verilir; panelden talep edilemez. Bu bilinçlidir (Faz 3 kapsamı: tek
  yönetici).
- **Görsel sıralaması sürükle-bırak değil**, yukarı/aşağı butonlarıyla yapılır.
  Sürükle-bırak klavye ve dokunmatik desteği gerektiren kırılgan bir etkileşimdir;
  butonlar her girdi yöntemiyle çalışır.
- **Görsel kırpma/optimizasyon yok.** Yüklenen dosya olduğu gibi saklanır; boyut
  düşürme `next/image` tarafında yapılır. Kaynak dosya 5 MB ile sınırlıdır.
- **Denetim kaydı (audit log) yok.** Kimin neyi ne zaman değiştirdiği tutulmuyor.
  Tek yönetici varken maliyeti faydasından fazla; çok yönetici gerekirse eklenmeli.

## 37. Hizmet paneli fotoğrafları şemada değil, kodda eşlenir

`services` tablosunda görsel alanı **yoktur ve bu değişiklikte de eklenmedi**.
Ana sayfadaki hizmet panellerinin fotoğrafı `icon_key` üzerinden bir kod
eşlemesinden gelir (`lib/home/service-media.ts`), tıpkı simgenin
`components/ui/icons.tsx` üzerinden gelmesi gibi.

**Neden.** Şemaya `image_path` eklemek doğru NİHAİ çözümdür; ama o sütun bugün
boş olurdu — işletmenin henüz kendi atölye fotoğrafı yok. Boş bir sütun +
yönetim paneli alanı + depolama yolu eklemek, tek kazancı "ileride
doldurulabilir" olan üç yeni bakım yüzeyi demekti. Fotoğraflar zaten
**geçicidir** (`docs/varlik-lisanslari.md`); geçici bir içerik için kalıcı bir
veri modeli açılmadı. Gerçek fotoğraflar geldiğinde sütun eklenip eşleme
silinir — o değişiklik bu yapıdan bağımsızdır.

**Bozulması zararsızdır.** Tanınmayan/boş `icon_key` `null` döner ve panel eski
görünümüne (marka degradesi + büyük simge) düşer. Fotoğraf bir katmandır,
hizmetin görünme koşulu değildir.

**Kontrast fotoğrafa bırakılmadı.** Fotoğrafın üstündeki metnin okunurluğu
"herhalde yeter" diye ayarlanmaz: sekiz dosya tek reçeteden geçirilirken iki
tonlamanın beyaz ucu kapatıldı, böylece hiçbir dosyanın en parlak noktası
bağıl parlaklık 0,56'yı geçmiyor. `ServicePanels` içindeki perde oranları bu
ÖLÇÜLEN üst sınırdan türetildi (açık panel %15, kapalı %75, artı başlık ve
açıklama bantları). Yeni bir fotoğraf eklenirken reçete uygulanmazsa bu sınır
bozulur — reçetenin adımları lisans kaydında yazılıdır.

**Açık panelin perdesi mobilde %70'tir — yüzdeyle piksel aynı şey değil.**
Okunabilirlik bantları panelin YÜZDESİYLE ölçülür (üstte 2/5, altta 3/5);
metin bloğu ise PİKSELLE büyür. Masaüstünde panel 576px olduğu için açıklama
alt çeyrekte, bandın opak ucunda oturur. Mobilde (375px) aynı panel 243px'e
iner ve dört satırlık bir açıklama tek başına 112px tutar — yani iki bandın
%40 çizgisinde birleştiği, ikisinin de saydam olduğu dikişin üstüne düşer.
Ölçüm: perde %15'te gövde metninin kontrastı fotoğrafın en parlak noktasına
karşı **1,52:1**'e kadar iniyordu (AA sınırı 4,5:1). Mobilde perde %70'e
çıkarıldı; aynı en kötü nokta sekiz panelde **5,76–6,66:1** aralığına, başlık
**11,66–12,60:1**'e döndü. Masaüstü değeri (`md:opacity-15`) değişmedi.

Buradaki genel ders: **bir örtü yüzdeyle, üstündeki metin pikselle ölçülüyorsa
kontrast panel yüksekliğinin fonksiyonudur.** Panel kısaldıkça metin bandın
saydam ucuna kayar. 243px'lik bir panelde metnin kaplamadığı "orta" zaten
yoktur — fotoğraf orada resim değil dokudur, perdenin yükselmesi bir kayıp
değildir. Panel yüksekliği veya açıklama uzunluğu ileride değişirse bu ölçüm
tekrarlanmalıdır.

## 38. Pazaryeri butonlarında resmî logo YOK — aranıp bulunmadığı için

`MarketplaceSection` pazaryerlerini **metin butonuyla** gösterir ("Amazon
mağazamıza git"). Bu bir üşengeçlik değil, aranıp belgelenmiş bir sonuçtur;
karar §9'a dayandırılmadan önce resmî kaynaklar tarandı (Ağustos 2026).

**Amazon — logo bu kullanımda AÇIKÇA YASAK.** Amazon Ads'in marka kullanım
politikası ([advertising.amazon.com/resources/ad-policy/brand-usage][amz])
şunu yazar: *"The Amazon and Smile logos are not permitted in third-party
advertising by vendors and sellers linking in to Amazon."* Bizim durumumuz
tam olarak budur — kendi Amazon mağazamıza bağlanan bir satıcı bağlantısı.
Politikanın izin verdiği tek istisna, Amazon'un **birden çok perakendeciyle
birlikte ve bağlantısız** bir dizide gösterilmesidir; bizimki o değil.

İzinli alternatif "Available at Amazon" rozetidir ve resmî onay gerektirmez;
ama varlığın kendisi Amazon'un marka portalından (Brand Registry kaydı
üzerinden) alınır — üçüncü bir siteden indirilemez, yeniden çizilemez, rengi
ve oranı değiştirilemez, asgari boyut kuralı vardır (yığılmış 90px, yatay
140px @1x). İki nedenle kullanılmadı: (1) dosyayı meşru biçimde ancak
işletmenin kendi satıcı hesabı temin edebilir, (2) rozet "bu ürün Amazon'da
mevcuttur" diyen bir **bulunabilirlik iddiasıdır** ve §20'nin doğrulanmamış
iddia yasağının alanına girer.

**Hepsiburada — herkese açık resmî kaynak bulunamadı.**
`kurumsal.hepsiburada.com` (Basın Odası dâhil) otomatik isteğe **HTTP 403**
döndü; satıcı akademisindeki "Logo Kullanımı" eğitimi giriş duvarının
arkasında ve içerik döndürmedi. Üçüncü taraf logo bankaları (logokit,
Wikimedia Commons) vardır ama **kullanılmadı**: bir logoyu rastgele bir
siteden indirmek kullanım kurallarına uygunluğu kanıtlamaz.

**Sonuç: metin butonu.** Pazaryerinin adı butonda açıkça yazar; ayrıca bir
EYLEM söyler ("… mağazamıza git"), yalnız bir ad değildir. Yanındaki
dekoratif çizgi marka renginin kendisi değil ona yakın bir tondur ve
`aria-hidden`dır — kanal **yalnız renkle** anlatılmaz (§9, §15). Tanınmayan
bir pazaryerinde renk uydurulmaz, nötr bağlantı rengine düşülür.

Ölçüldü (375px ve 1440px, aynı değerler — buton renkleri viewport'tan
bağımsız): buton metni zemininde **16,69:1**; butonun kendisi bölüm zemininden
**dolguyla değil kenarlıkla** ayrılır ve o kenarlık **7,69:1**'dir (WCAG 1.4.11
metin dışı sınır için 3:1 ister). Dokunma hedefi 50px.

İşletme ileride resmî varlıkları kendi hesabından temin ederse bu karar
yeniden açılabilir; o iş bir varlık temini ve onay işidir, bir kodlama işi
değildir.

[amz]: https://advertising.amazon.com/resources/ad-policy/brand-usage
