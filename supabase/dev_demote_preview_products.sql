-- ============================================================================
-- dev_promote_preview_products.sql'in TERSİ. Önizleme kümesini demo/taslak
-- durumuna geri çeker.
-- ============================================================================
--
-- Gerçek katalog verisi girildiğinde ya da üretime çıkmadan önce
-- ÇALIŞTIRILMALIDIR: `[ÖRNEK]` işaretli satırların yayında kalması demo
-- politikasının ihlalidir (CLAUDE.md).
--
-- KULLANICININ KENDİ KAYITLARINA DOKUNMAZ. Ölçüt `slug` listesidir, "demo
-- olmayan her şey" değil — bu yüzden panelden oluşturulmuş gerçek ürünler
-- (ör. "Deneme") etkilenmez.
--
-- Çalıştırma: npm run db:preview:off

begin;

create temporary table preview_slugs (slug text primary key);
insert into preview_slugs values
  ('ornek-ana-firca-modulu'),
  ('ornek-lityum-batarya'),
  ('ornek-sarj-istasyonu-adaptoru'),
  ('ornek-fan-grubu'),
  ('ornek-hepa-filtre'),
  ('ornek-on-tekerlek'),
  ('ornek-mikrofiber-mop-bezi'),
  ('ornek-lidar-sensor-modulu');

update public.products p
   set is_demo = true,
       status = 'draft',
       updated_at = now()
  from preview_slugs s
 where p.slug = s.slug;

/*
  Taksonomi geri çekilirken DİKKAT: bir marka/kategori yalnız önizleme
  ürünleri tarafından kullanılıyorsa demoya döner. Adı `[ÖRNEK]` ile
  başlayan taksonomi zaten demo verisidir; markalar ise gerçek üretici
  adlarıdır ve `slugify` ile tohumlanmıştır — ikisi de tohum kaynaklıdır,
  bu yüzden koşul "tohumdan gelen ve artık demo olmayan ürünü kalmayan"
  olarak yazıldı.
*/
update public.brands b
   set is_demo = true, status = 'draft'
 where b.id in (
   select distinct p.brand_id from public.products p
     join preview_slugs s on s.slug = p.slug
    where p.brand_id is not null
 )
   and not exists (
     select 1 from public.products p2
      where p2.brand_id = b.id and not p2.is_demo
   );

update public.categories c
   set is_demo = true, status = 'draft'
 where c.id in (
   select distinct p.category_id from public.products p
     join preview_slugs s on s.slug = p.slug
    where p.category_id is not null
 )
   and not exists (
     select 1 from public.products p2
      where p2.category_id = c.id and not p2.is_demo
   );

update public.device_models m
   set is_demo = true, status = 'draft'
 where m.id in (
   select distinct pdm.device_model_id
     from public.product_compatibility pdm
     join public.products p on p.id = pdm.product_id
     join preview_slugs s on s.slug = p.slug
 )
   and not exists (
     select 1
       from public.product_compatibility pdm2
       join public.products p2 on p2.id = pdm2.product_id
      where pdm2.device_model_id = m.id and not p2.is_demo
   );

commit;

select count(*) filter (where not is_demo) as demo_olmayan_urun,
       count(*) filter (where is_demo and status = 'active') as yayindaki_demo
  from public.products;
