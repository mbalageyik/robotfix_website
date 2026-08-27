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

  /*
    2. KATMAN: burası GERÇEK bir kurulum mu?

    ÖNCEKİ ÖLÇÜT ÇÜRÜDÜ. Eskiden bu katman "demo olmayan tek bir katalog satırı
    varsa reddet" diyordu. Geliştirici panelden TEK bir test ürünü oluşturur
    oluşturmaz betik kendi geliştirme veritabanında da reddetmeye başladı ve
    belgelenen "katalogu tasarım için doldur" yolu sessizce kapandı — panel
    tam olarak ürün oluşturmak için varken.

    Doğru soru "veritabanı dolu mu" değil, "burası gerçek bir kurulum mu".
    Gerçek bir kurulumda yönetici hesabı gerçek bir e-postadır; yerel yığında
    `dev_create_admin.sql` her zaman `...@robotfix.local` üretir. Yönetici
    tablosu boşsa (taze veritabanı) ortada korunacak bir kurulum da yoktur.

    Koruma ZAYIFLAMADI, çünkü üçüncü bir sınır zaten aşağıdaki `update`
    satırlarının kendisindedir: hepsi `where is_demo` ile sınırlıdır ve
    demo OLMAYAN hiçbir satıra dokunamaz.
  */
  select count(*) into real_rows
  from public.admin_users
  where email is null or email not like '%.local';

  if real_rows > 0 then
    raise exception
      'REDDEDİLDİ: bu veritabanında yerel olmayan (% adet) yönetici hesabı var. '
      'Burası gerçek bir kurulum gibi görünüyor; demo veriyi aktifleştirmiyoruz.', real_rows;
  end if;

  raise notice 'Koruma geçildi: yerel yığın, yerel olmayan yönetici hesabı yok.';
end
$$;

-- ---------------------------------------------------------------------------
update public.brands        set status = 'active' where is_demo;
update public.categories    set status = 'active' where is_demo;
update public.device_models set status = 'active' where is_demo;
update public.products      set status = 'active' where is_demo;
update public.services      set status = 'active' where is_demo;

commit;
