-- Robot Fix — 05: yönetici rol alanı
--
-- Bu migrasyon tekrar çalıştırılabilir (idempotent).
--
-- ---------------------------------------------------------------------------
-- NE YAPMAZ — önce bunu okuyun
-- ---------------------------------------------------------------------------
/*
  Bu sütun BİR GÜVENLİK SINIRI DEĞİLDİR.

  `public.is_admin()` yalnız `admin_users` tablosunda SATIR OLUP OLMADIĞINA
  bakar; role'e BAKMAZ. Dolayısıyla bugün `editor` rolü verilen bir kullanıcı,
  `owner` ile TAMAMEN AYNI yazma yetkisine sahiptir — tüm yazma politikaları
  `is_admin()` üzerinden geçtiği için.

  Bu bilinçlidir. Rolü gerçekten uygulayan bir model, politika metinlerinin
  (`... yönetici tam yetkili`) tablo tablo yeniden yazılmasını ve panelin her
  ekranında yetki ayrımı yapılmasını gerektirir; ikisi de bu görevin kapsamı
  dışındadır. Yarım uygulanmış bir rol modeli, hiç olmayandan DAHA TEHLİKELİDİR:
  panelde "editor" yazısını gören biri o kullanıcının sınırlı olduğunu sanır.

  Bu yüzden sütun eklenir ama arayüzde rol seçtiren bir alan AÇILMAZ ve
  `role` bir yetki kararında KULLANILMAZ. Rol ayrımı gerçekten gerektiğinde
  yapılacak iş: (1) `is_admin()` yanına `public.has_admin_role(text)` eklemek,
  (2) yazma politikalarını o fonksiyona bağlamak, (3) panelde rol yönetimi
  ekranı açmak. Üçü birlikte yapılmadan rol bir şey ifade etmez.

  Şu anki gerçek model tek yöneticidir (bilgi dosyası §17).
*/

-- ---------------------------------------------------------------------------
-- Rol tipi
-- ---------------------------------------------------------------------------
-- Serbest metin yerine enum: yazım hatası ('Owner', 'ownr') satırı sessizce
-- yetkisiz bırakmaz, veritabanı reddeder.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('owner', 'editor');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Sütun
-- ---------------------------------------------------------------------------
-- Varsayılan 'owner': mevcut satırlar (ve `dev_create_admin.sql` gibi sütunu
-- yazmayan her insert) bugünkü davranışı korur — tam yetki. Varsayılanı
-- 'editor' yapmak, rol henüz uygulanmadığı için yanıltıcı olurdu.
alter table public.admin_users
  add column if not exists role public.admin_role not null default 'owner';

comment on column public.admin_users.role is
  'İLERİYE DÖNÜK alan. is_admin() bu değere BAKMAZ; bugün her yönetici tam yetkilidir.';
