-- Robot Fix — DEMO verisini temizler.
--
-- Yalnız `is_demo = true` satırlara dokunur; işletmenin panelden girdiği gerçek
-- veri ETKİLENMEZ. Alt tablolar (görsel, özellik, uyumluluk, pazaryeri bağlantısı,
-- ilgili ürün) `on delete cascade` ile birlikte silinir.
--
-- Çalıştırma: npm run db:seed:clear

begin;

delete from public.products      where is_demo;
delete from public.device_models where is_demo;
delete from public.categories    where is_demo;
delete from public.brands        where is_demo;
delete from public.services      where is_demo;

-- site_settings'te demo kavramı yok: anahtarlar kalıcıdır, yalnız değerleri boştur.

commit;
