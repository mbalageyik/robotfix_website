# Robot Fix

Gaziantep merkezli robot süpürge teknik servisi, bakım/onarım ve yedek parça satışı yapan
Robot Fix'in web sitesi.

## Bağlam

- **Marka, iş modeli, içerik ve doğruluk kuralları:** [`ROBOT_FIX_PROJE_BILGI_DOSYASI.md`](./ROBOT_FIX_PROJE_BILGI_DOSYASI.md) — birincil kaynak
- **Ajan kuralları:** [`CLAUDE.md`](./CLAUDE.md)
- **Yol haritası:** `~/.claude/plans/rol-robot-fix-web-quizzical-pumpkin.md`

## Stack

| Katman    | Seçim                                                     |
| --------- | --------------------------------------------------------- |
| Framework | Next.js 16 App Router + React 19                          |
| Dil       | TypeScript (strict)                                       |
| Stil      | Tailwind v4                                               |
| Veri      | Supabase Postgres + **elle yazılan SQL migrasyonları**    |
| Görsel    | Supabase Storage + `next/image`                           |
| Auth      | Supabase Auth (tek yönetici)                              |
| 3D        | Three.js / React Three Fiber _(Faz 6 — henüz başlamadı)_  |
| Test      | Vitest                                                    |
| Deploy    | Vercel _(Faz 7)_                                          |

**ORM YOKTUR.** Şema `supabase/migrations/` altındaki numaralı SQL dosyalarıyla,
sorgular `lib/data/` içinde Supabase istemcisiyle yazılır. Kararın gerekçesi
[`CLAUDE.md`](./CLAUDE.md) mimari tablosunda; TypeScript tipleri şemadan üretilir
(`npm run db:types`), elle yazılmaz.

Node ≥ 22 (bkz. `.nvmrc`), paket yöneticisi **npm**.

## Kurulum

Sıfırdan çalışan bir yerel ortam için **dört adım**. Ayrıntı, portlar ve sorun
giderme: [`docs/supabase-setup.md`](./docs/supabase-setup.md).

```bash
nvm use                      # .nvmrc → Node 22
npm install

# 1. Yerel Supabase yığınını başlat (Docker Desktop AÇIK olmalı)
supabase start               # ya da: npm run db:start

# 2. Yığının bastığı değerleri .env.local'e yaz
cp .env.example .env.local
supabase status -o env       # API_URL, ANON_KEY, SERVICE_ROLE_KEY, DB_URL
#   API_URL          → NEXT_PUBLIC_SUPABASE_URL
#   ANON_KEY         → NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SERVICE_ROLE_KEY → SUPABASE_SERVICE_ROLE_KEY
#   DB_URL           → SUPABASE_DB_URL

# 3. Şemayı ve tohum verisini yükle
npm run db:reset             # migrasyonlar + supabase/seed.sql

# 4. Çalıştır
npm run dev                  # http://localhost:3434
```

Doğrulama: <http://localhost:3434/veri-kontrol> veri katmanının ne döndürdüğünü
döker. "YAPILANDIRILMADI" yazıyorsa 2. adım eksiktir ve dev sunucusu **yeniden
başlatılmalıdır** — `NEXT_PUBLIC_*` değişkenleri süreç başlarken okunur.

> **Portlar bu projeye özeldir ve bilinçlidir.** Supabase `5434x`'te
> (`supabase/config.toml`), dev sunucusu **`3434`**'te (`package.json`).
> Varsayılanlar (`5432x` ve `3000`) kullanılmıyor çünkü bu makinede başka
> projeler onları tutuyor. Next.js meşgul bir portu sessizce bir sonrakine
> kaydırır: `3000`'de başka bir uygulama varken `npm run dev` `3001`'e geçer ve
> alışkanlıkla `localhost:3000` açan kişi **başka bir projeye** bakarak Robot
> Fix'te hata arar. Sabit port bu sessiz karışıklığı ortadan kaldırır.

Supabase çalışmıyorken site ayakta kalır: katalog "yapılandırılmadı" durumu
döndürür, `/admin/giris` ise giriş formu yerine eksiğin ne olduğunu yazar —
"parola hatalı" gibi yanıltıcı bir mesaj vermez.

## Komutlar

| Komut                 | İş                                                    |
| --------------------- | ----------------------------------------------------- |
| `npm run dev`         | Geliştirme sunucusu                                   |
| `npm run build`       | Üretim derlemesi                                      |
| `npm run lint`        | ESLint                                                |
| `npm run typecheck`   | `tsc --noEmit`                                        |
| `npm run test`        | Vitest — **veritabanı gerekmez**                      |
| `npm run format`      | Prettier ile biçimlendirme                            |
| `npm run db:start`    | Yerel Supabase yığınını başlat                        |
| `npm run db:stop`     | Yığını durdur                                         |
| `npm run db:reset`    | Veritabanını sil, migrasyonları + tohumu yükle        |
| `npm run db:types`    | Şemadan TypeScript tiplerini üret (dosyayı üzerine yazar) |
| `npm run test:db`     | Veritabanı + RLS testleri — **yerel Supabase gerekir** |

> `db:reset` veritabanını **siler**. Uzak/üretim projesinde asla çalıştırılmaz;
> orada `supabase db push` kullanılır (gerekçe: `docs/supabase-setup.md` § 2.4).

Her fazın sonunda dördü de geçmelidir:

```bash
npm run build && npm run lint && npm run typecheck && npm run test
```

## Fazlar

Durum sütunu **git geçmişindeki faz commit'lerine** dayanır, tahmine değil.

| Faz | Kapsam                                                  | Durum        |
| --- | ------------------------------------------------------- | ------------ |
| 0   | Proje iskeleti, tooling, git                            | ✅           |
| 1   | Tasarım sistemi + WhatsApp dönüşüm çekirdeği            | ✅           |
| 2   | Veri katmanı (SQL migrasyonlar, RLS, demo tohum)        | ✅           |
| 3   | Yönetim paneli (auth, ürün formu, görsel yükleme)       | ✅           |
| 4   | Genel katalog yüzeyleri (ürün/kategori/marka/hizmet)    | ✅           |
| 5   | Sanat yönü + sinematik kabuk                            | 🚧 sürüyor   |
| 6   | 3D katmanı                                              | ⬜           |
| 7   | QA, yasal, analitik, yayın                              | ⬜           |

## İçerik doğruluğu

Bu projede ürün, fiyat, stok, uyumluluk, garanti, teslimat, istatistik ve pazaryeri
bağlantısı **uydurulmaz**. Doğrulanmamış her nokta kodda `// TODO(business):` ile
işaretlenir. Tasarım için gereken örnek veriler `[ÖRNEK]` önekiyle ve `is_demo`
bayrağıyla tutulur; üretimde görünmez. Ayrıntı: bilgi dosyası §20.
