-- Robot Fix — doğrulanmış işletme bilgisi
--
-- ---------------------------------------------------------------------------
-- BU DOSYA TOHUM VERİSİ DEĞİLDİR — ÜRETİMDE ÇALIŞTIRILIR
-- ---------------------------------------------------------------------------
/*
  `supabase/seed.sql` yalnız `supabase db reset` ile yüklenir ve içeriği
  TAMAMEN demo/örnek veridir; üretime asla gitmez. Bu dosya onun tersidir:
  içeriği GERÇEK işletme bilgisidir ve hem yerelde hem üretimde çalıştırılır.

  Neden migrasyon değil: migrasyonlar ŞEMA değiştirir, bu dosya VERİ yazar.
  İşletme telefonu değiştiğinde yeni bir migrasyon yazılmaz — bu dosya
  güncellenip yeniden çalıştırılır (ya da panelden düzenlenir). Migrasyon
  geçmişini veri düzeltmeleriyle kirletmemek bilinçli bir tercihtir.

  Tekrar çalıştırılabilir (idempotent): `on conflict do update`. Panelden
  yapılan bir düzenlemeyi EZER — bu dosya çalıştırıldığında buradaki değerler
  kazanır. Dolayısıyla işletme bilgisi panelden güncellendiyse önce buraya
  yansıtılmalıdır, aksi hâlde bir sonraki çalıştırma geri alır.

  SIR YAZILMAZ: `site_settings` anonim role tamamen okunabilir (tablo yorumu).
  Buradaki her alan zaten sitede herkese gösterilen bilgidir.

  Çalıştırma:
    yerel   : docker exec -i supabase_db_robotfix_son_durum \
                psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/business_info.sql
    üretim  : psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/business_info.sql
              (ya da Supabase panelindeki SQL editörüne yapıştırarak)
*/

-- ---------------------------------------------------------------------------
-- DOĞRULANMA DURUMU
-- ---------------------------------------------------------------------------
/*
  Aşağıdaki DÖRT alan işletme tarafından DOĞRULANMIŞTIR (2026-08-27) ve bilgi
  dosyası §20'nin "uydurulamaz" kapsamından çıkmıştır. `description` sütununda
  TODO(business) İŞARETİ TAŞIMAZLAR — o işaret yalnız doğrulanmamış alanlara
  aittir ve panelde uyarı olarak görünür.

  Önceki durumdan farkı: `seed.sql` bu alanları bir zamanlar "Pazar günü
  VARSAYIMDIR" notuyla yazıyordu. Pazar günü artık doğrulandı, varsayım
  notu KALDIRILDI.

  Doğrulanmamış kalan alanlar bu dosyaya GİRMEZ (maps_url, pazaryeri
  bağlantıları): boş kalırlar ve arayüzde ilgili buton/bölüm hiç gösterilmez.
*/

insert into public.site_settings (key, value, description)
values
  -- E.164. `lib/whatsapp.ts` bu biçimi bekler; wa.me bağlantısı buradan üretilir.
  ('whatsapp_phone',
   '+905524261616',
   'WhatsApp numarası (E.164). İşletme tarafından DOĞRULANDI (2026-08-27).'),

  -- Ekranda gösterilen biçim. Numara aynı; yalnız okunabilirlik için ayrı tutulur.
  ('phone_display',
   '0552 426 16 16',
   'Ekranda gösterilen telefon biçimi. İşletme tarafından DOĞRULANDI (2026-08-27).'),

  ('address_line',
   'Sarıgüllük, 61030. Sk. No: 1/A, 27060 Şehitkamil / Gaziantep',
   'Açık adres. İşletme tarafından DOĞRULANDI (2026-08-27).'),

  -- Pazar günü ARTIK VARSAYIM DEĞİL — işletme "Pazar kapalı" olarak doğruladı.
  ('working_hours',
   'Pazartesi–Cumartesi 09:00–19:30 · Pazar kapalı',
   'Çalışma saatleri. Pazar dâhil işletme tarafından DOĞRULANDI (2026-08-27).')

on conflict (key) do update
  set value       = excluded.value,
      description = excluded.description,
      updated_at  = now();

-- ---------------------------------------------------------------------------
-- Doğrulama — çalıştırdıktan sonra dört satır da dolu görünmeli
-- ---------------------------------------------------------------------------
select key, value, description
from public.site_settings
where key in ('whatsapp_phone', 'phone_display', 'address_line', 'working_hours')
order by key;
