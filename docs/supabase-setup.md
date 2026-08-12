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

Yeni migrasyon eklerken:

```bash
supabase migration new aciklayici_ad
```

### 1.6 Demo veriyi geçici olarak görünür yapmak

Tohum verisinin tamamı `status = 'draft'`'tır; RLS gereği anonim istemci **hiçbirini
göremez**. Katalog arayüzünü gerçek veriyle denemek için:

```bash
# Görünür yap
psql "$SUPABASE_DB_URL" -f supabase/dev_activate_demo.sql

# İşiniz bitince MUTLAKA geri al
psql "$SUPABASE_DB_URL" -f supabase/dev_deactivate_demo.sql
```

`psql` kurulu değilse konteyner üzerinden:

```bash
docker exec -i supabase_db_robotfix_son_durum psql -U postgres -d postgres \
  < supabase/dev_activate_demo.sql
```

`dev_activate_demo.sql` **üretimde çalışmaz**: yerel yığın olup olmadığını ve
veritabanında gerçek (demo olmayan) katalog satırı bulunup bulunmadığını denetler,
ikisinden biri tutmazsa işlemi geri alır.

> Demo satırlarını `active` bırakmayın. `npm run test:db` içindeki bir test bunu yakalar
> ve kırılır — kasıtlıdır.

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

Sonra `http://localhost:3000/veri-kontrol` adresini açın. Bu sayfa veri katmanının ne
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

| Değişken                        | Ortam                    |
| ------------------------------- | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Production (+ Preview)   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production (+ Preview)   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Production (+ Preview)   |
| `NEXT_PUBLIC_SITE_URL`          | Production               |

`NEXT_PUBLIC_SHOW_DEMO_PRODUCTS` **üretimde tanımlanmaz**. Tanımlansa bile kod
`NODE_ENV=production` altında yok sayar, ama tanımlamamak daha nettir.

### 2.7 Yayın öncesi kontrol listesi

- [ ] `supabase db push` uygulandı, `supabase migration list` uzak/yerel eşit.
- [ ] Üretim veritabanında `is_demo = true` satır **yok**
      (`select count(*) from products where is_demo;` → 0).
- [ ] `admin_users` tablosunda yalnız gerçek yönetici var.
- [ ] `service_role` anahtarı yalnız sunucu tarafı ortam değişkeninde.
- [ ] `site_settings` tablosunda gerçek işletme bilgisi girildi (WhatsApp numarası,
      adres, çalışma saatleri). Girilmeyen alanlar arayüzde **gizlenir**, uydurulmaz.

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
