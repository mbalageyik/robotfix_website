-- Robot Fix — TOHUM (SEED) verisi
--
-- ============================================================================
-- BU DOSYA ÜRETİM VERİSİ DEĞİLDİR.
--
-- İçerik doğruluğu kuralı (bilgi dosyası §20 + CLAUDE.md):
--   - Gerçek ürün, fiyat, stok, uyumluluk, garanti veya teslimat verisi YOKTUR.
--   - Ürün/kategori/model adları `[ÖRNEK]` önekiyle ve `is_demo = true` ile girilir.
--   - Ürünlerin TAMAMI `status = 'draft'` — RLS anonime döndürmez.
--   - Fiyatların TAMAMI NULL → arayüzde "Fiyat için iletişime geçin".
--   - Pazaryeri bağlantıları example.com'a gider; gerçek mağaza bağlantısı YOKTUR.
--
-- Markalar bilgi dosyası §10'da "mevcut sitede adı geçen markalar" olarak
-- listelenenlerdir. Yetkili servis / ortaklık ima eden hiçbir alan yoktur
-- (şemada böyle bir alan zaten bulunmuyor).
--
-- Hizmet başlıkları §5'ten alınmıştır ve `status = 'draft'`'tır — kapsamları
-- işletme tarafından doğrulanana kadar yayımlanmaz.
--
-- Temizlemek için: supabase/seed_clear.sql
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Markalar — cihaz markası olarak da kullanılır (§6 kritik ayrım)
-- ---------------------------------------------------------------------------
-- Bunlar gerçek marka adlarıdır (§10) ama DEMO kaydı olarak işaretlenir;
-- yayın kararı işletmenindir.
insert into public.brands (name, slug, display_order, status, is_demo)
values
  ('iRobot Roomba', public.slugify('iRobot Roomba'), 10, 'draft', true),
  ('Roborock',      public.slugify('Roborock'),      20, 'draft', true),
  ('Xiaomi',        public.slugify('Xiaomi'),        30, 'draft', true),
  ('Ecovacs',       public.slugify('Ecovacs'),       40, 'draft', true),
  ('Dreame',        public.slugify('Dreame'),        50, 'draft', true),
  ('Neato',         public.slugify('Neato'),         60, 'draft', true),
  ('Shark',         public.slugify('Shark'),         70, 'draft', true),
  ('Samsung',       public.slugify('Samsung'),       80, 'draft', true),
  ('Philips',       public.slugify('Philips'),       90, 'draft', true),
  ('Tefal',         public.slugify('Tefal'),        100, 'draft', true),
  ('Rowenta',       public.slugify('Rowenta'),      110, 'draft', true),
  ('Bissell',       public.slugify('Bissell'),      120, 'draft', true),
  ('Midea',         public.slugify('Midea'),        130, 'draft', true),
  ('Zaco',          public.slugify('Zaco'),         140, 'draft', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Kategoriler — parça türleri (§6)
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, display_order, status, is_demo)
values
  ('[ÖRNEK] Bataryalar',        public.slugify('ORNEK Bataryalar'),        10, 'draft', true),
  ('[ÖRNEK] Fırçalar',          public.slugify('ORNEK Fircalar'),          20, 'draft', true),
  ('[ÖRNEK] Motor ve Fan',      public.slugify('ORNEK Motor ve Fan'),      30, 'draft', true),
  ('[ÖRNEK] Filtreler',         public.slugify('ORNEK Filtreler'),         40, 'draft', true),
  ('[ÖRNEK] Mop ve Paspas',     public.slugify('ORNEK Mop ve Paspas'),     50, 'draft', true),
  ('[ÖRNEK] Sensör ve Kart',    public.slugify('ORNEK Sensor ve Kart'),    60, 'draft', true),
  ('[ÖRNEK] Tekerlek Modülü',   public.slugify('ORNEK Tekerlek Modulu'),   70, 'draft', true),
  ('[ÖRNEK] Şarj İstasyonu',    public.slugify('ORNEK Sarj Istasyonu'),    80, 'draft', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Cihaz modelleri — uyumluluk hedefi
-- ---------------------------------------------------------------------------
-- Model adları UYDURULMAZ; jenerik `[ÖRNEK] Model A/B/C` kullanılır. Gerçek model
-- listesi işletmeden gelecektir (§21).
insert into public.device_models (brand_id, name, slug, status, is_demo)
select b.id, m.name, public.slugify(m.name), 'draft', true
from public.brands b
cross join (values
  ('[ÖRNEK] Model A'),
  ('[ÖRNEK] Model B'),
  ('[ÖRNEK] Model C')
) as m(name)
where b.slug in ('roborock', 'xiaomi', 'irobot-roomba', 'ecovacs', 'dreame')
on conflict (brand_id, slug) do nothing;

-- ---------------------------------------------------------------------------
-- Ürünler — 16 adet, TAMAMI draft + is_demo + fiyatsız
-- ---------------------------------------------------------------------------
insert into public.products (
  name, slug, brand_id, category_id, sku,
  short_description, availability, is_original,
  is_featured, display_order, status, is_demo
)
select
  p.name,
  public.slugify(p.slug_source),
  (select id from public.brands where slug = p.brand_slug),
  (select id from public.categories where slug = p.category_slug),
  p.sku,
  p.short_description,
  p.availability::public.availability_status,
  -- is_original DAİMA NULL: orijinal/uyumlu bilgisi doğrulanmamıştır (§20).
  null,
  p.is_featured,
  p.display_order,
  'draft',
  true
from (values
  ('[ÖRNEK] Ana Fırça Modülü',        'ORNEK Ana Firca Modulu',        'roborock',      'ornek-fircalar',        'ORNEK-001', 'Örnek veri — ana fırça modülü açıklaması buraya girilecek.',        'in_stock',     true,  10),
  ('[ÖRNEK] Yan Fırça Seti',          'ORNEK Yan Firca Seti',          'roborock',      'ornek-fircalar',        'ORNEK-002', 'Örnek veri — yan fırça seti açıklaması buraya girilecek.',          'in_stock',     false, 20),
  ('[ÖRNEK] Lityum Batarya',          'ORNEK Lityum Batarya',          'xiaomi',        'ornek-bataryalar',      'ORNEK-003', 'Örnek veri — batarya açıklaması buraya girilecek.',                 'limited',      true,  30),
  ('[ÖRNEK] Yedek Batarya Ünitesi',   'ORNEK Yedek Batarya Unitesi',   'irobot-roomba', 'ornek-bataryalar',      'ORNEK-004', 'Örnek veri — yedek batarya açıklaması buraya girilecek.',           'on_order',     false, 40),
  ('[ÖRNEK] Emiş Motoru',             'ORNEK Emis Motoru',             'ecovacs',       'ornek-motor-ve-fan',    'ORNEK-005', 'Örnek veri — emiş motoru açıklaması buraya girilecek.',             'in_stock',     true,  50),
  ('[ÖRNEK] Fan Grubu',               'ORNEK Fan Grubu',               'dreame',        'ornek-motor-ve-fan',    'ORNEK-006', 'Örnek veri — fan grubu açıklaması buraya girilecek.',               'out_of_stock', false, 60),
  ('[ÖRNEK] HEPA Filtre',             'ORNEK HEPA Filtre',             'xiaomi',        'ornek-filtreler',       'ORNEK-007', 'Örnek veri — filtre açıklaması buraya girilecek.',                  'in_stock',     true,  70),
  ('[ÖRNEK] Filtre İkili Paket',      'ORNEK Filtre Ikili Paket',      'roborock',      'ornek-filtreler',       'ORNEK-008', 'Örnek veri — filtre paketi açıklaması buraya girilecek.',           'in_stock',     false, 80),
  ('[ÖRNEK] Mikrofiber Mop Bezi',     'ORNEK Mikrofiber Mop Bezi',     'dreame',        'ornek-mop-ve-paspas',   'ORNEK-009', 'Örnek veri — mop bezi açıklaması buraya girilecek.',                'limited',      false, 90),
  ('[ÖRNEK] Su Haznesi',              'ORNEK Su Haznesi',              'ecovacs',       'ornek-mop-ve-paspas',   'ORNEK-010', 'Örnek veri — su haznesi açıklaması buraya girilecek.',              'on_order',     false, 100),
  ('[ÖRNEK] Lidar Sensör Modülü',     'ORNEK Lidar Sensor Modulu',     'roborock',      'ornek-sensor-ve-kart',  'ORNEK-011', 'Örnek veri — lidar modülü açıklaması buraya girilecek.',            'on_order',     true,  110),
  ('[ÖRNEK] Ana Kart',                'ORNEK Ana Kart',                'xiaomi',        'ornek-sensor-ve-kart',  'ORNEK-012', 'Örnek veri — ana kart açıklaması buraya girilecek.',                'out_of_stock', false, 120),
  ('[ÖRNEK] Ön Tekerlek',             'ORNEK On Tekerlek',             'irobot-roomba', 'ornek-tekerlek-modulu', 'ORNEK-013', 'Örnek veri — ön tekerlek açıklaması buraya girilecek.',             'in_stock',     false, 130),
  ('[ÖRNEK] Yan Tekerlek Modülü',     'ORNEK Yan Tekerlek Modulu',     'dreame',        'ornek-tekerlek-modulu', 'ORNEK-014', 'Örnek veri — tekerlek modülü açıklaması buraya girilecek.',         'limited',      false, 140),
  ('[ÖRNEK] Şarj İstasyonu Adaptörü', 'ORNEK Sarj Istasyonu Adaptoru', 'ecovacs',       'ornek-sarj-istasyonu',  'ORNEK-015', 'Örnek veri — adaptör açıklaması buraya girilecek.',                 'in_stock',     false, 150),
  ('[ÖRNEK] Şarj Pini Seti',          'ORNEK Sarj Pini Seti',          'roborock',      'ornek-sarj-istasyonu',  'ORNEK-016', 'Örnek veri — şarj pini açıklaması buraya girilecek.',               'on_order',     false, 160)
) as p(name, slug_source, brand_slug, category_slug, sku, short_description, availability, is_featured, display_order)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Ürün görselleri — YER TUTUCU YOLLAR
-- ---------------------------------------------------------------------------
/*
  DİKKAT: `storage_path` değerleri Supabase Storage'da KARŞILIĞI OLMAYAN yer
  tutuculardır. Amaçları görsel göstermek değil, veri katmanının görsel yollarını
  (ana görsel seçimi + `display_order` sıralaması) gerçek satırlarla test
  edilebilir kılmaktır. Gerçek görseller Faz 4'te panelden yüklenecektir.

  Bilinçli dağılım — üç yolun da kapsanması için:
    - çok görselli + ana görseli olan ürün
    - tek görselli ürün
    - GÖRSELSİZ ürünler (çoğunluk) → "görsel yok" yolu

  `display_order` bilerek KARIŞIK girilir: sıralama gerçekten çalışıyor mu,
  ekleme sırasına mı güveniyoruz — ancak böyle anlaşılır.
*/
insert into public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
select p.id, i.storage_path, i.alt_text, i.display_order, i.is_primary
from public.products p
join (values
  -- çok görselli ürün (3), ana görsel ikinci sırada girilmiş
  ('ornek-ana-firca-modulu', 'demo/yer-tutucu/ana-firca-3.webp', '[ÖRNEK] Ana fırça modülü — yandan görünüm',  30, false),
  ('ornek-ana-firca-modulu', 'demo/yer-tutucu/ana-firca-1.webp', '[ÖRNEK] Ana fırça modülü — önden görünüm',   10, true),
  ('ornek-ana-firca-modulu', 'demo/yer-tutucu/ana-firca-2.webp', '[ÖRNEK] Ana fırça modülü — detay',           20, false),
  -- çok görselli, ANA GÖRSEL İŞARETLENMEMİŞ → ilk görsele düşme yolu
  ('ornek-lityum-batarya',   'demo/yer-tutucu/batarya-2.webp',   '[ÖRNEK] Lityum batarya — etiket detayı',     20, false),
  ('ornek-lityum-batarya',   'demo/yer-tutucu/batarya-1.webp',   '[ÖRNEK] Lityum batarya — genel görünüm',     10, false),
  -- tek görselli, tükendi durumundaki ürün
  ('ornek-fan-grubu',        'demo/yer-tutucu/fan-grubu-1.webp', '[ÖRNEK] Fan grubu — genel görünüm',          10, true)
) as i(product_slug, storage_path, alt_text, display_order, is_primary)
  on p.slug = i.product_slug
where p.is_demo
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- İlgili ürünler — ELLE seçilmiş ilişki
-- ---------------------------------------------------------------------------
/*
  Yalnız BİR ürüne elle ilişki verilir. Gerekçe: `getRelatedProducts` iki yolludur
  (elle seçim → yoksa kategoriden türetme). Tek ürüne ilişki vermek her iki yolun
  da aynı tohumda test edilmesini sağlar.

  `display_order` alfabetik OLMAYAN bir sıra dayatır: fonksiyon yöneticinin
  sırasını koruyor mu, yoksa veritabanının döndürdüğü sıraya mı güveniyor —
  ancak böyle anlaşılır.
*/
insert into public.related_products (product_id, related_product_id, display_order)
select p.id, r.id, v.display_order
from (values
  ('ornek-ana-firca-modulu', 'ornek-hepa-filtre',         10),
  ('ornek-ana-firca-modulu', 'ornek-yan-firca-seti',      20),
  ('ornek-ana-firca-modulu', 'ornek-mikrofiber-mop-bezi', 30)
) as v(product_slug, related_slug, display_order)
join public.products p on p.slug = v.product_slug and p.is_demo
join public.products r on r.slug = v.related_slug and r.is_demo
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Teknik özellikler — jenerik etiketler
-- ---------------------------------------------------------------------------
insert into public.product_specs (product_id, label, value, display_order)
select p.id, s.label, s.value, s.display_order
from public.products p
cross join (values
  ('Malzeme',   '[ÖRNEK] değer girilecek', 10),
  ('Ağırlık',   '[ÖRNEK] değer girilecek', 20),
  ('Garanti',   '[ÖRNEK] doğrulanacak',    30)
) as s(label, value, display_order)
where p.is_demo
on conflict (product_id, label) do nothing;

-- ---------------------------------------------------------------------------
-- Uyumluluk — her demo ürün, markasının modelleriyle eşleşir
-- ---------------------------------------------------------------------------
insert into public.product_compatibility (product_id, device_model_id, verified_note)
select p.id, dm.id, null  -- verified_note NULL = doğrulanmamış (§20)
from public.products p
join public.device_models dm on dm.brand_id = p.brand_id
where p.is_demo and dm.is_demo
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Pazaryeri bağlantıları — YALNIZ example.com
-- ---------------------------------------------------------------------------
-- Gerçek mağaza/ürün bağlantısı işletmeden gelecektir (§21). Her demo ürüne
-- bağlantı da eklenmez: "bağlantı yoksa buton hiç gösterilmez" davranışının
-- test edilebilmesi için bir kısmı bilinçli olarak boş bırakılır.
insert into public.product_marketplace_links
  (product_id, marketplace, url, link_target, is_active, display_order)
select p.id, 'amazon', 'https://example.com/ornek-urun', 'product', true, 10
from public.products p
where p.is_demo and p.display_order <= 60
on conflict (product_id, marketplace) do nothing;

insert into public.product_marketplace_links
  (product_id, marketplace, url, link_target, is_active, display_order)
select p.id, 'hepsiburada', 'https://example.com/ornek-magaza', 'store', true, 20
from public.products p
where p.is_demo and p.display_order <= 40
on conflict (product_id, marketplace) do nothing;

-- ---------------------------------------------------------------------------
-- Hizmetler — §5 başlıkları, TAMAMI draft
-- ---------------------------------------------------------------------------
insert into public.services (name, slug, short_description, icon_key, display_order, status, is_demo)
values
  ('Batarya Kontrolü ve Değişimi', public.slugify('Batarya Kontrolu ve Degisimi'), null, 'battery',  10, 'draft', true),
  ('Motor, Fan ve Emiş Sistemi',   public.slugify('Motor Fan ve Emis Sistemi'),    null, 'motor',    20, 'draft', true),
  ('Fırça, Tekerlek ve Mekanik',   public.slugify('Firca Tekerlek ve Mekanik'),    null, 'brush',    30, 'draft', true),
  ('Sensör ve Navigasyon',         public.slugify('Sensor ve Navigasyon'),         null, 'sensor',   40, 'draft', true),
  ('Şarj İstasyonu ve Kart',       public.slugify('Sarj Istasyonu ve Kart'),       null, 'charging', 50, 'draft', true),
  ('Arıza Tespiti',                public.slugify('Ariza Tespiti'),                null, 'diagnose', 60, 'draft', true),
  ('Periyodik Bakım ve Temizlik',  public.slugify('Periyodik Bakim ve Temizlik'),  null, 'service',  70, 'draft', true),
  ('Yedek Parça Satışı',           public.slugify('Yedek Parca Satisi'),           null, 'parts',    80, 'draft', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Site ayarları
-- ---------------------------------------------------------------------------
-- DOĞRULANMAMIŞ değerler BOŞ bırakılır. İşletme bilgisi (§21) doğrulanana
-- kadar env'deki varsayım kullanılır; lib/site-config.ts boş değeri env'e
-- düşürür.
--
-- ADRES VE ÇALIŞMA SAATİ ARTIK DOLU (2026-08-21): ikisi de kullanıcı
-- tarafından açıkça onaylandı, dolayısıyla §20'nin "uydurulamaz" kapsamından
-- çıktılar. Telefon alanları BOŞ KALIYOR — onlar hâlâ onay bekliyor.
--
-- PAZAR GÜNÜ BİR VARSAYIMDIR, VERİ DEĞİL. Kullanıcı Pazartesi–Cumartesi
-- saatlerini verdi, Pazar gününü belirtmedi. "Kapalı" olarak girildi çünkü
-- boş bırakmak ziyaretçiye hiçbir şey söylemezdi; ama bu bir doğrulama
-- değil, bir varsayımdır ve üç yerde iz bırakır: burada, `description`
-- sütununda ve panelin alan ipucunda.
insert into public.site_settings (key, value, description)
values
  ('whatsapp_phone',        null, 'E.164 biçiminde WhatsApp numarası. TODO(business): doğrulanacak.'),
  ('phone_display',         null, 'Ekranda gösterilen telefon biçimi.'),
  ('address_line',
   'Sarıgüllük, 61030. Sk. No: 1/A, 27060 Şehitkamil / Gaziantep',
   'Açık adres. Bilgi dosyası §10; kullanıcı tarafından güncel olarak ONAYLANDI (2026-08-21).'),
  ('working_hours',
   'Pazartesi–Cumartesi 09:00–19:30 · Pazar kapalı',
   'Çalışma saatleri. Pzt–Cmt kullanıcı tarafından onaylandı (2026-08-21). '
   'TODO(business): Pazar günü çalışma durumu DOĞRULANMADI, varsayılan olarak kapalı girildi.'),
  ('maps_url',              null, 'Google Business Profile / harita bağlantısı.'),
  ('store_amazon_url',      null, 'Amazon MAĞAZA bağlantısı. TODO(business): doğrulanacak.'),
  ('store_hepsiburada_url', null, 'Hepsiburada MAĞAZA bağlantısı. TODO(business): doğrulanacak.'),
  ('store_trendyol_url',    null, 'Trendyol MAĞAZA bağlantısı. TODO(business): doğrulanacak.'),
  ('store_pazarama_url',    null, 'Pazarama MAĞAZA bağlantısı. TODO(business): doğrulanacak.'),
  ('whatsapp_template_product', null, 'Ürün mesajı şablonu. Boşsa koddaki varsayılan kullanılır.'),
  ('whatsapp_template_service', null, 'Servis mesajı şablonu. Boşsa koddaki varsayılan kullanılır.')
on conflict (key) do nothing;

commit;
