-- ============================================================================
-- YALNIZ YEREL GELİŞTİRME. ÜRETİMDE ÇALIŞMAZ — aşağıdaki koruma engeller.
-- ============================================================================
--
-- İlk yönetici hesabını oluşturur ve `admin_users` allow-list'ine ekler.
-- Panelde kayıt olma akışı YOKTUR (Faz 3 kapsam dışı): yönetici yalnız
-- RLS'i atlayan bir bağlantıyla eklenebilir. Bu betik o bağlantıdır.
--
-- Çalıştırma:
--   docker exec -i supabase_db_robotfix_son_durum psql -U postgres -d postgres \
--     < supabase/dev_create_admin.sql
--
-- ÜRETİMDE yönetici oluşturma: docs/supabase-setup.md §2.5 (panelin SQL ekranı).

begin;

-- ---------------------------------------------------------------------------
-- ÜRETİM KORUMASI — dev_activate_demo.sql ile aynı ilke
-- ---------------------------------------------------------------------------
do $$
declare
  local_jwt_secret constant text := 'super-secret-jwt-token-with-at-least-32-characters-long';
  actual_secret text := current_setting('app.settings.jwt_secret', true);
begin
  if actual_secret is distinct from local_jwt_secret then
    raise exception
      'REDDEDİLDİ: bu betik yalnız YEREL Supabase yığınında çalışır. '
      'Üretimde yönetici oluşturmak için docs/supabase-setup.md §2.5 izlenir.';
  end if;
  raise notice 'Koruma geçildi: yerel yığın.';
end
$$;

-- ---------------------------------------------------------------------------
-- Yönetici hesabı
-- ---------------------------------------------------------------------------
-- Parola YEREL GELİŞTİRME içindir ve yalnız yerel yığında geçerlidir.
-- Üretimde bu betik çalışmaz, dolayısıyla bu parola hiçbir zaman yayına çıkmaz.
do $$
declare
  admin_email constant text := 'admin@robotfix.local';
  admin_password constant text := 'RobotFixDev!2026';
  existing_id uuid;
  new_id uuid;
begin
  select id into existing_id from auth.users where email = admin_email;

  if existing_id is not null then
    -- Parolayı bilinen değere geri çeker; tekrar çalıştırılabilir olsun diye.
    update auth.users
       set encrypted_password = crypt(admin_password, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = existing_id;
    new_id := existing_id;
    raise notice 'Mevcut yönetici güncellendi: %', admin_email;
  else
    new_id := gen_random_uuid();
    /*
      ====================================================================
      BOŞ DİZE ('') SÜTUNLARI — NULL BIRAKILAMAZ
      ====================================================================

      Supabase Auth (GoTrue) bir Go servisidir ve aşağıdaki jeton
      sütunlarını NULL kabul etmeyen `string` alanlara okur. Sütunlar
      şemada NULL'a izin verse de, NULL bırakılırsa giriş denemesi
      şu hatayla 500 döner:

        Scan error on column index 3, name "confirmation_token":
        converting NULL to string is unsupported

      Ve kullanıcıya "Database error querying schema" görünür — parolası
      doğru olsa bile HİÇBİR ZAMAN giriş yapamaz. Bu yüzden hepsi açıkça
      boş dizeye kurulur. `insert` varsayılanlarına güvenilmez.
    */
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token,
      email_change, email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token
    )
    values (
      new_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      admin_email, crypt(admin_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      '', '', '', '', '', '', '', ''
    );
    raise notice 'Yönetici oluşturuldu: %', admin_email;
  end if;

  /*
    Betik daha önce (bu düzeltmeden ÖNCE) çalıştırılmış olabilir; o zaman
    oluşan satırlar NULL jetonlar taşır ve giriş yapılamaz. Onarımı burada
    yapılır ki betiği yeniden çalıştırmak sorunu çözsün.
  */
  update auth.users
     set confirmation_token         = coalesce(confirmation_token, ''),
         recovery_token             = coalesce(recovery_token, ''),
         email_change               = coalesce(email_change, ''),
         email_change_token_new     = coalesce(email_change_token_new, ''),
         email_change_token_current = coalesce(email_change_token_current, ''),
         phone_change               = coalesce(phone_change, ''),
         phone_change_token         = coalesce(phone_change_token, ''),
         reauthentication_token     = coalesce(reauthentication_token, '')
   where id = new_id;

  -- Kimlik kaydı (Supabase Auth e-posta girişinde bunu bekler).
  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(), new_id, new_id::text, 'email',
    jsonb_build_object('sub', new_id::text, 'email', admin_email, 'email_verified', true),
    now(), now(), now()
  )
  on conflict (provider, provider_id) do nothing;

  -- Allow-list'e ekle — yetkiyi veren şey budur.
  insert into public.admin_users (user_id, email)
  values (new_id, admin_email)
  on conflict (user_id) do nothing;
end
$$;

commit;

-- Doğrulama
select u.email, (a.user_id is not null) as yonetici_mi
from auth.users u
left join public.admin_users a on a.user_id = u.id
where u.email = 'admin@robotfix.local';
