# Robot Fix

Gaziantep merkezli robot süpürge teknik servisi, bakım/onarım ve yedek parça satışı yapan
Robot Fix'in web sitesi.

## Bağlam

- **Marka, iş modeli, içerik ve doğruluk kuralları:** [`ROBOT_FIX_PROJE_BILGI_DOSYASI.md`](./ROBOT_FIX_PROJE_BILGI_DOSYASI.md) — birincil kaynak
- **Ajan kuralları:** [`CLAUDE.md`](./CLAUDE.md)
- **Yol haritası:** `~/.claude/plans/rol-robot-fix-web-quizzical-pumpkin.md`

## Stack

| Katman    | Seçim                                     |
| --------- | ----------------------------------------- |
| Framework | Next.js 16 App Router + React 19          |
| Dil       | TypeScript (strict)                       |
| Stil      | Tailwind v4                               |
| Veri      | Supabase Postgres + Drizzle ORM _(Faz 2)_ |
| Görsel    | Supabase Storage _(Faz 3)_                |
| Auth      | Supabase Auth _(Faz 3)_                   |
| 3D        | Three.js / React Three Fiber _(Faz 6)_    |
| Test      | Vitest                                    |
| Deploy    | Vercel _(Faz 7)_                          |

Node ≥ 22 (bkz. `.nvmrc`), paket yöneticisi **npm**.

## Kurulum

```bash
nvm use          # .nvmrc → Node 22
npm install
cp .env.example .env.local   # gerçek değerleri .env.local'e yaz (git'e girmez)
npm run dev      # http://localhost:3000
```

## Komutlar

| Komut               | İş                         |
| ------------------- | -------------------------- |
| `npm run dev`       | Geliştirme sunucusu        |
| `npm run build`     | Üretim derlemesi           |
| `npm run lint`      | ESLint                     |
| `npm run typecheck` | `tsc --noEmit`             |
| `npm run test`      | Vitest                     |
| `npm run format`    | Prettier ile biçimlendirme |

Her fazın sonunda dördü de geçmelidir:

```bash
npm run build && npm run lint && npm run typecheck && npm run test
```

## Fazlar

| Faz | Kapsam                                               | Durum |
| --- | ---------------------------------------------------- | ----- |
| 0   | Proje iskeleti, tooling, git                         | ✅    |
| 1   | Tasarım sistemi + WhatsApp dönüşüm çekirdeği         | ⬜    |
| 2   | Veri katmanı (Drizzle şema, migration, demo seed)    | ⬜    |
| 3   | Yönetim paneli (auth, ürün formu, görsel yükleme)    | ⬜    |
| 4   | Genel katalog yüzeyleri (ürün/kategori/marka/hizmet) | ⬜    |
| 5   | Sanat yönü + sinematik kabuk                         | ⬜    |
| 6   | 3D katmanı                                           | ⬜    |
| 7   | QA, yasal, analitik, yayın                           | ⬜    |

## İçerik doğruluğu

Bu projede ürün, fiyat, stok, uyumluluk, garanti, teslimat, istatistik ve pazaryeri
bağlantısı **uydurulmaz**. Doğrulanmamış her nokta kodda `// TODO(business):` ile
işaretlenir. Tasarım için gereken örnek veriler `[ÖRNEK]` önekiyle ve `is_demo`
bayrağıyla tutulur; üretimde görünmez. Ayrıntı: bilgi dosyası §20.
