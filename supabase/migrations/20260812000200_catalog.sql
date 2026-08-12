-- Robot Fix — Faz 2 · 02: katalog tabloları
--
-- KRİTİK AYRIM (bilgi dosyası §6): "marka" iki anlamda geçer —
--   (a) ürünü üreten/satan marka  → products.brand_id
--   (b) ürünün uyumlu olduğu robot süpürge markası/modeli → device_models
-- İkisi de AYNI `brands` tablosunu kullanır. "Roborock" hem bir parça markası
-- hem de bir cihaz markası olabilir; iki ayrı tablo açmak veriyi bölerdi.

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or length(description) <= 2000),
  logo_path text,
  display_order integer not null default 0,
  status public.publication_status not null default 'draft',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

/*
  Bilgi dosyası §10: marka listesi "yetkili servis veya resmî marka ortaklığı
  anlamına gelmez". Bu yüzden şemada yetkili servis / ortaklık / sertifika
  alanı BİLİNÇLİ OLARAK YOKTUR — olmayan bir alan yanlışlıkla doldurulamaz.
*/
comment on table public.brands is
  'Markalar. Hem ürün markası hem cihaz markası olarak kullanılır. Yetkili servis/ortaklık alanı içermez (§10).';

create index if not exists brands_status_order_idx
  on public.brands (status, display_order, name);

-- ---------------------------------------------------------------------------
-- categories (opsiyonel tek seviye hiyerarşi)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or length(description) <= 2000),
  parent_id uuid references public.categories (id) on delete set null,
  display_order integer not null default 0,
  status public.publication_status not null default 'draft',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Kategori kendi üstü olamaz. Daha derin döngüler uygulama katmanında
  -- engellenir; tek seviye hiyerarşide bu kısıt pratikte yeterlidir.
  constraint categories_no_self_parent check (parent_id is null or parent_id <> id)
);

create index if not exists categories_parent_idx on public.categories (parent_id);
create index if not exists categories_status_order_idx
  on public.categories (status, display_order, name);

-- ---------------------------------------------------------------------------
-- device_models — uyumluluk hedefi
-- ---------------------------------------------------------------------------
create table if not exists public.device_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  notes text check (notes is null or length(notes) <= 1000),
  status public.publication_status not null default 'draft',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Slug marka içinde benzersiz: "Xiaomi S10" ve "Roborock S10" birlikte yaşar.
  constraint device_models_brand_slug_key unique (brand_id, slug)
);

comment on table public.device_models is
  'Robot süpürge model listesi. Ürünlerin UYUMLU OLDUĞU cihazlar (§6).';

create index if not exists device_models_brand_idx on public.device_models (brand_id, name);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  name text not null check (length(btrim(name)) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  brand_id uuid references public.brands (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,

  -- Ürün/stok kodu. Doldurulduğunda benzersiz olmalı, ama zorunlu değil.
  sku text check (sku is null or length(btrim(sku)) between 1 and 64),

  short_description text check (short_description is null or length(short_description) <= 400),
  long_description text check (long_description is null or length(long_description) <= 20000),

  /*
    FİYAT — bilgi dosyası §6.
    `price_minor`: kuruş cinsinden TAM SAYI. numeric yerine bigint tercih edildi;
    gerekçe docs/design-decisions.md'de.
    NULL = "Fiyat için iletişime geçin". 0 ile NULL asla aynı şey değildir:
    `> 0` kısıtı sıfır fiyatın yanlışlıkla girilmesini engeller.
  */
  price_minor bigint check (price_minor is null or price_minor > 0),
  compare_at_price_minor bigint check (compare_at_price_minor is null or compare_at_price_minor > 0),
  currency char(3) not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),

  availability public.availability_status not null default 'on_order',

  /*
    Orijinal mi uyumlu mu. NULL = DOĞRULANMADI (§20). Varsayılan bilinçli olarak
    NULL'dır — "uyumlu" varsaymak yanlış beyan olurdu.
  */
  is_original boolean,

  box_contents text check (box_contents is null or length(box_contents) <= 2000),
  installation_notes text check (installation_notes is null or length(installation_notes) <= 4000),

  is_featured boolean not null default false,
  display_order integer not null default 0,

  status public.publication_status not null default 'draft',
  is_demo boolean not null default false,

  seo_title text check (seo_title is null or length(seo_title) <= 70),
  seo_description text check (seo_description is null or length(seo_description) <= 200),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  /*
    İndirim gösterimi gerçek olmalı (§6): eski fiyat yalnız güncel fiyat VARSA ve
    ondan BÜYÜKSE anlamlıdır. Yanıltıcı indirim şemada engellenir.
  */
  constraint products_compare_at_requires_price check (
    compare_at_price_minor is null
    or (price_minor is not null and compare_at_price_minor > price_minor)
  )
);

-- SKU benzersizliği yalnız dolu değerlerde (kısmi indeks).
create unique index if not exists products_sku_key
  on public.products (sku) where sku is not null;

create index if not exists products_status_idx on public.products (status);
create index if not exists products_brand_idx on public.products (brand_id);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_availability_idx on public.products (availability);
-- Öne çıkanlar sorgusu: yalnız aktif + öne çıkan satırları taşıyan dar indeks.
create index if not exists products_featured_idx
  on public.products (display_order, name) where status = 'active' and is_featured;
-- Katalog listeleme sırası.
create index if not exists products_active_order_idx
  on public.products (display_order, name) where status = 'active';

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- Supabase Storage yolu (bucket içi). Tam URL kodda üretilir; taşınabilirlik için.
  storage_path text not null check (length(btrim(storage_path)) between 1 and 500),
  -- Erişilebilirlik: anlamlı görselde alt zorunlu, dekoratifte boş dize.
  alt_text text not null default '' check (length(alt_text) <= 300),
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ürün başına EN FAZLA bir ana görsel.
create unique index if not exists product_images_one_primary_idx
  on public.product_images (product_id) where is_primary;

create index if not exists product_images_product_idx
  on public.product_images (product_id, display_order);

-- ---------------------------------------------------------------------------
-- product_specs — teknik özellikler
-- ---------------------------------------------------------------------------
/*
  Serbest JSON yerine TABLO tercih edildi. Gerekçe: özellikler yönetim panelinde
  tek tek düzenlenecek, sıralanacak ve ileride "şu özelliğe göre filtrele"
  sorgusuna açık olmalı. JSONB'de sıra, tip ve NOT NULL garantisi uygulama
  katmanına düşerdi — bu, "veri bütünlüğünü uygulamaya bırakma" kuralına aykırı.
*/
create table if not exists public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null check (length(btrim(label)) between 1 and 120),
  value text not null check (length(btrim(value)) between 1 and 500),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_specs_label_key unique (product_id, label)
);

create index if not exists product_specs_product_idx
  on public.product_specs (product_id, display_order);

-- ---------------------------------------------------------------------------
-- product_compatibility — ürün × cihaz modeli
-- ---------------------------------------------------------------------------
create table if not exists public.product_compatibility (
  product_id uuid not null references public.products (id) on delete cascade,
  device_model_id uuid not null references public.device_models (id) on delete cascade,
  /*
    Uyumluluk DOĞRULANMIŞ bir iddiadır (§20). Kaynağı kaydediyoruz ki
    "kim söyledi" sorusu cevaplanabilsin. NULL = doğrulanmamış.
  */
  verified_note text check (verified_note is null or length(verified_note) <= 300),
  created_at timestamptz not null default now(),
  primary key (product_id, device_model_id)
);

create index if not exists product_compatibility_model_idx
  on public.product_compatibility (device_model_id);

-- ---------------------------------------------------------------------------
-- product_marketplace_links
-- ---------------------------------------------------------------------------
create table if not exists public.product_marketplace_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  marketplace public.marketplace not null,
  -- 'other' seçildiyse görünen ad zorunlu; aksi hâlde enum adı kullanılır.
  custom_label text check (custom_label is null or length(btrim(custom_label)) between 1 and 60),
  url text not null check (url ~* '^https://'),
  link_target public.marketplace_link_target not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_marketplace_links_unique unique (product_id, marketplace),
  constraint product_marketplace_links_other_needs_label check (
    marketplace <> 'other' or custom_label is not null
  )
);

comment on table public.product_marketplace_links is
  'Ürün bazlı pazaryeri bağlantıları (§9). Bağlantı yoksa satır yoktur — buton hiç gösterilmez.';

create index if not exists product_marketplace_links_product_idx
  on public.product_marketplace_links (product_id, display_order);

-- ---------------------------------------------------------------------------
-- related_products — açık ilişki
-- ---------------------------------------------------------------------------
/*
  Bilgi dosyası §7 "İlgili ürünler" istiyor. İki strateji birlikte kullanılır:
    1. Bu tablo: yöneticinin ELLE seçtiği ilişkiler (öncelikli).
    2. Tablo boşsa veri katmanı aynı kategori + ortak uyumlu model üzerinden
       otomatik türetir (bkz. lib/data/products.ts).
  Elle seçim her zaman kazanır; otomatik türetme yalnız boşluğu doldurur.
*/
create table if not exists public.related_products (
  product_id uuid not null references public.products (id) on delete cascade,
  related_product_id uuid not null references public.products (id) on delete cascade,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (product_id, related_product_id),
  constraint related_products_not_self check (product_id <> related_product_id)
);

-- Birincil anahtar yalnız (product_id, ...) yönünü indeksler. Ters yön indekssiz
-- kalırsa bir ürün silindiğinde/arşivlendiğinde cascade bu tabloyu tarar ve
-- "bu ürüne kim bağlı" sorgusu sıralı okuma yapar.
create index if not exists related_products_related_idx
  on public.related_products (related_product_id);

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text check (short_description is null or length(short_description) <= 400),
  long_description text check (long_description is null or length(long_description) <= 20000),
  -- components/ui/icons.tsx içindeki simge anahtarı; serbest metin değil, kodda eşlenir.
  icon_key text check (icon_key is null or length(btrim(icon_key)) between 1 and 60),
  display_order integer not null default 0,
  status public.publication_status not null default 'draft',
  is_demo boolean not null default false,
  seo_title text check (seo_title is null or length(seo_title) <= 70),
  seo_description text check (seo_description is null or length(seo_description) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_status_order_idx
  on public.services (status, display_order, name);

-- ---------------------------------------------------------------------------
-- site_settings — anahtar/değer
-- ---------------------------------------------------------------------------
/*
  Anahtar-değer yapısı seçildi (tek satırlık geniş tablo yerine): yeni bir ayar
  eklemek MİGRASYON GEREKTİRMEZ, yalnız satır eklenir. Faz 3 paneli anahtarları
  listeler.

  SIR SAKLANMAZ. Bu tablo anonim role tamamen OKUNABİLİR olduğundan yalnız
  herkese açık işletme bilgisi barındırır (telefon, adres, çalışma saati,
  mağaza bağlantıları). API anahtarı, parola veya token buraya yazılamaz.
*/
create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value text,
  description text,
  updated_at timestamptz not null default now()
);

comment on table public.site_settings is
  'Herkese açık işletme ayarları. SIR SAKLANMAZ — anonim role tamamen okunabilir.';

-- ---------------------------------------------------------------------------
-- updated_at tetikleyicileri
-- ---------------------------------------------------------------------------
select public.attach_updated_at('public.brands');
select public.attach_updated_at('public.categories');
select public.attach_updated_at('public.device_models');
select public.attach_updated_at('public.products');
select public.attach_updated_at('public.product_images');
select public.attach_updated_at('public.product_specs');
select public.attach_updated_at('public.product_marketplace_links');
select public.attach_updated_at('public.services');
select public.attach_updated_at('public.site_settings');
