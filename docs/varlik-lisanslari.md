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
