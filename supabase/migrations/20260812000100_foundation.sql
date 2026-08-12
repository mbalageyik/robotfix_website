-- Robot Fix — Faz 2 · 01: temel tipler, yardımcı fonksiyonlar, yetki modeli
--
-- Bu migrasyon tekrar çalıştırılabilir (idempotent): her nesne varlık kontrolüyle
-- oluşturulur. `supabase db reset` sıfırdan çalıştırır; canlıda tekrar uygulanırsa
-- bozulmaz.

-- ---------------------------------------------------------------------------
-- 1. Sıralanabilir tipler
-- ---------------------------------------------------------------------------

-- Yayın durumu. Kalıcı silme YOK — arşivleme esas (bilgi dosyası §17).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'publication_status') then
    create type public.publication_status as enum ('draft', 'active', 'passive', 'archived');
  end if;
end
$$;

-- Bulunabilirlik. Değerler AvailabilityBadge varyantlarının TEK kaynağıdır;
-- TypeScript tipi bu enum'dan türetilir (lib/data/types.ts).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'availability_status') then
    create type public.availability_status as enum
      ('in_stock', 'limited', 'on_order', 'out_of_stock');
  end if;
end
$$;

-- Pazaryerleri (bilgi dosyası §3). 'other' doğrulanmış ama listelenmemiş kanallar için.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'marketplace') then
    create type public.marketplace as enum
      ('amazon', 'hepsiburada', 'trendyol', 'pazarama', 'other');
  end if;
end
$$;

-- Pazaryeri bağlantısının nereye gittiği. Bilgi dosyası §9: "Bağlantının mağazaya
-- mı yoksa doğrudan ürüne mi gittiği kullanıcıya açıkça anlatılmalıdır."
do $$
begin
  if not exists (select 1 from pg_type where typname = 'marketplace_link_target') then
    create type public.marketplace_link_target as enum ('product', 'store');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Türkçe uyumlu slug üretimi
-- ---------------------------------------------------------------------------

-- `unaccent` gibi bir eklenti Türkçe'nin noktasız ı'sını DOĞRU çevirmez
-- (ı → i beklenir, unaccent bunu garanti etmez) ve İ (U+0130) için de
-- güvenilmezdir. Bu yüzden dönüşümü açıkça yazıyoruz.
--
-- Sıra önemlidir: İ ve I büyük harfleri, lower() çağrılmadan ÖNCE çevrilir.
-- Aksi hâlde Postgres'in lower('I') → 'i' davranışı Türkçe'de yanlıştır
-- (Türkçe'de I → ı, İ → i).
create or replace function public.slugify(input text)
returns text
language sql
immutable
strict
as $$
  select
    -- 5. Baştaki/sondaki tireleri kırp
    trim(both '-' from
      -- 4. Alfanümerik olmayan her şeyi tek tireye indir
      regexp_replace(
        -- 3. Küçük harfe çevir (artık yalnız ASCII harfler kaldı)
        lower(
          -- 2. Kalan Latin diakritikleri
          translate(
            -- 1. Türkçe'ye özel büyük harfler (lower()'dan ÖNCE)
            translate(input, 'İIĞÜŞÖÇ', 'iıgusoc'),
            'ığüşöçĞÜŞÖÇáàâäéèêëíìîïóòôöúùûüñÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÑ',
            'igusocgusocaaaaeeeeiiiioooouuuunAAAAEEEEIIIIOOOOUUUN'
          )
        ),
        '[^a-z0-9]+', '-', 'g'
      )
    );
$$;

comment on function public.slugify(text) is
  'Türkçe karakterleri doğru sadeleştiren slug üretici (ı→i, İ→i, ğ→g, ş→s, ç→c, ö→o, ü→u).';

-- ---------------------------------------------------------------------------
-- 3. updated_at otomatik güncelleme
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Bir tabloya updated_at tetikleyicisi bağlar (tekrar çalıştırılabilir).
create or replace function public.attach_updated_at(target_table regclass)
returns void
language plpgsql
as $$
declare
  trigger_name text := 'set_updated_at_' || replace(target_table::text, 'public.', '');
begin
  execute format('drop trigger if exists %I on %s', trigger_name, target_table);
  execute format(
    'create trigger %I before update on %s for each row execute function public.set_updated_at()',
    trigger_name, target_table
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Yetki modeli
-- ---------------------------------------------------------------------------

-- Tek yönetici rolü yeterlidir (bilgi dosyası §17: tek yönetici alanı).
-- Faz 3'te rol çeşitlendirilecekse bu tabloya `role` sütunu eklenir; politikalar
-- `public.is_admin()` üzerinden geçtiği için politika metinleri değişmez.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Yönetici allow-list. Bir kullanıcının burada olması yazma yetkisi verir.';

alter table public.admin_users enable row level security;

-- Yöneticiler yalnız kendi satırlarını görebilir; liste anonime kapalıdır.
drop policy if exists "admin_users: yönetici kendi satırını okur" on public.admin_users;
create policy "admin_users: yönetici kendi satırını okur"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

/*
  Yetki kontrolü.

  `security definer` + sabit `search_path`: politika içinden çağrıldığında
  admin_users tablosunun KENDİ RLS'ine takılmaz ve arama yolu ele geçirilemez.
  `stable` çünkü aynı işlem içinde sonucu değişmez — planlayıcı satır başına
  tekrar çağırmaz.
*/
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

comment on function public.is_admin() is
  'Oturumdaki kullanıcı yönetici mi. Tüm yazma politikaları bunun üzerinden geçer.';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;
