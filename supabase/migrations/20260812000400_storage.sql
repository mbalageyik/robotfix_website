-- Robot Fix — Faz 3 · 04: ürün görselleri için Storage kovası
--
-- Kova ADI koda gömülmez; `lib/admin/storage.ts` içindeki sabitten okunur ve
-- ikisi bir testle eşleştirilir.
--
-- GÖRÜNÜRLÜK: kova `public = true`. Gerekçe: ürün görselleri zaten herkese
-- açık bir katalogda gösterilecek ve `next/image` imzalı URL yenilemesiyle
-- uğraşmadan doğrudan CDN'den okuyabilmeli. Kovanın public olması YAZMAYI
-- açmaz — yazma politikaları aşağıda ayrıca tanımlanır.
--
-- ÖNEMLİ: taslak bir ürünün görseli de bu kovada durur ve URL'i bilen biri
-- görebilir. Bu kabul edilmiş bir ödünleşimdir: görsel dosyası sır değildir,
-- ürünün YAYIN DURUMU ise veritabanında korunur (RLS). Sır niteliğinde bir
-- belge bu kovaya konulmaz.

-- ---------------------------------------------------------------------------
-- Kova
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB; lib/admin/schemas.ts → MAX_IMAGE_BYTES ile aynı olmalı
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Politikalar — okuma herkese, yazma yalnız yöneticiye
-- ---------------------------------------------------------------------------
/*
  İKİ KATMANLI DOSYA KISITI:
    1. Kova düzeyi (yukarıdaki `allowed_mime_types` + `file_size_limit`) —
       Storage API'si bunu KENDİ uygular; uygulama kodu atlanamaz.
    2. Uygulama düzeyi (lib/admin/schemas.ts → validateImageFile) —
       kullanıcıya anlaşılır Türkçe mesaj vermek için.

  Yani doğrudan Storage API'sine giden bir istek de reddedilir; uygulama
  doğrulaması tek hat değildir.
*/

drop policy if exists "product-images: herkes okur" on storage.objects;
create policy "product-images: herkes okur"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "product-images: yönetici yükler" on storage.objects;
create policy "product-images: yönetici yükler"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product-images: yönetici günceller" on storage.objects;
create policy "product-images: yönetici günceller"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product-images: yönetici siler" on storage.objects;
create policy "product-images: yönetici siler"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
