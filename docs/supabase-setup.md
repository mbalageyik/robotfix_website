# Supabase kurulumu

Bu dosya iki ayrı kurulumu anlatır:

1. **Yerel geliştirme** — kendi bilgisayarınızda, Docker üzerinde çalışan Supabase.
2. **Uzak proje** — supabase.com üzerinde barındırılan gerçek proje (yayın için).

> **Panel adları hakkında dürüst uyarı:** Supabase paneli sık değişir. Aşağıda menü
> adlarını yazarken emin olduğum yerleri yazdım; emin olmadığım yerde **ne aradığınızı**
> tarif ettim, uydurma bir ekran adı vermedim. Menü adı tutmuyorsa aradığınız değerin
> **ne olduğuna** bakın, adına değil.

> **Anahtar değerleri bu dosyada YOKTUR ve yazılmamalıdır.** Burada yalnız hangi değerin
> nereden alınacağı tarif edilir. `.env.local` dosyası `.gitignore` içindedir ve asla
> commit edilmez.

---

## Bölüm 1 — Yerel geliştirme

### 1.1 Gereksinimler

| Araç          | Neden                                   | Kontrol            |
| ------------- | --------------------------------------- | ------------------ |
| Docker Desktop| Supabase yerelde konteynerlerde çalışır | `docker ps`        |
| Supabase CLI  | Yığını yönetir, migrasyon uygular       | `supabase --version` |
| Node 22+      | Projenin kendisi                        | `node --version`   |

Docker Desktop **açık olmalıdır**; kapalıysa `supabase start` anlaşılmaz bir hata verir.

### 1.2 Portlar — neden 5434x

Bu projenin portları `supabase/config.toml` içinde **bilinçli olarak** kaydırılmıştır:

| Servis            | Port    |
| ----------------- | ------- |
| API (Kong)        | `54341` |
| Postgres          | `54342` |
| Studio            | `54343` |
| Inbucket (e-posta)| `54344` |

Supabase'in varsayılanı `5432x`'tir. Aynı makinede başka bir Supabase projesi
(`vena-hospital-portal`) varsayılan portlarda çalıştığı için bu proje kaydırıldı.
**Bu ayar değiştirilmemelidir** — değiştirilirse iki proje birbirinin veritabanına
bağlanabilir. Gerekçe: [`design-decisions.md`](./design-decisions.md).

### 1.3 Yığını başlat

```bash
supabase start
```

İlk çalıştırma imajları indirir (birkaç dakika). Bittiğinde CLI bir özet basar.

### 1.4 Değerleri `.env.local` dosyasına yaz

`supabase status` komutu yerel değerleri listeler. Makine tarafından okunabilir biçim:

```bash
supabase status -o env
```

Çıktıdaki alanlardan **bu projede kullanılanlar**:

| `supabase status` alanı | `.env.local` değişkeni          | Ne işe yarar                          |
| ----------------------- | ------------------------------- | ------------------------------------- |
| `API_URL`               | `NEXT_PUBLIC_SUPABASE_URL`      | İstemcinin bağlanacağı adres          |
| `ANON_KEY`              | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonim okuma anahtarı (RLS'e tabidir) |
| `SERVICE_ROLE_KEY`      | `SUPABASE_SERVICE_ROLE_KEY`     | **RLS'i ATLAR** — yalnız sunucuda     |
| `DB_URL`                | `SUPABASE_DB_URL`               | Doğrudan psql bağlantısı (testler)    |

Başlangıç için şablonu kopyalayın:

```bash
cp .env.example .env.local
```

Sonra yukarıdaki dört değeri doldurun.

> **Yereldeki anahtarlar sır değildir.** Supabase CLI her kurulumda aynı, herkesçe bilinen
> demo anahtarlarını üretir. Yine de `.env.local` commit edilmez — alışkanlık üretimde
> hata yapmamak için önemlidir.

Demo veriyi arayüzde görmek isterseniz (aşağıda 1.6'ya bakınız):

```
NEXT_PUBLIC_SHOW_DEMO_PRODUCTS=true
```

Bu bayrak `NODE_ENV=production` iken **kodda yok sayılır**; üretimde açık kalsa bile
etkisizdir (`lib/supabase/env.ts`).

### 1.5 Migrasyonları ve tohum verisini uygula

```bash
supabase db reset
```

Bu tek komut sırayla: veritabanını **siler**, `supabase/migrations/` altındaki dosyaları
sırayla çalıştırır, sonra `supabase/seed.sql` dosyasını yükler.

Migrasyonlar (uygulanma sırası dosya adına göredir):

| Dosya                        | İçerik                                            |
| ---------------------------- | ------------------------------------------------- |
| `..._foundation.sql`         | Enum'lar, `slugify()`, `updated_at`, yetki modeli  |
| `..._catalog.sql`            | Katalog tabloları ve kısıtları                     |
| `..._rls.sql`                | Row Level Security politikaları ve grant'ler       |
| `..._storage.sql`            | `product-images` kovası ve dosya politikaları      |
| `..._admin_role.sql`         | `admin_users.role` — ileriye dönük, yetki kararında kullanılmaz |

Migrasyonların hepsi **tekrar çalıştırılabilir** (idempotent) yazılmıştır: aynı dosya
ikinci kez uygulanırsa hata vermez, mevcut nesneyi atlar. Bunun doğrulaması, canlıya
çıkmadan yapılabilecek en ucuz güvence:

```bash
# Yerel veriye DOKUNMADAN, gölge veritabanında sıfırdan uygular ve şema farkına bakar.
supabase db diff --schema public   # beklenen çıktı: "No schema changes found"
```

Yeni migrasyon eklerken:

```bash
supabase migration new aciklayici_ad
```

### 1.6 Demo veriyi geçici olarak görünür yapmak

Tohum verisinin tamamı `status = 'draft'`'tır; RLS gereği anonim istemci **hiçbirini
göremez**. Katalog arayüzünü gerçek veriyle denemek için:

```bash
```bash
# Görünür yap
npm run db:demo:on

# Yer tutucu görselleri Storage'a yükle (aşağıdaki nota bakınız)
npm run db:demo:images

# İşiniz bitince MUTLAKA geri al
npm run db:demo:off
```

Bu üç komut `supabase/` altındaki betikleri çağırır; `psql` kurulu olmasa da
çalışırlar (konteyner üzerinden giderler).

**Görsel adımı neden ayrı.** `seed.sql` demo ürünler için `product_images`
satırları ekler ama Storage'a **dosya koymaz** — o satırların amacı veri
katmanının görsel mantığını (ana görsel seçimi, `display_order`) gerçek
satırlarla test edilebilir kılmaktı. Demo ürünler yayına alınınca bu yollar 404
döner, `next/image` 400 verir ve kartlarda **siyah boş kutu** görünür.
`db:demo:images` `supabase/demo-assets/` altındaki altı dosyayı yükleyerek bu
boşluğu kapatır. Görseller ürün fotoğrafı değil, kadrajında `[ÖRNEK]` yazan
şematik çizimlerdir: gerçek bir fotoğrafı taklit eden yer tutucu, demo olduğu
unutulduğu anda sahte bir ürün görseline dönüşürdü.

`supabase db reset` Storage nesnelerini de siler; sıfırlamadan sonra
`db:demo:images` yeniden çalıştırılır.

`dev_activate_demo.sql` **üretimde çalışmaz**. İki bağımsız katmanı vardır:
(1) yığının JWT sırrı Supabase CLI'nin bilinen yerel demo değeri mi,
(2) `admin_users` içinde `.local` olmayan bir yönetici hesabı var mı — varsa
burası gerçek bir kurulumdur ve reddedilir. Üçüncü sınır betiğin kendisindedir:
her `update` satırı `where is_demo` ile sınırlıdır, demo olmayan bir satıra
dokunamaz.

> **Eski ölçüt neden değişti.** İkinci katman önceden "demo olmayan tek bir
> katalog satırı varsa reddet" diyordu. Geliştirici panelden tek bir test ürünü
> oluşturur oluşturmaz betik kendi geliştirme veritabanında da reddetmeye
> başlıyordu — panel tam olarak ürün oluşturmak için varken. Ölçüt "veritabanı
> dolu mu"dan "burası gerçek bir kurulum mu"ya çevrildi.

> Demo satırlarını `active` bırakmayın. `npm run test:db` içindeki bir test bunu yakalar
> ve kırılır — kasıtlıdır. Veritabanı testlerini çalıştırmadan önce
> `npm run db:demo:off` deyin.

Demo veriyi tümüyle silmek için: `npm run db:seed:clear`

### 1.7 Tipleri üret

Şema değiştiğinde TypeScript tipleri yeniden üretilmelidir:

```bash
npm run db:types
```

Bu, `lib/supabase/database.types.ts` dosyasını **üzerine yazar**. Dosya elle
düzenlenmez; `lib/data/types.ts` içindeki tiplerin tamamı ondan türer, böylece şema
ile kod arasındaki uyumsuzluk `npm run typecheck` ile yakalanır.

### 1.8 Doğrulama

```bash
npm run dev
```

Sonra `http://localhost:3434/veri-kontrol` adresini açın. Bu sayfa veri katmanının ne
döndürdüğünü döker: yapılandırma durumu, sorgu sonuçları, hata yolu ve ₺ glif kontrolü.
Üretim navigasyonunda yer almaz ve indekslenmez.

Diğer komutlar:

```bash
npm run test      # birim testleri (veritabanı gerekmez)
npm run test:db   # veritabanı + PostgREST testleri (yerel Supabase GEREKİR)
supabase stop     # yığını durdur
```

---

## Bölüm 2 — Uzak proje (yayın)

> Bu bölüm **henüz uygulanmadı**. Aşağıdaki adımlar yayın anında izlenecek sırayı
> tarif eder. Üretim veritabanına demo veri **hiçbir koşulda** yüklenmez.

### 2.1 Proje oluştur

1. [supabase.com](https://supabase.com) hesabıyla panele girin.
2. Yeni bir proje oluşturun. Sizden istenecekler:
   - **Proje adı** — serbest.
   - **Veritabanı parolası** — güçlü bir parola üretin ve **parola yöneticisine kaydedin**.
     Bu parola sonradan gösterilmez; kaybedilirse sıfırlanması gerekir.
   - **Bölge (region)** — kullanıcılara en yakını. Türkiye için Avrupa bölgeleri
     (ör. Frankfurt) gecikmeyi düşürür.
3. Proje hazırlanması birkaç dakika sürer.

### 2.2 Bağlantı değerlerini al

Panelde **proje ayarları** (dişli simgesi / *Settings*) altında **API** ile ilgili bölümü
açın. Burada iki tür değer vardır:

| Aradığınız değer                        | Nereye yazılır                  |
| --------------------------------------- | ------------------------------- |
| Proje URL'i (`https://<ref>.supabase.co`)| `NEXT_PUBLIC_SUPABASE_URL`      |
| Anonim / public (yayınlanabilir) anahtar | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / gizli (secret) anahtar  | `SUPABASE_SERVICE_ROLE_KEY`     |

> Supabase yeni projelerde anahtarları `publishable` / `secret` olarak adlandırmaya
> geçti; eski projelerde `anon` / `service_role` görünür. **Kural değişmedi:**
> tarayıcıya gidebilen olan (publishable/anon) `NEXT_PUBLIC_*` değişkenine, gidemeyen
> olan (secret/service_role) `NEXT_PUBLIC` **olmayan** değişkene yazılır.

**`service_role` anahtarı RLS'i tamamen atlar.** Bu anahtar:

- asla `NEXT_PUBLIC_` önekiyle tanımlanmaz,
- asla istemci bileşenine sızmaz (`lib/supabase/admin-client.ts` `server-only` ile korunur),
- asla commit edilmez, ekran görüntüsüne girmez, sohbete yapıştırılmaz.

Veritabanı bağlantı dizesini (`SUPABASE_DB_URL`) panelde **veritabanı bağlantısı**
(*Database* / *Connect*) ile ilgili bölümde bulursunuz. Dizedeki parola alanı 2.1'de
kaydettiğiniz parolayla doldurulur.

### 2.2.1 Bağlantı havuzu (pooling) — neden gerekmiyor

> Kısa cevap: **bu projede sunucusuz bağlantı havuzu ayarı yapılmaz ve
> `SUPABASE_DB_URL` Vercel'e HİÇ girilmez.**

Sunucusuz ortamlarda Postgres'in klasik sorunu şudur: her lambda örneği kendi
bağlantısını açar, örnek sayısı arttıkça veritabanının bağlantı sınırı dolar. Çözüm
genelde pgbouncer gibi bir havuzlayıcıdan (Supabase'de *transaction pooler*) geçmektir.

**Bu proje o sorunun içine hiç girmez**, çünkü uygulama çalışma anında Postgres'e
tel protokolüyle bağlanmaz:

| Katman                         | Ne kullanır                                | Bağlantı türü        |
| ------------------------------ | ------------------------------------------ | -------------------- |
| Sayfalar, server action'lar    | `@supabase/supabase-js` + `@supabase/ssr`  | HTTPS → PostgREST    |
| Migrasyonlar (`supabase db push`) | Supabase CLI                            | Doğrudan Postgres    |
| Veritabanı testleri (`npm run test:db`) | `pg` (**devDependency**)          | Doğrudan Postgres, yalnız yerel |

PostgREST tarafında bağlantı havuzunu Supabase kendi yönetir; bizim ayarlayacağımız
bir şey yoktur. `pg` paketi `dependencies` içinde **değildir** — üretim paketine
girmez. Doğrulaması:

```bash
node -e "console.log(!!require('./package.json').dependencies.pg)"   # false olmalı
```

**İleride doğrudan bir Postgres istemcisi eklenirse** (ör. drizzle, kendi `pg`
havuzu) bu karar geçersiz olur ve şu ayrım zorunlu hâle gelir:

| Amaç                                    | Supabase'de hangi bağlantı | Port   | Neden                                                                 |
| --------------------------------------- | -------------------------- | ------ | --------------------------------------------------------------------- |
| Sunucusuz çalışma anı sorguları         | Transaction pooler         | `6543` | Kısa ömürlü lambda'lar için tek doğru seçenek                          |
| Migrasyon, DDL, `supabase db push`      | Doğrudan / session bağlantı| `5432` | Transaction pooler hazırlanmış ifadeleri ve oturum düzeyi özellikleri desteklemez |

Yani havuzlanmış bağlantı üzerinden **migrasyon çalıştırılmaz**; `SUPABASE_DB_URL`
bugün de yalnız migrasyon/test içindir ve doğrudan bağlantıyı gösterir.

### 2.3 Yerel projeyi uzak projeye bağla

```bash
supabase login
supabase link --project-ref <proje-ref>
```

`<proje-ref>`, proje URL'indeki alt alan adıdır: `https://<proje-ref>.supabase.co`.
Panelde proje ayarlarında da yazar.

### 2.4 Migrasyonları uzak veritabanına uygula

```bash
supabase db push
```

Bu komut yalnız `supabase/migrations/` altındaki **henüz uygulanmamış** dosyaları
çalıştırır.

> **`supabase db reset` uzak projede ÇALIŞTIRILMAZ.** O komut veritabanını siler ve
> tohum verisini yükler. Üretimde veri kaybı ve demo veri sızıntısı demektir.
> `db push` migrasyonu uygular, tohum yüklemez — doğru komut budur.

Uygulanan migrasyonları görmek için:

```bash
supabase migration list
```

### 2.5 Yönetici kullanıcısını tanımla

Yazma yetkisi `public.admin_users` tablosundaki satıra bağlıdır (`public.is_admin()`).
Bu tabloya **yalnız** RLS'i atlayan bir bağlantı (service_role veya panelin SQL editörü)
yazabilir — kendini yönetici yapan bir yol bilinçli olarak yoktur.

1. Supabase Auth üzerinden yönetici kullanıcıyı oluşturun (panelde kullanıcı yönetimi
   bölümünden davet/oluştur).

   > **Kullanıcıyı `auth.users`'a elle `insert` ile EKLEMEYİN.** Supabase Auth
   > (GoTrue) jeton sütunlarını (`confirmation_token`, `recovery_token`,
   > `email_change`, `email_change_token_new`, `email_change_token_current`,
   > `phone_change`, `phone_change_token`, `reauthentication_token`) NULL kabul
   > etmeyen alanlara okur. Şema NULL'a izin verse de NULL bırakılırsa giriş
   > **her zaman** başarısız olur ve kullanıcıya "Database error querying schema"
   > görünür — parola doğru olsa bile. Panelin kullanıcı oluşturma arayüzü bu
   > sütunları doğru doldurur. (Ayrıntı: `docs/design-decisions.md` §24.)

2. Panelin SQL çalıştırma ekranından kullanıcıyı allow-list'e ekleyin:

```sql
insert into public.admin_users (user_id, email)
select id, email from auth.users where email = 'yonetici@ornek.com';
```

3. Doğrulayın:

```sql
select * from public.admin_users;
```

### 2.6 Üretim ortam değişkenleri (Vercel)

Vercel proje ayarlarında ortam değişkeni olarak tanımlanır:

Vercel proje ayarlarında ortam değişkeni olarak tanımlananlar:

| Değişken                        | Ortam                    | Not                                          |
| ------------------------------- | ------------------------ | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Production (+ Preview)   | Tarayıcıya gider                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production (+ Preview)   | Tarayıcıya gider; RLS ile sınırlı            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Production (+ Preview)   | **Yalnız sunucu.** RLS'i atlar               |
| `NEXT_PUBLIC_SITE_URL`          | Production               | Kanonik adres; sondaki `/` olmadan           |
| `NEXT_PUBLIC_WHATSAPP_PHONE`    | —                        | İşletme numarası `site_settings`'ten okunur; env yalnız yedek |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | (isteğe bağlı)           | Boşsa analytics hiç yüklenmez                |

**Tanımlanmayanlar — ve nedenleri:**

| Değişken                       | Neden Vercel'de yok                                                        |
| ------------------------------ | -------------------------------------------------------------------------- |
| `SUPABASE_DB_URL`              | Çalışma anında doğrudan Postgres bağlantısı kurulmaz (bkz. 2.2.1). Girilirse gereksiz bir sır üretim ortamında durmuş olur. |
| `NEXTAUTH_SECRET` vb.          | Oturum imzalama Supabase Auth'un işidir; kendi oturum kodumuz yok.          |
| `NEXT_PUBLIC_SHOW_DEMO_PRODUCTS` | Üretimde **tanımlanmaz**. Tanımlansa bile kod `NODE_ENV=production` altında yok sayar, ama tanımlamamak daha nettir. |

### 2.7 Yayın öncesi kontrol listesi

- [ ] `supabase db push` uygulandı, `supabase migration list` uzak/yerel eşit.
- [ ] Üretim veritabanında `is_demo = true` satır **yok**
      (`select count(*) from products where is_demo;` → 0).
- [ ] `admin_users` tablosunda yalnız gerçek yönetici var.
- [ ] `service_role` anahtarı yalnız sunucu tarafı ortam değişkeninde.
- [ ] `site_settings` tablosunda gerçek işletme bilgisi girildi (WhatsApp numarası,
      adres, çalışma saatleri). Girilmeyen alanlar arayüzde **gizlenir**, uydurulmaz.

### 2.8 Şemanın bilerek kapsamadığı: kampanya / duyuru

Panelden yönetilen alanların tamamı şemada karşılanır — ürün, fiyat, stok, görsel,
marka, kategori, uyumlu model, seçki ve sırası, hizmet, ana sayfa bölümleri, WhatsApp
numarası ve şablonları, SEO alanları, yayın durumu. **Tek istisna kampanya/duyurudur:**
karşılığı olan bir tablo yoktur ve bu bilinçli bir tercihtir.

Gerekçe: bir duyurunun ne olduğu (üst şerit yazısı mı, süreli indirim mi, ana sayfada
bir bölüm mü) henüz kararlaştırılmadı. Karşılığı olmayan bir tablo açmak, arayüzde hiç
okunmayan ölü şema üretirdi; bilgi dosyası §20 gereği içeriğini uydurmak da yasaktır.

Karar verildiğinde eklenecek yol **zaten açıktır ve migrasyon gerektirmez**:
`site_settings` anahtar-değer tablosuna satır eklenir (ör. `announcement_text`,
`announcement_url`, `announcement_until`) ve `SITE_SETTING_KEYS` listesine yazılır —
`homepage_sections` anahtarının bugün yaptığının aynısı. Yalnız süreli/çok kayıtlı bir
kampanya modeli gerekirse ayrı tablo açmak anlamlı olur.

---

## Sorun giderme

| Belirti                                        | Sebep ve çözüm                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `/veri-kontrol` "YAPILANDIRILMADI" diyor        | `.env.local` eksik veya boş. 1.4'e dönün, sonra dev sunucusunu **yeniden başlatın**. |
| Sayfada hiç ürün yok, hata da yok               | Beklenen davranış: tohum verisi `draft`, RLS döndürmez. 1.6'ya bakınız.        |
| `supabase start` port hatası veriyor            | Başka bir Supabase yığını aynı portta. `supabase stop` veya diğer projeyi durdurun. |
| `npm run test:db` "gerçek katalog satırı" diyor | Veritabanında demo olmayan veri var. Testler o veritabanında çalıştırılmaz.     |
| RLS testi "demo satırı sızdırdı" diyor          | `dev_activate_demo.sql` çalıştırılmış ve geri alınmamış. 1.6'daki geri alma komutunu çalıştırın. |
| Tip hataları şema değişikliğinden sonra          | `npm run db:types` çalıştırılmadı.                                              |
| `TypeError: fetch failed` — `[site-settings]`, "Ürünler şu anda listelenemiyor", "Bu bölüm şu anda yüklenemedi" | **Üçü de tek nedendir:** yerel Supabase yığını kapalı (genelde Docker Desktop kapandığı için). Aşağıya bakınız. |

### Yerel Supabase kapalıyken ne olur

Veri okuyan her yüzey ayrı bir hata gösterir ama sebep tektir: `lib/supabase/public-client.ts`
üzerinden giden istek bağlantı kuramaz ve geriye yalnız `TypeError: fetch failed` kalır.
Sayfa istekleri de belirgin biçimde yavaşlar — bağlantı denemeleri istek süresine eklenir.

`npm run dev` bunu artık kendisi yakalar: `predev` kancası
[`scripts/dev-preflight.mjs`](../scripts/dev-preflight.mjs) çalışır, yığın kapalıysa
durmuş kapsayıcıları **veriye dokunmadan** yeniden başlatır. Docker'ın kendisi
kapalıysa dev sunucusu hiç başlamaz ve ne yapılacağını yazar.

Kontrolü tek başına çalıştırmak:

```bash
npm run db:preflight
```

Veritabanı olmadan yalnız arayüz üzerinde çalışmak için (site verisiz açılır):

```bash
SKIP_DEV_PREFLIGHT=1 npm run dev
```
