-- ============================================================================
-- YALNIZ YEREL GELİŞTİRME / ÜRETİM ÖNİZLEMESİ. Geri alma: dev_demote_preview_products.sql
-- ============================================================================
--
-- NE YAPAR. Seçilmiş sekiz `[ÖRNEK]` ürünü ve onların marka/kategori/model
-- kayıtlarını `is_demo = false` + `status = 'active'` yapar; böylece ürünler
-- ÜRETİM DERLEMESİNDE de görünür.
--
-- ----------------------------------------------------------------------------
-- BU BİR POLİTİKA SAPMASIDIR VE BİLEREK YAPILIYOR.
-- ----------------------------------------------------------------------------
-- CLAUDE.md'nin demo ürün politikası şöyle: "Demo ürünler status = 'draft' ve
-- is_demo = true ile tohumlanır ... üretim sorgularının ve sitemap'in
-- dışındadır." `is_demo = false` yapmak tam olarak o dışarıda tutulmayı
-- kaldırır.
--
-- Sapmanın gerekçesi: üretim derlemesinde `showDemoContent` daima `false`dur
-- (`lib/supabase/env.ts`), dolayısıyla demo işaretli hiçbir satır görünmez ve
-- katalog önizlemesi tek bir ürüne (kullanıcının "Deneme" kaydı) düşer.
-- Tasarımı, filtreleri, seçkiyi ve sitemap'i gerçek bir katalogla denemenin
-- başka yolu yok.
--
-- SAPMANIN SINIRI — §20 İHLAL EDİLMİYOR:
--   * Ürün adlarındaki `[ÖRNEK]` öneki KORUNUR, silinmez.
--   * Açıklamalar "Örnek veri — ... buraya girilecek" olarak kalır.
--   * FİYATLAR BOŞ KALIR → arayüzde "Fiyat için iletişime geçin" çıkar.
--     Uydurma bir fiyat ya da indirim ASLA yazılmaz.
--   * Bulunabilirlik durumları tohumdaki hâliyle bırakılır; "Stokta" ibaresi
--     yalnız tohumun zaten öyle işaretlediği satırlarda çıkar.
--
-- Gerçek katalog geldiğinde bu betik ve karşıtı silinir.
-- ----------------------------------------------------------------------------
--
-- Çalıştırma: npm run db:preview:on

begin;

-- ---------------------------------------------------------------------------
-- ÜRETİM KORUMASI — dev_activate_demo.sql ile aynı ölçüt
-- ---------------------------------------------------------------------------
do $$
declare
  local_jwt_secret constant text := 'super-secret-jwt-token-with-at-least-32-characters-long';
  actual_secret text := current_setting('app.settings.jwt_secret', true);
  foreign_admins bigint;
begin
  if actual_secret is distinct from local_jwt_secret then
    raise exception
      'REDDEDİLDİ: bu betik yalnız YEREL Supabase yığınında çalışır.';
  end if;

  select count(*) into foreign_admins
  from public.admin_users
  where email is null or email not like '%.local';

  if foreign_admins > 0 then
    raise exception
      'REDDEDİLDİ: yerel olmayan (% adet) yönetici hesabı var; burası gerçek bir kurulum.',
      foreign_admins;
  end if;

  raise notice 'Koruma geçildi.';
end
$$;

-- ---------------------------------------------------------------------------
-- Önizleme kümesi
-- ---------------------------------------------------------------------------
/*
  Sekiz ürün BİLİNÇLİ seçildi:
    - beş ayrı marka, yedi ayrı kategori → filtreler anlamlı test edilebilir,
    - dört bulunabilirlik durumunun DÖRDÜ de temsil ediliyor (Stokta, Sınırlı
      stok, Siparişle, Tükendi) → rozetlerin hepsi görünür,
    - görselli üç ürünün üçü de içeride → kart görsel yolu ve "görsel yok"
      yolu birlikte görülebilir.
*/
create temporary table preview_slugs (slug text primary key, featured boolean not null);
insert into preview_slugs values
  ('ornek-ana-firca-modulu',        true),   -- Roborock · Fırçalar · Stokta · 3 görsel
  ('ornek-lityum-batarya',          true),   -- Xiaomi · Bataryalar · Sınırlı stok · 2 görsel
  ('ornek-sarj-istasyonu-adaptoru', true),   -- Ecovacs · Şarj İstasyonu · Stokta
  ('ornek-fan-grubu',               false),  -- Dreame · Motor ve Fan · Tükendi · 1 görsel
  ('ornek-hepa-filtre',             false),  -- Xiaomi · Filtreler · Stokta
  ('ornek-on-tekerlek',             false),  -- iRobot Roomba · Tekerlek · Stokta
  ('ornek-mikrofiber-mop-bezi',     false),  -- Dreame · Mop ve Paspas · Sınırlı stok
  ('ornek-lidar-sensor-modulu',     false);  -- Roborock · Sensör ve Kart · Siparişle

/*
  ÖNCE TAKSONOMİ. Ürün görünür olup markası görünmez kalırsa kart "Marka
  belirtilmedi" der ve filtre listeleri boş çıkar — daha önce ölçülen tam
  olarak bu durumdu. Yalnız SEÇİLEN ürünlerin bağlı olduğu satırlar terfi
  eder; geri kalan demo taksonomi olduğu yerde kalır.
*/
update public.brands b
   set is_demo = false, status = 'active'
 where exists (
   select 1 from public.products p
    join preview_slugs s on s.slug = p.slug
   where p.brand_id = b.id
 );

update public.categories c
   set is_demo = false, status = 'active'
 where exists (
   select 1 from public.products p
    join preview_slugs s on s.slug = p.slug
   where p.category_id = c.id
 );

/*
  Uyumlu cihaz modelleri: ürün detayındaki uyumluluk listesi ve katalogdaki
  "Uyumlu model" filtresi bunlara bakar.
*/
update public.device_models m
   set is_demo = false, status = 'active'
 where exists (
   select 1
     from public.product_compatibility pdm
     join public.products p on p.id = pdm.product_id
     join preview_slugs s on s.slug = p.slug
    where pdm.device_model_id = m.id
 );

-- ---------------------------------------------------------------------------
-- Ürünler. FİYAT ALANLARINA DOKUNULMAZ — boş kalır, arayüz "Fiyat için
-- iletişime geçin" der.
-- ---------------------------------------------------------------------------
update public.products p
   set is_demo = false,
       status = 'active',
       is_featured = s.featured,
       updated_at = now()
  from preview_slugs s
 where p.slug = s.slug;

commit;

-- Doğrulama
select p.slug, p.status, p.is_demo, p.is_featured, p.availability, p.price_minor,
       b.name as marka, c.name as kategori
  from public.products p
  left join public.brands b on b.id = p.brand_id
  left join public.categories c on c.id = p.category_id
 where not p.is_demo
 order by p.display_order;
