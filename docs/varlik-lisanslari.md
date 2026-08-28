# Görsel ve video varlıklarının kaynak/lisans kaydı

> Bu dosya `public/` altındaki **her** üçüncü taraf varlığının nereden geldiğini
> ve hangi lisansla kullanıldığını kaydeder. Yeni bir varlık eklenirken buraya
> bir satır eklenmeden birleştirilmemelidir: lisans bilgisi olmayan varlık,
> ileride kaldırılması gereken bir yükümlülüktür.
>
> Projenin **kendi ürettiği** varlıklar (ör. `hero-ornek-gorsel.svg`) burada
> "proje varlığı" olarak geçer; onlar için dış lisans yoktur.

## Kayıt

| Dosya                                        | Tür   | Kaynak                                                                                       | Lisans         | Atıf gerekir mi | Durum                   |
| -------------------------------------------- | ----- | -------------------------------------------------------------------------------------------- | -------------- | --------------- | ----------------------- |
| `public/gorseller/hero-ornek-gorsel.svg`     | SVG   | Proje varlığı (elle çizildi)                                                                 | —              | —               | Yer tutucu              |
| `public/videos/servis-vitrini.mp4`           | Video | Pexels — "A Robotic Vacuum Cleaner for Housekeeping" (video id 8566386, çeken: Kindel Media) | Pexels License | Hayır           | **Geçici / yer tutucu** |
| `public/gorseller/servis-vitrini-poster.jpg` | JPEG  | Yukarıdaki videodan alınan tek kare                                                          | Pexels License | Hayır           | **Geçici / yer tutucu** |
| `public/gorseller/vena-logo.png`             | PNG   | VenaTech marka varlığı — siteyi yapan stüdyonun logosu, işletme tarafından sağlandı          | Marka sahibinin izni | Evet (yapımcı atfı) | Kalıcı              |

**`vena-logo.png` hakkında.** Kaynak dosya 880×795 PNG'dir ve alt üçte biri
tamamen saydamdır; bu boşluk alfa sınırına kırpıldı (841×535), ardından 151×96'ya
ölçeklendi (~8 KB). Kullanım yeri yalnızca alt bilgideki yapımcı atfıdır
(`components/layout/SiteFooter.tsx`). Bu **üçüncü taraf bir marka varlığıdır**:
yeniden renklendirilmez, döndürülmez, oranı bozulmaz ve Robot Fix'in kendi
işareti gibi kullanılmaz. Logodaki kırmızı Robot Fix paletine eklenmemiştir.

### Açılış koreografisi — `public/gorseller/hero/`

Dört dosya da kaynak sayfasında “Free to use under the Unsplash License” olarak
yayımlanmıştır. Kullanım yeri ana sayfanın açılış koreografisidir
(`components/ui/scroll-choreography.tsx`). Görseller Robot Fix’in atölyesini,
ekibini veya resmî marka ilişkisini temsil etmez; bu durum alt metinlerde
`[ÖRNEK]` statüsüyle açıkça belirtilir.

| Dosya                          | Kaynak (Unsplash id)                                                                               | Fotoğrafçı / hesap                        | Kadrajda ne var                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------- |
| `elektronik-kart-onarimi.webp` | [Circuit board being repaired with a screwdriver](https://unsplash.com/photos/HpoYaT9-9aE)         | Fotografia Lui Vlad (`fotografialuivlad`) | Elektronik kart ve teknik tornavida             |
| `robot-supurge-kullanim.webp`  | [Robot vacuum cleans floor while family relaxes](https://unsplash.com/photos/u8EUjaYDrCA)          | Dreame Vacuum Cleaner (`dreametech`)      | Ev ortamında çalışan robot süpürge              |
| `robot-supurge-temizlik.webp`  | [Robot vacuum cleaning spilled water and debris on floor](https://unsplash.com/photos/PPOKwxqWOY0) | Dreame Vacuum Cleaner (`dreametech`)      | Zemindeki döküntüyü temizleyen robot süpürge    |
| `robot-supurge-tekerlek.webp`  | [A black robot vacuum cleaner on a light gray floor](https://unsplash.com/photos/3MtR6thHaek)      | Dreame Vacuum Cleaner (`dreametech`)      | Eşik aşarken tekerlek mekanizması görünen cihaz |

**Projeye alınırken yapılan işlem.** Kaynaklar Unsplash görsel CDN’inden 1.800 px
genişlikte, JPEG kalite 82 ile indirildi; ardından `cwebp` ile 1.600 px genişliğe
ölçeklenip kalite 78–80 aralığında WebP’ye çevrildi. Dört dosyanın toplamı yaklaşık
350 KB’tır. Sayfa uzak görsel adresine bağlanmaz; `next/image` yerel dosyaları uygun
ekran boyutuna göre yeniden örnekler.

**Değiştirilecek.** Gerçek Robot Fix atölye, cihaz ve parça fotoğrafları sağlandığında
bu dört dosya ve `HERO_CONTENT.images` alt metinleri birlikte güncellenecektir.

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

**Sayfa:** <https://www.pexels.com/video/a-robotic-vacuum-cleaner-for-housekeeping-8566386/>
**İndirilen dosya:** `https://videos.pexels.com/video-files/8566386/8566386-hd_1920_1080_30fps.mp4`
(1920×1080, 16,1 sn, 9,2 MB)

**Lisans.** Pexels License. Ticari kullanıma açıktır, **atıf gerektirmez** ve
değiştirilmeye izin verir. Bu kayıt yine de tutulur: kaynağı bilinmeyen bir
varlık, lisansı uygun olsa bile denetlenemez.

**Neden yerele indirildi.** Pexels CDN'ine hotlink verilseydi her sayfa açılışı
üçüncü bir sunucunun ayakta ve adresin değişmemiş olmasına bağlı olurdu. Varlık
projenin kendi `public/` klasöründedir.

**Neden bu görüntü.** Önceki yer tutucu (Pixabay 9062) bir cihazın alt
kapağındaki vidaların sökülüşüydü: tamir anlatıyordu ama **robot süpürge
göstermiyordu**. Bu klip tersini yapıyor — sığ alan derinlikli bir makro çekimde
cihazın gövde kenarı, tampon şeridi, gövde dikişi ve toz haznesi kapağı kadrajı
dolduruyor. Bölüm metni cihaza "açılıp incelenen bir bütün" olarak baktığını
söylüyor; kadraj da tam olarak o incelemenin mesafesinde duruyor.

Ücretsiz stok arşivlerinde **robot süpürge tamiri** gösteren, ticari kullanıma
açık bir çekim bulunamadı (Pexels ve Pixabay'de `robot vacuum repair`,
`robot vacuum maintenance`, `vacuum cleaner repair`, `robot vacuum brush`
sorguları tarandı; sonuçların tamamı cihazın normal çalışmasını gösteriyor).
Bu yüzden ikisinden biri seçilmek zorundaydı: konusu tamir olan ama cihazı
göstermeyen bir klip, ya da cihazı gösteren ama tamir göstermeyen bir klip.
İkincisi seçildi — sayfanın anlattığı ürün grubunun ne olduğu, tamirin nasıl
göründüğünden daha önemli.

**Marka.** Kaynak klipteki cihaz tanınabilir bir modeldir; kadrajda **okunaklı
marka adı ya da amblemi bırakılmadı**. Üretici amblemi klibin 12,0 – 14,0
saniyeleri arasında üst plakada görünüyor; kırpma penceresi (0,9 – 9,2 sn) bu
aralığın tamamını dışarıda bırakır. Gerekçe bilgi dosyası §20: yetkili servis
statüsü ve marka ortaklığı uydurulamaz, görsel yoluyla da ima edilemez.

**Projeye alınırken yapılan işlem** (macOS `avconvert` bit hızını
ayarlatmadığı, `AVAssetExportSession` de preset dışında hedef bit hızı kabul
etmediği için `AVAssetReader`/`AVAssetWriter` ile elle kodlandı — `swiftc`
betiği geçici çalışma klasöründeydi, projeye girmedi):

- 0,9 – 9,2 sn arası kırpıldı (8,3 sn); pencere yukarıdaki marka kuralına ve
  cihazın kadraja tam oturduğu aralığa göre seçildi
- 1920×1080 → 1280×720 ölçeklendi (kadrajı dolduran ölçek, siyah bant yok)
- **Hizmet panelleriyle aynı renk reçetesi**, tek bir `CIColorCubeWithColorSpace`
  küpüne pişirilerek uygulandı: %1 kesmeli autocontrast → ortalama parlaklığı
  116/255'e çeken gama (klibin kendi histogramından türetildi: `lo` 0,043,
  `hi` 0,933, gama 1,23) → kontrast ×1,06 → siyah ucu `#0b1f33`, ortası
  `#2f5a7d`, beyaz ucu `#c2d2df` olan iki tonlama → doygunluğu %30'a inmiş
  orijinalin **%24** oranında geri karıştırılması. Küp sRGB çalışma uzayında
  uygulanır; doğrusal uzayda tonlar kayardı.
- H.264 (Main), ~1,1 Mbps ortalama bit hızı, `shouldOptimizeForNetworkUse`
  (fast-start)
- Ses izi **hiç eklenmedi** — arka plan videosu zaten sessiz oynatılır
- Sonuç: **989 KB** (`__tests__/home-content.test.ts` içinde 4 MB üst sınırı
  bekçisi var)

Beyaz ucu panellerdeki `#a9bccd` yerine biraz daha açık olan `#c2d2df`, orijinal
karışım oranı da %18 yerine %24 seçildi. Gerekçe teknik: panellerde metin
fotoğrafın **üstünde** durduğu için parlaklığa ölçülebilir bir üst sınır
gerekiyordu; burada metin videonun üstünde değil, yanındaki sütunda
(`components/home/ServiceShowcaseSection.tsx`), o yüzden aynı tavan gerekmiyor
ve klip filtre görüntüsüne dönüşmeden fotoğraf olarak kalabiliyor.

Poster, **kodlanmış** klipten 3,4. saniyedeki kare alınarak üretildi
(`AVAssetImageGenerator`, JPEG kalite ~0,72, 1280×720, 48 KB). Kaynaktan değil
kodlanmış dosyadan alınır ki posterle videonun ilk karesi arasında renk ya da
ölçek farkı olmasın.

Görüntünün yer tutucu olduğu üç yerde işaretlidir: poster `alt` metninde
(`[ÖRNEK] … gerçek Robot Fix atölye çekimi yerine kullanılan geçici görüntü`),
`lib/home/content.ts` içindeki bölüm notunda ve `SERVICE_SHOWCASE.media`
üzerindeki `TODO` satırında.

**Değiştirilecek.** Gerçek Robot Fix atölye/servis çekimi sağlandığında bu iki
dosya ve poster `alt` metni birlikte güncellenecek, bu satır kayıttan
kaldırılacaktır.

## Geçici logo — `components/layout/Logo.tsx`

Sitenin logosu **henüz tasarlanmadı**. `Logo` bileşeni yer tutucudur ve dış bir
kaynaktan gelmez: sembol elle yazılmış bir SVG'dir (üstten görünen robot
süpürge — gövde dairesi, ön tampon yayı, lidar noktası), kelime işareti ise
gerçek metindir, görsel değil.

**Neden metin.** Ekran okuyucu adı doğrudan okur, arama motoru metni görür ve
marka adının iki kelime yazılması kuralı (CLAUDE.md) görsele gömülmüş bir
yazımla dolanılamaz. Bitişik yazım yalnız bir logo çiziminin İÇİNDE
serbesttir; burada çizim yok.

Bileşen `data-placeholder="gecici-logo"` özniteliği taşır — gerçek logo
geldiğinde aranacak işaret budur. Dış lisans yoktur; proje varlığıdır.

**Değiştirilecek.** Marka kimliği çalışması tamamlandığında bu bileşen ve bu
kayıt birlikte güncellenir.
