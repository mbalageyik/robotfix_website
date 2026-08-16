# Görsel ve video varlıklarının kaynak/lisans kaydı

> Bu dosya `public/` altındaki **her** üçüncü taraf varlığının nereden geldiğini
> ve hangi lisansla kullanıldığını kaydeder. Yeni bir varlık eklenirken buraya
> bir satır eklenmeden birleştirilmemelidir: lisans bilgisi olmayan varlık,
> ileride kaldırılması gereken bir yükümlülüktür.
>
> Projenin **kendi ürettiği** varlıklar (ör. `hero-ornek-gorsel.svg`) burada
> "proje varlığı" olarak geçer; onlar için dış lisans yoktur.

## Kayıt

| Dosya                                        | Tür   | Kaynak                                                                                   | Lisans                  | Atıf gerekir mi | Durum                   |
| -------------------------------------------- | ----- | ---------------------------------------------------------------------------------------- | ----------------------- | --------------- | ----------------------- |
| `public/gorseller/hero-ornek-gorsel.svg`     | SVG   | Proje varlığı (elle çizildi)                                                             | —                       | —               | Yer tutucu              |
| `public/videos/servis-vitrini.mp4`           | Video | Pixabay — "Repair, Electronics, Fix, Screw, Metal" (video id 9062, yükleyen: `padrinan`) | Pixabay Content License | Hayır           | **Geçici / yer tutucu** |
| `public/gorseller/servis-vitrini-poster.jpg` | JPEG  | Yukarıdaki videodan alınan tek kare                                                      | Pixabay Content License | Hayır           | **Geçici / yer tutucu** |

### Hizmet paneli fotoğrafları — `public/gorseller/hizmetler/`

Sekizinin de lisansı **Pexels License**'tır: ticari kullanıma açıktır, atıf
gerektirmez, değiştirilebilir. Sekizi de **yer tutucudur** — hiçbiri Robot Fix'in
atölyesinde çekilmedi. Kullanım yeri: ana sayfadaki hizmet panelleri
(`components/home/ServicePanels.tsx`, eşleme `lib/home/service-media.ts`).

| Dosya                        | Kaynak (Pexels id)                                             | Fotoğrafçı     | Kadrajda ne var                                           |
| ---------------------------- | -------------------------------------------------------------- | -------------- | --------------------------------------------------------- |
| `batarya-modulu.jpg`         | "Hand Holding Drone Battery Charger" (38042837)                | Amar Preciado  | Elde tutulan batarya/besleme modülü, stüdyo zemini        |
| `motor-olcum.jpg`            | "Technician Testing Electrical Motor Wires" (33531832)         | Bulat843       | Motor sargıları üzerinde ölçü probu tutan eller           |
| `alt-yuz-firca-tekerlek.jpg` | "Close-up of Robotic Vacuum Cleaner Underside" (35147161)      | Andrey Matveev | Robot süpürgenin alt yüzü: tekerlek, paspas, fırça yuvası |
| `lidar-sensor.jpg`           | "Modern White Robot Vacuum Cleaner on Wood Floor" (35147280)   | Andrey Matveev | Döner lidar kuleli robot süpürge, yandan                  |
| `kart-olcum.jpg`             | "Technician Repairing Circuit Board in Workshop" (38264252)    | Bulat843       | Açılmış cihazın elektronik kartı üzerinde ölçüm           |
| `ariza-tespit-tezgahi.jpg`   | "Close-up of Electronics Repair Workbench" (36027861)          | Eden FC        | Tamir tezgâhı: ölçü aleti, el aletleri, açılmış cihaz     |
| `filtre-degisimi.jpg`        | "Technician Replacing Air Filter in Vacuum Cleaner" (34404157) | Bulat843       | Süpürge filtresinin motor ünitesi üzerinde değişimi       |
| `yedek-parca-firca.jpg`      | "Vacuum Cleaner Parts on Bright Yellow Background" (33797539)  | Andrey Matveev | Sökülmüş ana fırça ve fırça kapağı, ürün çekimi           |

**Neden bu sekizi.** Ölçüt üç maddeydi: (1) konu gerçekten o hizmeti anlatsın —
uydurma bir "atölyemiz" sahnesi değil, cihazın/işin kendisi; (2) kadrajda
**okunaklı üçüncü taraf markası olmasın**; (3) tanınabilir yüz olmasın — eller
ve cihazlar var, "bizim ekibimiz" izlenimi yok. İkinci madde iki dosyada
kırpmayla sağlandı: `alt-yuz-firca-tekerlek.jpg` ve `lidar-sensor.jpg`
kaynaklarında gövde/etiket üzerinde üretici adı okunuyordu, ikisi de kadraj
dışında bırakıldı; `filtre-degisimi.jpg` kaynağında teknisyenin tulumunda
**başka bir servis firmasının adı** vardı, kadraj o satırın altından başlatıldı.
Gerekçe bilgi dosyası §20: yetkili servis statüsü ve marka ortaklığı
uydurulamaz — görsel yoluyla da ima edilemez.

**Neden yerele indirildi.** `servis-vitrini.mp4` ile aynı gerekçe: hotlink her
sayfa açılışını üçüncü bir sunucunun ayakta olmasına bağlardı. Dosyalar
projenin kendi `public/` klasöründedir; `next/image` onları buradan servis eder.

**Projeye alınırken yapılan işlem — sekizine de AYNI reçete** (Python/Pillow,
betik geçici çalışma klasöründeydi, projeye girmedi):

1. Kaynak Pexels CDN'inden 1400–1800 px genişlikte indirildi.
2. **3:4 dikey kırpma** — panel açıkken geniş, kapalıyken dar bir şerittir;
   dikey kaynak iki durumda da kadrajı ayakta tutar. Kırpma kutuları yukarıdaki
   "okunaklı marka" kuralına göre seçildi.
3. 1200×1600'e ölçeklendi (Lanczos).
4. Gri tonlama → `autocontrast` (kesme %1) → **ortalama parlaklığı 104/255'e
   çeken gama** (0,55–2,20 arasına sınırlı). Bu adım pozlamayı eşitler: sarı
   fonlu ürün çekimiyle loş tezgâh çekimi aynı ağırlığa gelir.
5. Kontrast ×1,06 → **iki tonlama**: siyah ucu `#0b1f33` (Gece Laciverti),
   orta `#2f5a7d`, **beyaz ucu `#a9bccd`** — Sis Grisi ile Çelik Mavisi
   arasında bir ara ton. Beyaz ucun kapatılması yalnız estetik değil: sekiz
   dosyanın hiçbirinde bağıl parlaklık **0,56'yı geçmiyor**, yani panel
   metninin kontrastı ölçülebilir bir ÜST SINIRA oturuyor. `ServicePanels`
   içindeki perde oranları (%15 / %75 ve iki degrade bandı) bu sayıdan
   türetildi; kontrast fotoğrafın hangi karesine denk geldiğine bırakılmadı.
6. Orijinalin doygunluğu %30'a indirilmiş hâli **%18 oranında geri karıştırıldı**
   — tümüyle düz bir filtre görüntüsü olmasın, fotoğraf kalsın diye.
7. JPEG, kalite 80, `optimize`, `progressive`. Toplam ≈ 1,6 MB
   (`__tests__/home-service-media.test.ts` dosya başına 500 KB ve toplamda
   3 MB üst sınırını bekliyor).

Reçete **tek** olduğu için sekiz fotoğraf yan yana geldiğinde tek elden çıkmış
gibi durur; ham hâlleriyle bir stok görsel kolajı olurlardı.

**Değiştirilecek.** Gerçek Robot Fix atölye/servis fotoğrafları sağlandığında bu
sekiz dosya değiştirilecek ve bu bölüm kayıttan kaldırılacaktır. Kalıcı çözümde
görselin `services` tablosuna taşınıp yönetim panelinden yüklenmesi tercih
edilmelidir (gerekçe: `lib/home/service-media.ts`).

## `servis-vitrini.mp4` — ayrıntı

**Sayfa:** <https://pixabay.com/videos/repair-electronics-fix-screw-metal-9062/>
**İndirilen dosya:** `https://cdn.pixabay.com/video/2017/05/10/9062-217261104_large.mp4`
(1920×1080, 40,5 sn, 22,8 MB)

**Lisans.** Pixabay Content License. Ticari kullanıma açıktır ve **atıf
gerektirmez** ("You don't need to ask permission from or provide credit to the
image author or Pixabay"). Bu kayıt yine de tutulur: kaynağı bilinmeyen bir
varlık, lisansı uygun olsa bile denetlenemez.

**Neden yerele indirildi.** Pixabay/Pexels gibi bir CDN'e hotlink verilseydi
her sayfa açılışı üçüncü bir sunucunun ayakta ve adresin değişmemiş olmasına
bağlı olurdu. Varlık projenin kendi `public/` klasöründedir.

**Projeye alınırken yapılan işlem** (macOS `avconvert` bit hızını
ayarlatmadığı için `AVAssetReader`/`AVAssetWriter` ile elle kodlandı —
`swiftc` betiği geçici çalışma klasöründeydi, projeye girmedi):

- 13,0 – 29,0 sn arası kırpıldı (16 sn)
- 1920×1080 → 1280×720 ölçeklendi
- H.264, ~1,1 Mbps ortalama bit hızı, `shouldOptimizeForNetworkUse` (fast-start)
- Ses kanalı **tümüyle atıldı** — arka plan videosu zaten sessiz oynatılır
- Sonuç: **2,2 MB** (`__tests__/home-content.test.ts` içinde 4 MB üst sınırı bekçisi var)

Poster, kodlanmış klipten 13,0. saniyedeki kare alınarak üretildi
(`AVAssetImageGenerator`, JPEG kalite ~0,72, 1280×720, 130 KB).

**Neden bu görüntü.** Robot süpürge gösteren, ticari kullanıma açık ve atıf
gerektirmeyen bir çekim bulunamadı. Seçilen klip bunun yerine **soyut kalır**:
bir cihazın metal alt kapağındaki vidaların tornavidayla sökülüşünün yakın
planıdır. Yüz, mekân, marka veya tanınabilir bir ürün göstermez — yani
Robot Fix'in atölyesini ya da ekibini **temsil ettiği izlenimi vermez**.
Gümüş-gri tonları "Güven veren teknoloji" paletiyle (§15) çakışmaz.

Görüntünün yer tutucu olduğu üç yerde işaretlidir: poster `alt` metninde
(`[ÖRNEK] … gerçek Robot Fix atölye çekimi yerine kullanılan geçici görüntü`),
`lib/home/content.ts` içindeki bölüm notunda ve `SERVICE_SHOWCASE.media`
üzerindeki `TODO` satırında.

**Değiştirilecek.** Gerçek Robot Fix atölye/servis çekimi sağlandığında bu iki
dosya ve poster `alt` metni birlikte güncellenecek, bu satır kayıttan
kaldırılacaktır.
