-- ============================================================================
-- YALNIZ YEREL GELİŞTİRME. ÜRETİMDE ÇALIŞMAZ — aşağıdaki koruma engeller.
-- ============================================================================
--
-- Demo (`[ÖRNEK]`) satırlarını geçici olarak `active` yapar; böylece anonim
-- istemcinin gördüğü yol (RLS dâhil) gerçek veriyle test edilebilir.
-- Faz 3/4'te katalog arayüzü geliştirilirken de kullanılır.
--
-- Geri almak için: supabase/dev_deactivate_demo.sql

begin;

-- ---------------------------------------------------------------------------
-- ÜRETİM KORUMASI — iki bağımsız katman, ikisi de geçmeli
-- ---------------------------------------------------------------------------
do $$
declare
  -- Supabase CLI'nin yerel yığınında JWT sırrı SABİT ve herkesçe bilinen bu
  -- değerdir. Gerçek bir Supabase projesinde sır rastgele ve benzersizdir.
  -- Okunamıyorsa (yetki yok) `null` gelir ve koruma KAPALI tarafa düşer.
  local_jwt_secret constant text := 'super-secret-jwt-token-with-at-least-32-characters-long';
  actual_secret text := current_setting('app.settings.jwt_secret', true);
  real_rows bigint;
begin
  -- 1. KATMAN: yerel yığın mı?
  if actual_secret is distinct from local_jwt_secret then
    raise exception
      'REDDEDİLDİ: bu betik yalnız YEREL Supabase yığınında çalışır. '
      'Bağlanılan veritabanı yerel değil (JWT sırrı bilinen yerel demo değeri değil). '
      'Demo veriyi üretime asla aktifleştirmeyin.';
  end if;

  -- 2. KATMAN: veritabanında GERÇEK katalog verisi var mı?
  -- Yerel yığın taklit edilse bile dolu bir veritabanına dokunmayız.
  select count(*) into real_rows
  from (
    select 1 from public.products   where not is_demo
    union all select 1 from public.brands     where not is_demo
    union all select 1 from public.categories where not is_demo
    union all select 1 from public.services   where not is_demo
  ) t;

  if real_rows > 0 then
    raise exception
      'REDDEDİLDİ: veritabanında % adet gerçek (demo olmayan) katalog satırı var. '
      'Bu betik yalnız boş/demo bir geliştirme veritabanında çalıştırılır.', real_rows;
  end if;

  raise notice 'Koruma geçildi: yerel yığın, gerçek katalog verisi yok.';
end
$$;

-- ---------------------------------------------------------------------------
update public.brands        set status = 'active' where is_demo;
update public.categories    set status = 'active' where is_demo;
update public.device_models set status = 'active' where is_demo;
update public.products      set status = 'active' where is_demo;
update public.services      set status = 'active' where is_demo;

commit;
