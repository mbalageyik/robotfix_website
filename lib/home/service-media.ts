/*
  HİZMET PANELİ GÖRSELLERİ — `services.icon_key` → yerel fotoğraf.

  ---------------------------------------------------------------------------
  NEDEN ŞEMADA DEĞİL DE BURADA
  ---------------------------------------------------------------------------
  `services` tablosunda görsel alanı yoktur (bkz. migrasyon: name, slug,
  short/long_description, icon_key…). Şemaya bir `image_path` sütunu eklemek
  ve panelden yükletmek DOĞRU nihai çözümdür; ama o sütun bugün BOŞ olurdu:
  işletmenin henüz kendi atölye fotoğrafı yok. O yüzden burada, simge
  eşlemesinin (`components/ui/icons.tsx` → `SERVICE_ICONS`) yanında duran
  ikinci bir KOD EŞLEMESİ tutuluyor: aynı `icon_key` hem simgeyi hem geçici
  fotoğrafı seçer, veri modeli hiç kirlenmez.

  Tanınmayan ya da boş bir `icon_key` `null` döner: panel o zaman eski
  görünümünde — marka degradesi + büyük dekoratif simge — kalır. Yani bu
  eşleme bir GÜZELLEŞTİRME katmanıdır, hizmetin görünmesi ona bağlı değildir.

  ---------------------------------------------------------------------------
  GÖRSELLER YER TUTUCUDUR — ve gerçekmiş gibi sunulmaz
  ---------------------------------------------------------------------------
  Hiçbiri Robot Fix'in atölyesinde çekilmedi. Seçim ölçütü bilgi dosyası §20
  ile uyumlu olacak şekilde daraltıldı:

    - Ticari kullanıma açık, atıf gerektirmeyen lisans (Pexels License).
    - YEREL dosya; dış CDN'e hotlink yok (`docs/varlik-lisanslari.md`).
    - Kadrajda OKUNAKLI ÜÇÜNCÜ TARAF MARKASI YOK. Robot süpürge çekimlerinde
      gövde üzerindeki üretici adı ve tulumdaki başka bir servis firmasının
      adı kırpılarak dışarıda bırakıldı — aksi hâlde site okunmayan bir
      "yetkili servis / marka ortaklığı" iması üretirdi (§20).
    - Tanınabilir yüz yok: eller ve cihazlar var. Fotoğraf "bizim ekibimiz"
      izlenimi vermez.

  Görseller DEKORATİFTİR ve `alt=""` ile render edilir (`ServicePanels`).
  Hizmetin adı ve açıklaması panelde METİN olarak durur; fotoğraf hiçbir
  bilgiyi tek başına taşımaz (bilgi dosyası §14, §15). Bu yüzden alt metne
  "[ÖRNEK]" yazılmaz — ekran okuyucuya hiç duyurulmayan bir görselin
  yer tutuculuğunu ilan etmek, sekiz panelde tekrar eden bir gürültüdür.
  Yer tutucu kaydı bunun yerine üç yerdedir: bu dosyanın başlığı, aşağıdaki
  `TODO(business)` ve `docs/varlik-lisanslari.md` içindeki lisans satırları.

  TODO(business): gerçek Robot Fix atölye/servis fotoğrafları sağlandığında
  bu sekiz dosya değiştirilecek; kalıcı çözümde `services` tablosuna görsel
  alanı eklenip yönetim panelinden yüklenmesi tercih edilmelidir.

  ---------------------------------------------------------------------------
  TEK İŞLEM REÇETESİ — sekiz fotoğraf tek elden çıkmış gibi durur
  ---------------------------------------------------------------------------
  Kaynaklar farklı fotoğrafçılardan; ham hâlleriyle yan yana konsalardı
  (sarı fon, ahşap zemin, turkuaz tezgâh) bir "stok görsel kolajı" olurlardı.
  Hepsi aynı reçeteden geçirildi: 3:4 dikey kırpma → gri tonlama →
  otomatik kontrast → ortalama parlaklığı 104/255'e çeken gama →
  Gece Laciverti ↔ Buz Beyazı iki tonlaması → orijinalin doygunluğu düşürülmüş
  %18'inin geri karıştırılması. Reçetenin sayıları `docs/varlik-lisanslari.md`
  içinde kayıtlıdır; renk uçları paletin (§15) kendi tonlarıdır.
*/

/** Panel zemininde kullanılacak yerel fotoğraf. */
export interface ServiceImage {
  /**
   * `public/` altındaki yol. Uzak URL KABUL EDİLMEZ: hotlink her sayfa
   * açılışını üçüncü bir sunucuya bağlardı (`__tests__` bunu doğrular).
   */
  src: string;
}

/** Tüm hizmet fotoğraflarının ortak klasörü — bekçi testi bunu da doğrular. */
export const SERVICE_IMAGE_DIR = "/gorseller/hizmetler";

/*
  Anahtarlar `SERVICE_ICONS` ile AYNI kümedendir; bir hizmetin simgesi ve
  fotoğrafı ayrı iki isimle seçilmez. Her satırın sonundaki not, fotoğrafın
  ne gösterdiğini söyler — kadrajda ne olduğunu bilmeden dosya değiştirilmesin.
*/
const SERVICE_IMAGES: Record<string, ServiceImage> = {
  // Elde tutulan bir batarya/besleme modülü, stüdyo zemininde.
  battery: { src: `${SERVICE_IMAGE_DIR}/batarya-modulu.jpg` },
  // Sökülmüş bir motor ünitesi üzerinde ölçü probu tutan eller.
  motor: { src: `${SERVICE_IMAGE_DIR}/motor-olcum.jpg` },
  // Bir robot süpürgenin alt yüzü: fırça yuvası, tekerlek, paspas pedleri.
  brush: { src: `${SERVICE_IMAGE_DIR}/alt-yuz-firca-tekerlek.jpg` },
  // Üstünde döner lidar kulesi bulunan robot süpürge, yandan.
  sensor: { src: `${SERVICE_IMAGE_DIR}/lidar-sensor.jpg` },
  // Açılmış bir cihazın elektronik kartı üzerinde ölçüm.
  charging: { src: `${SERVICE_IMAGE_DIR}/kart-olcum.jpg` },
  // Elektronik tamir tezgâhı: ölçü aleti, el aletleri, açılmış cihaz.
  diagnose: { src: `${SERVICE_IMAGE_DIR}/ariza-tespit-tezgahi.jpg` },
  // Bir süpürgenin filtresinin motor ünitesi üzerinde değiştirilişi.
  service: { src: `${SERVICE_IMAGE_DIR}/filtre-degisimi.jpg` },
  // Sökülmüş ana fırça ve fırça kapağı, düz zeminde ürün çekimi.
  parts: { src: `${SERVICE_IMAGE_DIR}/yedek-parca-firca.jpg` },
};

/**
 * `icon_key` için yerel panel fotoğrafı. Anahtar yoksa, tanınmıyorsa veya
 * o hizmet için fotoğraf tanımlanmamışsa `null` — panel degrade + simge
 * zeminine düşer, bölüm yine eksiksiz görünür.
 */
export function getServiceImage(iconKey: string | null | undefined): ServiceImage | null {
  if (!iconKey) return null;
  return SERVICE_IMAGES[iconKey.trim().toLowerCase()] ?? null;
}

/** Bekçi testleri için: tanımlı tüm eşlemeler. */
export const SERVICE_IMAGE_ENTRIES = Object.entries(SERVICE_IMAGES);
