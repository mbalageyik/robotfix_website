-- Robot Fix — Faz 2 · 03: Row Level Security
--
-- İLKE: varsayılan KAPALI. Her tabloda RLS açıktır ve politika yoksa hiçbir satır
-- görünmez. Anonim rol YALNIZCA status = 'active' satırları okuyabilir.
--
-- Bu, sorgu filtresiyle DEĞİL politikayla garanti edilir: veri katmanı
-- `.eq('status','active')` yazmayı unutsa bile draft/passive/archived satır
-- anonim istemciye dönmez.
--
-- Alt tablolar (görsel, özellik, uyumluluk, pazaryeri bağlantısı) kendi
-- durumlarını taşımaz; ürünün yayın durumunu MİRAS ALIRLAR — aksi hâlde
-- yayımlanmamış bir ürünün görselleri sızardı.

-- ---------------------------------------------------------------------------
-- Yardımcı: bir ürün anonime görünür mü
-- ---------------------------------------------------------------------------
create or replace function public.product_is_public(target_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.products
    where id = target_product_id and status = 'active'
  );
$$;

revoke all on function public.product_is_public(uuid) from public;
grant execute on function public.product_is_public(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- Tüm tablolarda RLS aç
-- ---------------------------------------------------------------------------
alter table public.brands                    enable row level security;
alter table public.categories                enable row level security;
alter table public.device_models             enable row level security;
alter table public.products                  enable row level security;
alter table public.product_images            enable row level security;
alter table public.product_specs             enable row level security;
alter table public.product_compatibility     enable row level security;
alter table public.product_marketplace_links enable row level security;
alter table public.related_products          enable row level security;
alter table public.services                  enable row level security;
alter table public.site_settings             enable row level security;

-- Tablo sahibi RLS'i atlamasın (Supabase'de postgres rolü sahiptir).
alter table public.brands                    force row level security;
alter table public.categories                force row level security;
alter table public.device_models             force row level security;
alter table public.products                  force row level security;
alter table public.product_images            force row level security;
alter table public.product_specs             force row level security;
alter table public.product_compatibility     force row level security;
alter table public.product_marketplace_links force row level security;
alter table public.related_products          force row level security;
alter table public.services                  force row level security;
alter table public.site_settings             force row level security;
-- admin_users da dâhil: yetki tablosu diğerlerinden GEVŞEK olamaz.
alter table public.admin_users               force row level security;

-- ---------------------------------------------------------------------------
-- Okuma politikaları — anon + authenticated
-- ---------------------------------------------------------------------------

-- Durum taşıyan tablolar: yalnız 'active'.
do $$
declare
  t text;
begin
  foreach t in array array['brands', 'categories', 'device_models', 'products', 'services']
  loop
    execute format('drop policy if exists "%s: herkes aktifleri okur" on public.%I', t, t);
    execute format(
      'create policy "%s: herkes aktifleri okur" on public.%I for select to anon, authenticated using (status = ''active'')',
      t, t
    );
  end loop;
end
$$;

-- Alt tablolar: bağlı olduğu ürün aktifse okunur.
do $$
declare
  t text;
begin
  foreach t in array array[
    'product_images', 'product_specs', 'product_compatibility', 'product_marketplace_links'
  ]
  loop
    execute format('drop policy if exists "%s: aktif ürününki okunur" on public.%I', t, t);
    execute format(
      'create policy "%s: aktif ürününki okunur" on public.%I for select to anon, authenticated using (public.product_is_public(product_id))',
      t, t
    );
  end loop;
end
$$;

-- İlgili ürünler: HER İKİ ürün de aktif olmalı — pasif ürüne köprü kurulmaz.
drop policy if exists "related_products: iki taraf da aktifse okunur" on public.related_products;
create policy "related_products: iki taraf da aktifse okunur"
  on public.related_products for select
  to anon, authenticated
  using (
    public.product_is_public(product_id)
    and public.product_is_public(related_product_id)
  );

-- Site ayarları: tamamı açık (sır saklanmaz — tablo yorumuna bakınız).
drop policy if exists "site_settings: herkes okur" on public.site_settings;
create policy "site_settings: herkes okur"
  on public.site_settings for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Yazma politikaları — YALNIZCA yönetici
-- ---------------------------------------------------------------------------
-- `to authenticated` + `public.is_admin()`. Anonim role hiçbir yazma politikası
-- verilmez; RLS varsayılanı gereği anon için insert/update/delete tamamen kapalıdır.
do $$
declare
  t text;
begin
  foreach t in array array[
    'brands', 'categories', 'device_models', 'products', 'product_images',
    'product_specs', 'product_compatibility', 'product_marketplace_links',
    'related_products', 'services', 'site_settings'
  ]
  loop
    execute format('drop policy if exists "%s: yönetici tam yetkili" on public.%I', t, t);
    execute format(
      'create policy "%s: yönetici tam yetkili" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Tablo düzeyi grant'ler
-- ---------------------------------------------------------------------------
-- RLS satır düzeyinde çalışır; tablo düzeyinde de yetki gerekir.
-- anon YALNIZ select alır — yazma yetkisi hiç verilmez (ikinci savunma hattı).
do $$
declare
  t text;
begin
  foreach t in array array[
    'brands', 'categories', 'device_models', 'products', 'product_images',
    'product_specs', 'product_compatibility', 'product_marketplace_links',
    'related_products', 'services', 'site_settings'
  ]
  loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- admin_users — yetki tablosu, ayrı ve DAHA DAR ele alınır
-- ---------------------------------------------------------------------------
/*
  Bu tablo yukarıdaki döngüye BİLİNÇLİ OLARAK dâhil edilmez: orada `authenticated`
  role insert/update/delete verilir, burada verilmemelidir.

  Supabase'in varsayılan yetkileri (`default privileges`) yeni tablolara anon ve
  authenticated için tüm hakları verir. Bu tabloda o varsayılan geri alınır.

  NEDEN ÖNEMLİ: yazma, RLS varsayılan-reddi sayesinde zaten engelleniyor
  (politika yok → satır yazılamaz). Ama o TEK savunma hattıdır. Diğer tablolarda
  iki hat vardır: grant yok VE politika yok. Yetki yükseltmeye açılan tablonun
  en zayıf değil en güçlü korunan tablo olması gerekir.

  Ölçülen fark: `products`'a anon insert denemesi "permission denied for table"
  (grant hattı) verirken, admin_users "violates row-level security policy"
  veriyordu — yani yalnız ikinci hat tutuyordu. Biri ileride bu tabloya dikkatsiz
  bir politika eklerse grant hazır beklerdi.

  Yeni yönetici YALNIZ RLS'i atlayan bir bağlantıyla eklenir (service_role veya
  panelin SQL ekranı). Kendini yönetici yapan bir yol yoktur.
*/
revoke all on public.admin_users from anon, authenticated;
-- Yönetici yalnız KENDİ satırını okur; politikası bunu zaten daraltır.
grant select on public.admin_users to authenticated;
