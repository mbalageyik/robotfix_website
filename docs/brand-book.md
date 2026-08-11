# Robot Fix — Marka Kitabı

> **Kapsam:** Bu belge Robot Fix web sitesinin görsel ve sözel sistemini tanımlar.
> Kaynak: `ROBOT_FIX_PROJE_BILGI_DOSYASI.md` §2, §14, §15, §16, §20 ve `CLAUDE.md`.
> **Durum:** Taslak — palet kullanıcı tarafından kilitlenmiştir, tipografi ve isimlendirme önerisi onay bekler.
> **Son güncelleme:** 11 Ağustos 2026

## 0. Bu belge ne, ne değil

**Bu belge şudur:** paletin rol karşılıkları, tipografi sistemi, token isimlendirme sözleşmesi,
ses/ton kuralları, bileşen anatomisi ve hareket sıfatları. Arayüz geliştiricisinin
`app/globals.css` `@theme` bloğunu yazarken uydurmak zorunda kalacağı hiçbir karar bırakmaz.

**Bu belge şu değildir:** logo tasarımı, işletme verisi kaynağı, içerik metni deposu.

**Kilitli olan:** renk paleti. Aşağıdaki hiçbir bölüm palet renklerini değiştirmez, yenisini
eklemez, "iyileştirme" önermez. Bir eşleşme WCAG eşiğini geçmiyorsa renk değil **kullanım
kapsamı** daraltılır.

**Uydurulmayan:** fiyat, stok, garanti, teslimat süresi, servis ücreti, satış adedi, müşteri
yorumu, memnuniyet oranı, yetkili servis statüsü, marka ortaklığı, sertifika, pazaryeri
bağlantısı, iade/kargo koşulu (bilgi dosyası §20).

---

## 1. Konumlandırma gerilimi

### 1.1 Dördüncü geçiş: doğru sıfatlar

Bilgi dosyası §2 ve §3'ten çıkan, Robot Fix için **gerçekten doğru** olan sıfatlar:

| Sıfat                      | Dayanağı                                                                |
| -------------------------- | ----------------------------------------------------------------------- |
| Teşhis edici               | §3.2 arıza tespiti; §10 servis süreci 1. adım arızayı bildirme          |
| Çok markalı                | §10 iRobot'tan Zaco'ya 13+ marka; §2 "farklı marka ve modellere çözüm"  |
| Elle temaslı               | §3 fiziksel işletme + kargo kabulü; cihaz fiziksel olarak elden geçiyor |
| Konuşarak satan            | §8 WhatsApp ana dönüşüm kanalı; sepet değil sohbet                      |
| Yerel ama uzaktan erişilir | §10 Gaziantep Şehitkamil adresi + §4 şehir dışı kargo                   |
| Temkinli                   | §20 doğrulanmamış hiçbir iddiada bulunmama zorunluluğu                  |

### 1.2 Çarpışan çift

**"Mağaza" ile "servis" çarpışıyor.**

Mağaza mantığı hız ister: filtrele, karşılaştır, sepete at, öde. Servis mantığı yavaşlık ister:
cihazın modeli ne, belirti ne, parça uyumlu mu, önce bakalım. §6'daki yönetilebilir katalog
birinci mantığı, §5'teki hizmet listesi ve §8'deki WhatsApp akışı ikinci mantığı dayatıyor.
İki mantık aynı sayfada aynı anda yaşamak zorunda.

### 1.3 Gerilim cümlesi

> **Robot Fix bir parça satıcısıdır, ama parçayı satmadan önce arızayı teşhis eder.**
> Bu yüzden site bir **tezgâhı olan servis** gibi hissettirmeli: ürün görünür ve satın
> alınabilir, fakat her ürünün arkasında "sizin cihazınıza uyar mı?" sorusunu soracak biri var.

Sistemdeki karşılığı — bu üç kural gerilimi somutlaştırır ve **ihlal edilirse marka bozulur**:

1. **Hiçbir ürün kartı, uyumluluk sorusu olmadan bitmez.** Fiyatın altındaki son satır her
   zaman uyumluluk/soru satırıdır, "sepete ekle" değil.
2. **Fiyat boşluğu ölü uç değildir.** Fiyat yoksa yerinde "Fiyat için iletişime geçin" durur;
   bu bir eksik değil, teşhis davetidir (§6 fiyat kuralı bunu zaten zorunlu kılıyor).
3. **Koyu yüzey anlatır, açık yüzey karar verdirir.** §15'in yüzey stratejisi gerilimin
   görsel biçimidir: sinema kararı bozmaz, karar sinemayı bozmaz.

### 1.4 Yanlışlanabilirlik testi

**Test:** Bu palet / tipografi / ses, Gaziantep'teki başka bir robot süpürge parça satıcısında
da aynı derecede çalışır mıydı?

- **Çalışırdı ise:** varsayılan üretmişiz, marka değil. Yeniden yap.
- **Çalışmaz ise:** neden çalışmaz, tek cümleyle yazılabilmeli.

Robot Fix'te cevabı: _çalışmaz, çünkü bu sistem ürün akışını teşhis akışına tabi kılıyor._
Sepet çıkarıp WhatsApp koyan, fiyat yokluğunu hata değil giriş kapısı sayan, koyu yüzeyi
yalnızca anlatıya ayırıp katalogdan söken bir sistem; "ucuz parça" konumlandırmasıyla
çalışan bir rakipte çöker — o rakibin ihtiyacı hız ve fiyat teşhiri, teşhis değil.

### 1.5 Reddedilen sürümler (yanlışlanmış)

| Reddedilen konum                                       | Neden reddedildi                                                                                                                                                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"Uygun fiyatlı robot süpürge parça pazarı"**         | §2 açıkça "yalnızca yedek parça satan mağaza olarak konumlandırılmamalıdır" diyor. Ayrıca fiyat verisi doğrulanmamış (§20); fiyat üzerine kurulu bir konum ilk günden yalan söyler.                                                       |
| **"Premium teknoloji markası" (neon/karanlık kimlik)** | §15 mevcut siyah + parlak yeşil yaklaşımının "oyuncu ürünü, kripto veya deneysel teknoloji" algısına kaydığını söylüyor. Robot Fix üretici değil servis; ürün fotoğraflarının renk doğruluğu ve fiyat okunabilirliği bu kimlikte bozulur. |
| **"Yetkili servis ağı"**                               | §10 ve §20 bunu yasaklıyor: marka listesi yetkili servis statüsü anlamına gelmez, doğrulanmadan ima edilemez.                                                                                                                             |
| **"Türkiye'nin en hızlı robot süpürge servisi"**       | §16 kanıtlanmamış mutlak iddiaları yasaklıyor; §10'daki "1 gün ortalama teslimat" iddiası doğrulanmamış.                                                                                                                                  |

---

## 2. Marka yazımı ve wordmark yönü

> **Kapsam uyarısı:** Logo tasarımı bu belgenin dışındadır (§21'de kullanıcıdan alınacak
> maddeler arasında "nihai logo ve marka yazımı" var). Aşağıdakiler **yazım standardı önerisi**
> ve **wordmark karakteri** yönüdür; çizim değildir.

### 2.1 Tavsiye: **Robot Fix** (iki kelime, boşluklu)

§2 ana marka adını "Robot Fix", mevcut sitenin görsel yazımını "RobotFix" olarak kaydediyor.
Yeni sistemde **her yerde "Robot Fix"** kullanılması önerilir.

| Gerekçe                      | Açıklama                                                                                                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Konumu doğru okutur**      | "Robot Fix" bir _eylem_ okur (robot + onarım). "RobotFix" bir _ürün/uygulama adı_ okur — SaaS, app, gadget. CamelCase, tam da §15'in uzak durmamızı istediği "tech startup" registerine çeker. Yazımın kendisi §1.3'teki gerilimi çözer. |
| **Eski siteyi tekrar etmez** | §22.11: "Mevcut siteyi yeniden üretme." "RobotFix" eski sitenin görsel imzasıdır.                                                                                                                                                        |
| **Arama ve okunurluk**       | "robot" ve "fix" ayrı belirteçler olarak kalır; başlık etiketlerinde "Robot Fix — Robot Süpürge Teknik Servisi" doğal okunur.                                                                                                            |
| **Erişilebilirlik**          | Ekran okuyucular boşluklu formu güvenilir okur; camelCase'te "robotfix" tek hece yığını olarak seslendirilebilir.                                                                                                                        |
| **Alan adı çelişkisi yok**   | `robotfix.com.tr` küçük ve bitişik kalır; alan adı yazım kuralını bağlamaz.                                                                                                                                                              |

### 2.2 Kritik Türkçe tuzağı: `text-transform: uppercase`

**"Fix" kelimesi Türkçe yerelde büyük harfe çevrildiğinde `FİX` olur.**

`<html lang="tr">` ayarlandığında (ki §Türkçe site için ayarlanmak zorunda) tarayıcı Unicode'un
Türkçe kural setini uygular: `i` (U+0069) → `İ` (U+0130). Yani CSS `text-transform: uppercase`
uygulanan bir "Robot Fix" **ROBOT FİX** olarak ekrana çıkar.

**Kural:** Marka adına hiçbir koşulda `text-transform: uppercase` uygulanmaz. Wordmark inline
SVG veya `<img>` olarak servis edilir; metin olarak yazıldığı yerlerde `text-transform: none`
açıkça sabitlenir. Aynı tuzak JavaScript'te de vardır: `"Fix".toLocaleUpperCase("tr-TR")` →
`"FİX"`. Marka adı üzerinde büyük harf dönüşümü yapan bir yardımcı fonksiyon yazılmaz.

Tümüyle büyük harf gerekiyorsa (ör. bir rozet) metin kaynakta zaten `ROBOT FIX` olarak yazılır,
dönüşümle üretilmez.

### 2.3 Yazım standardı

| Doğru                                               | Yanlış                                                       |
| --------------------------------------------------- | ------------------------------------------------------------ |
| Robot Fix                                           | RobotFix, Robotfix, ROBOT FİX, robot fix, Robot-Fix, RoboFix |
| Robot Fix'in, Robot Fix'e, Robot Fix'ten            | Robot Fix'İn, Robot Fixin, Robot Fix'İn                      |
| Kesme işareti tipografik: `’` (U+2019)              | Düz tırnak: `'` (U+0027)                                     |
| Cümle içinde her zaman Title Case                   | Vurgu için büyütme/eğme/renklendirme                         |
| JSON-LD `name`, `<title>`, `alt` metni: "Robot Fix" | Yapılandırılmış veride farklı yazım                          |

Ekler her zaman kesme ile ve **küçük harfle** ayrılır; "Fix" özel ad olduğu için ek noktalı i
kuralına takılmaz: `Robot Fix’in`, `Robot Fix’e`, `Robot Fix’ten`.

### 2.4 İsim alanı (naming territory)

Bu marka adının oturduğu bölge — gelecekte alt hizmet/koleksiyon adı üretilirse aynı bölgede kalır:

| Eksen                  | Karar                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tür                    | **Bileşik-tanımlayıcı** (compound-descriptive). Uydurma isim değil; ne yaptığını söylüyor.                                                            |
| Register               | Ciddi, sade, teknik. Kelime oyunu yok, ünlem yok, süperlatif yok.                                                                                     |
| Hece ağırlığı          | 3 hece, ilk kelime uzun + ikinci kelime kısa ve kapanışlı ("Fix" tek kapalı hece). Alt hizmet adları bu ritmi korur: uzun tanımlayıcı + kısa kapanış. |
| Dil karışımı           | Türkçe bağlam + tek İngilizce teknik kelime. Bu karışım artırılmaz — yeni İngilizce kelime eklenmez.                                                  |
| Alt marka örneği (yön) | "Robot Fix Seçkisi" (§6'da zaten geçen kabul edilebilir form). "Robot Fix Pro", "RF Lab", "FixPoint" gibi türetmeler bölge dışıdır.                   |

### 2.5 Wordmark karakteri (yön; çizim değil)

| Nitelik              | Yön                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Harf ağırlığı        | SemiBold–Bold (600–700). Black/Heavy **hayır** — bağırma otorite değildir.                                                                                                                                                                                                                                                               |
| Harf aralığı         | Sıkı: −0.02em ile −0.03em. Sıkışık değil; "Robot" ve "Fix" arasındaki boşluk normal kelime boşluğunun ~%85'i.                                                                                                                                                                                                                            |
| Kutu                 | Title Case. Tümü büyük harf yasak (§2.2), tümü küçük harf marka ciddiyetini düşürür.                                                                                                                                                                                                                                                     |
| İskelet              | Neo-grotesk; dikey terminaller, dar apertürler, düşük kontrast. Geometrik-daire ("o" tam daire) **hayır** — oyuncak hissi verir. Yazı karakterli/el yazısı **hayır**.                                                                                                                                                                    |
| Genişlik             | Normal veya çok hafif dar. Genişletilmiş **hayır**; yatay yer tüketimi mobil başlıkta sorun.                                                                                                                                                                                                                                             |
| **Tek kasıtlı jest** | Yalnızca **bir** tane olacak: `Fix` kelimesindeki **i harfinin noktası (tittle)**, Hassas Camgöbeği `#3FC7D3` renginde küçük bir **kare** olur. Gerekçe: kare nokta = sensör/LiDAR ışığı; kilitli paletteki tek "teknoloji vurgusu" rengini markanın en küçük detayına yerleştirir; §15'in "camgöbeği yalnız mikro detay" kuralına uyar. |
| Tek renkli sürüm     | Jest tek renkte kaybolur (nokta kare kalır, renk gitmeyebilir). Faks/oyma/tek renk baskıda kare biçim korunur, renk değil.                                                                                                                                                                                                               |

**Yap / Yapma**

| Yap                                                                                      | Yapma                                                                                 |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Wordmark'ı tek renkte (Gece Laciverti veya beyaz) kullan                                 | Wordmark'a gradyan, parıltı, gölge, dış çizgi ekle                                    |
| Camgöbeği kare noktayı tek vurgu olarak bırak                                            | İkinci bir vurgu ekle (ör. "Robot"u da renklendirmek)                                 |
| Etrafında en az bir "R" harfi yüksekliği kadar boşluk bırak                              | Fotoğraf/3D sahne üzerine doğrudan, kutu veya karartma olmadan yerleştir              |
| Koyu zeminde beyaz sürümü kullan                                                         | Koyu zeminde Güven Yeşili veya Güven Mavisi sürüm kullan (kontrast düşük — bkz. §3.6) |
| Robot süpürge simgesi gerekiyorsa **wordmark'tan ayrı**, opsiyonel bir işaret olarak tut | Wordmark'ın içine robot çizimi gömmek                                                 |
| Minimum genişliği belirle ve altına inme (öneri: 96px dijital)                           | Küçültüp kare noktanın kaybolmasına izin vermek                                       |

---

## 3. Renk sistemi

### 3.1 Kilitli palet — HEX ve OKLCH karşılıkları

OKLCH değerleri sRGB → linear → Oklab dönüşümüyle hesaplanmıştır. `L` yüzde olarak,
`C` 0–0.4 aralığında, `H` derece cinsindendir. Değerler ~3 anlamlı basamağa yuvarlanmıştır.

**Marka renkleri**

| Renk adı             | HEX       | OKLCH                      | Rol                                                   |
| -------------------- | --------- | -------------------------- | ----------------------------------------------------- |
| Gece Laciverti       | `#0B1F33` | `oklch(23.4% 0.047 250.5)` | Ana koyu; hero, footer, 3D zemin, açık zeminde başlık |
| Servis Laciverti     | `#123B5D` | `oklch(34.2% 0.075 247.4)` | Kart başlığı, navigasyon, koyu yüzey                  |
| Güven Mavisi         | `#1769AA` | `oklch(50.8% 0.127 248.3)` | Bağlantı, ikincil buton, aktif filtre, odak halkası   |
| Güven Yeşili         | `#0B6E4F` | `oklch(47.8% 0.097 164.8)` | **Ana CTA** (genel eylemler)                          |
| Koyu WhatsApp Yeşili | `#075E54` | `oklch(43.4% 0.075 182.2)` | **Yalnız** WhatsApp eylemleri                         |
| Hassas Camgöbeği     | `#3FC7D3` | `oklch(76.3% 0.115 203.7)` | Teknoloji vurgusu, 3D ışık, mikro detay               |
| Buz Beyazı           | `#F5F8FA` | `oklch(97.7% 0.004 233.5)` | Ana açık zemin                                        |
| Saf Beyaz            | `#FFFFFF` | `oklch(100% 0 0)`          | Kart zemini                                           |
| Koyu Arduvaz         | `#334155` | `oklch(37.2% 0.039 257.3)` | Gövde metni                                           |
| Sis Grisi            | `#D7E0E8` | `oklch(90.2% 0.015 244.3)` | Sınır/ayırıcı (dekoratif — bkz. §3.6)                 |
| Sinematik koyu zemin | `#0B0F14` | `oklch(16.7% 0.012 254.2)` | **Yalnız** 3D/sinematik bölüm                         |

**Durum renkleri** (marka vurgularından ayrı; her zaman metin + simge ile)

| Durum  | HEX       | OKLCH                      |
| ------ | --------- | -------------------------- |
| Başarı | `#067647` | `oklch(49.9% 0.117 157.1)` |
| Bilgi  | `#175CD3` | `oklch(50.9% 0.195 260.9)` |
| Uyarı  | `#B54708` | `oklch(53.9% 0.156 43.0)`  |
| Hata   | `#B42318` | `oklch(50.0% 0.182 29.5)`  |
| Nötr   | `#475467` | `oklch(44.2% 0.035 257.8)` |

**Palet okuması.** Marka çekirdeği H≈247–258 arasında dar bir lacivert koridorunda oturuyor
(Gece Laciverti 250.5, Servis Laciverti 247.4, Güven Mavisi 248.3, Koyu Arduvaz 257.3,
Sis Grisi 244.3, Buz Beyazı 233.5) — nötrler bile aynı yönde soğuk tonlanmış, bu paletin
tesadüf değil sistem olduğunun kanıtı. Eylem renkleri (164.8 ve 182.2) tek bir yeşil-camgöbeği
bölgesinde; Hassas Camgöbeği 203.7 ile o bölgeyle lacivert koridoru arasında köprü kuruyor.
Kroma uçlarda kısılmış: en açık (Buz Beyazı C=0.004) ve en koyu (Sinematik C=0.012) uçlarda
neredeyse nötr, ortada tepe yapıyor (Güven Mavisi C=0.127). Bu, yeni ton üretilmesi
gerektiğinde uyulacak yapıdır.

### 3.2 Yüzey stratejisi (§15 kilitli)

| Yüzey                         | Renk                                          | Nerede                                                                            |
| ----------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| Açık nötr (~%70)              | `#F5F8FA` / `#FFFFFF`                         | Katalog, ürün detayı, hizmet açıklaması, form, SSS, iletişim — **karar alanları** |
| Lacivert yapı (~%20)          | `#0B1F33` / `#123B5D`                         | Hero, footer, navigasyon, marka anlatısı bölümleri                                |
| Vurgu (~%10 veya altı)        | `#0B6E4F` / `#1769AA` / `#075E54` / `#3FC7D3` | Butonlar, bağlantılar, aktif durumlar, mikro detay                                |
| Sinematik (kapsam dışı sayaç) | `#0B0F14`                                     | **Yalnız** 3D sahne bölümü. Kataloğa, ürün detayına, forma girmez.                |

Koyu ve açık yüzeyler rastgele karıştırılmaz. Bir sayfada koyu→açık geçişi bir **bölüm sınırı**
demektir; bölüm ortasında yüzey değişmez.

### 3.3 WCAG kontrast — hesaplama yöntemi

Her kanal için: `c = C/255`; `c ≤ 0.04045` ise `c/12.92`, değilse `((c+0.055)/1.055)^2.4`.
Bağıl parlaklık `L = 0.2126·R + 0.7152·G + 0.0722·B`.
Kontrast oranı `(L_açık + 0.05) / (L_koyu + 0.05)`.

Hesaplanan bağıl parlaklıklar:

| Renk      | L (bağıl parlaklık) |
| --------- | ------------------- |
| `#FFFFFF` | 1.000000            |
| `#F5F8FA` | 0.934495            |
| `#D7E0E8` | 0.735845            |
| `#3FC7D3` | 0.466069            |
| `#B54708` | 0.143478            |
| `#0B6E4F` | 0.117875            |
| `#067647` | 0.134505            |
| `#1769AA` | 0.131877            |
| `#175CD3` | 0.125395            |
| `#B42318` | 0.109714            |
| `#075E54` | 0.086907            |
| `#475467` | 0.086596            |
| `#334155` | 0.051404            |
| `#123B5D` | 0.040469            |
| `#0B1F33` | 0.012903            |
| `#0B0F14` | 0.004633            |

Eşikler: normal metin **4.5:1** (AA), büyük metin **3:1** (AA-large; ≥24px normal veya
≥18.66px kalın), metin dışı arayüz öğesi/sınır/odak **3:1**, AAA normal metin **7:1**.

### 3.4 §15'teki temel eşleşmeler — hesaplanmış sonuçlar

| #   | Ön plan   | Zemin     | Oran        | AA (4.5:1) | AA-large (3:1) | AAA (7:1) | Karar                                                                                                                               |
| --- | --------- | --------- | ----------- | ---------- | -------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `#FFFFFF` | `#0B1F33` | **16.69:1** | ✅         | ✅             | ✅        | Sınırsız kullan. Hero başlığı, footer metni, koyu bölüm gövdesi.                                                                    |
| 2   | `#0B1F33` | `#F5F8FA` | **15.65:1** | ✅         | ✅             | ✅        | Sınırsız. Açık sayfalarda başlık ve önemli metin.                                                                                   |
| 3   | `#FFFFFF` | `#0B6E4F` | **6.25:1**  | ✅         | ✅             | ❌        | Ana CTA metni olarak kullan. AAA hedeflenen alanlarda (uzun okuma bloğu) zemin rengi olarak kullanılmaz — buton ve rozetle sınırlı. |
| 4   | `#FFFFFF` | `#075E54` | **7.67:1**  | ✅         | ✅             | ✅        | WhatsApp butonu. Paletin en güvenli dolu-buton eşleşmesi.                                                                           |
| 5   | `#FFFFFF` | `#1769AA` | **5.77:1**  | ✅         | ✅             | ❌        | Dolu ikincil buton, aktif filtre çipi. Uzun metin zemini değil.                                                                     |
| 6   | `#0B1F33` | `#3FC7D3` | **8.20:1**  | ✅         | ✅             | ✅        | Rozet ve vurgu yüzeyi. **Yalnız koyu lacivert metinle**; bkz. §3.6 uyarısı.                                                         |
| 7   | `#334155` | `#FFFFFF` | **10.35:1** | ✅         | ✅             | ✅        | Gövde metninin varsayılanı. Kart içi paragraflar.                                                                                   |
| 8   | `#334155` | `#F5F8FA` | **9.71:1**  | ✅         | ✅             | ✅        | Gövde metninin sayfa zemininde karşılığı.                                                                                           |

**Sekiz temel eşleşmenin tamamı AA'yı geçiyor.** Dördü AAA'yı da geçiyor. Bilgi dosyası §15'in
"AA hedefini karşılayabilecek değerler sunar" ifadesi doğrulanmıştır.

### 3.5 Ek hesaplanmış eşleşmeler (geçenler)

| Ön plan   | Zemin     | Oran    | Sonuç  | Kullanım                                                                        |
| --------- | --------- | ------- | ------ | ------------------------------------------------------------------------------- |
| `#FFFFFF` | `#0B0F14` | 19.22:1 | AAA ✅ | Sinematik bölüm metni (DOM'da, Canvas'ta değil)                                 |
| `#FFFFFF` | `#123B5D` | 11.61:1 | AAA ✅ | Navigasyon ve koyu kart metni                                                   |
| `#F5F8FA` | `#0B1F33` | 15.65:1 | AAA ✅ | Koyu yüzeyde gövde metni                                                        |
| `#F5F8FA` | `#123B5D` | 10.88:1 | AAA ✅ | Koyu kart gövdesi                                                               |
| `#D7E0E8` | `#0B1F33` | 12.49:1 | AAA ✅ | **Koyu yüzeyde yardımcı/soluk metin** — Sis Grisi'nin koyu zemindeki gerçek işi |
| `#D7E0E8` | `#123B5D` | 8.69:1  | AAA ✅ | Koyu kartta yardımcı metin                                                      |
| `#3FC7D3` | `#0B1F33` | 8.20:1  | AAA ✅ | Koyu yüzeyde bağlantı/vurgu (alt çizgiyle)                                      |
| `#3FC7D3` | `#0B0F14` | 9.45:1  | AAA ✅ | Sinematik bölümde vurgu                                                         |
| `#1769AA` | `#FFFFFF` | 5.77:1  | AA ✅  | Metin bağlantısı (alt çizgiyle)                                                 |
| `#1769AA` | `#F5F8FA` | 5.41:1  | AA ✅  | Sayfa zemininde metin bağlantısı                                                |
| `#475467` | `#FFFFFF` | 7.69:1  | AAA ✅ | Soluk metin (`text-muted`) ve **form sınırı** (3:1 üstü)                        |
| `#0B6E4F` | `#FFFFFF` | 6.25:1  | AA ✅  | Çerçeveli (outline) CTA metni                                                   |
| `#FFFFFF` | `#067647` | 5.69:1  | AA ✅  | Başarı rozeti                                                                   |
| `#FFFFFF` | `#175CD3` | 5.99:1  | AA ✅  | Bilgi rozeti                                                                    |
| `#FFFFFF` | `#B54708` | 5.43:1  | AA ✅  | Uyarı rozeti                                                                    |
| `#FFFFFF` | `#B42318` | 6.57:1  | AA ✅  | Hata rozeti/mesajı                                                              |

### 3.6 ❗ Eşiği geçemeyen eşleşmeler — renk değişmez, **kullanım daralır**

Aşağıdakiler hesaplanmış **başarısızlıklardır**. Palet kilitli olduğu için çözüm renk
değiştirmek değil, o rengin o rolde kullanımını yasaklamaktır.

#### 3.6.1 `#D7E0E8` (Sis Grisi) sınır olarak beyaz üzerinde — **1.34:1** ❌

| Karşılaştırma          | Oran   | Eşik             | Sonuç |
| ---------------------- | ------ | ---------------- | ----- |
| `#D7E0E8` on `#FFFFFF` | 1.34:1 | 3:1 (metin dışı) | ❌    |
| `#D7E0E8` on `#F5F8FA` | 1.25:1 | 3:1              | ❌    |

**Sınırlama:** Sis Grisi **yalnızca dekoratif ayırıcıdır**. İzin verilen: kart içi bölme
çizgisi, tablo satır ayırıcısı, bölüm ayırıcısı, kartın kendi görsel kenarı (kartın varlığı
zemin farkıyla da anlaşılıyorsa).

**Yasak:** form alanı (input/select/textarea) sınırı, seçilebilir çipin sınırı, onay
kutusu/radyo sınırı, odak göstergesi, buton çerçevesi. Bunlar WCAG 2.2 _Non-text Contrast_
kapsamındadır ve 3:1 gerektirir.

**Bu roller için kilitli palette geçen renkler:** `#475467` (7.69:1), `#334155` (10.35:1),
`#1769AA` (5.77:1). Form sınırı için `#475467`, odak halkası için `#1769AA` kullanılır.

#### 3.6.2 `#1769AA` (Güven Mavisi) koyu lacivert üzerinde — **2.89:1** ❌

| Karşılaştırma          | Oran   | Eşik             | Sonuç         |
| ---------------------- | ------ | ---------------- | ------------- |
| `#1769AA` on `#0B1F33` | 2.89:1 | 4.5:1 (metin)    | ❌            |
| `#1769AA` on `#0B1F33` | 2.89:1 | 3:1 (metin dışı) | ❌ (kıl payı) |
| `#1769AA` on `#0B0F14` | 3.24:1 | 4.5:1            | ❌            |

**Sınırlama:** Güven Mavisi **koyu yüzeylerde bağlantı, metin, ikon veya sınır rengi olamaz.**
Yalnızca açık yüzeylerde (`#FFFFFF`, `#F5F8FA`) kullanılır.

**Koyu yüzeyde bağlantının çözümü (renk değişmeden):** `--color-link-on-dark` = `#3FC7D3`
(8.20:1 ✅) + kalıcı alt çizgi. §15 zaten "bağlantılar yalnızca renk farkıyla bırakılmamalı"
diyor; alt çizgi burada tercih değil zorunluluk. Camgöbeğinin "mikro detay" sınırını korumak
için: **koyu bir bölümde en fazla 3 camgöbeği bağlantı**; daha fazlası varsa bölüm açık
yüzeye taşınır.

#### 3.6.3 Buton yüzeylerinin koyu zemine karşı sınırı — **2.67:1 / 2.18:1** ❌

| Karşılaştırma                | Oran   | Eşik             | Sonuç |
| ---------------------------- | ------ | ---------------- | ----- |
| `#0B6E4F` yüzey on `#0B1F33` | 2.67:1 | 3:1 (metin dışı) | ❌    |
| `#075E54` yüzey on `#0B1F33` | 2.18:1 | 3:1              | ❌    |
| `#0B6E4F` yüzey on `#123B5D` | 1.86:1 | 3:1              | ❌    |

Butonun _içindeki_ beyaz metin sorunsuz (6.25:1 / 7.67:1). Sorun butonun **kenarının** koyu
zeminden ayrışmaması — kullanıcı butonun nerede bittiğini göremez.

**Sınırlama:** Koyu yüzeyde (hero, footer, sinematik bölüm) dolu butonlar **1px açık kenarlık
zorunlu** taşır. Kenarlık rengi: `#677684` (Sis Grisi'nin Gece Laciverti ile %45 karışımı) —
`#0B1F33` üzerinde **3.58:1 ✅**. Bu yeni bir marka rengi değil, iki kilitli rengin türevidir
ve yalnızca koyu yüzey kenarlığı rolünde yaşar.

Alternatif (kenarlık istenmiyorsa): buton `#123B5D` bir kart üzerine değil, doğrudan
`#0B1F33` üzerine konur ve **en az 2px `#F5F8FA` gölge halkası** taşır (15.65:1).

#### 3.6.4 `#3FC7D3` üzerinde beyaz metin — **2.03:1** ❌

| Karşılaştırma          | Oran   | Eşik  | Sonuç |
| ---------------------- | ------ | ----- | ----- |
| `#FFFFFF` on `#3FC7D3` | 2.03:1 | 4.5:1 | ❌    |
| `#3FC7D3` on `#FFFFFF` | 2.03:1 | 3:1   | ❌    |

**Sınırlama:** Camgöbeği üzerine **asla beyaz metin** yazılmaz; camgöbeği rozetinin metni her
zaman `#0B1F33` olur (8.20:1 ✅). Ayrıca camgöbeği **açık zeminde metin, ikon, sınır veya odak
rengi olarak kullanılamaz** — açık yüzeyde yalnızca dolgu/grafik öğe olarak, üzerinde koyu
metinle yaşar.

### 3.7 Kırmızı ve durum kuralı

- Kırmızı (`#B42318`) **yalnız** form hatası, kritik uyarı ve gerçek stok problemi.
  **Asla** alışveriş butonu, indirim rozeti, "acele et" bandı, sayaç.
- Durum bilgisi hiçbir zaman tek başına renkle anlatılmaz: **renk + metin + simge**
  (`CLAUDE.md` ihlal edilemez kural). "Stokta" / "Siparişle" / "Sınırlı stok" / "Tükendi"
  metinleri her zaman görünür.
- Durum renkleri marka vurgu renkleriyle **karıştırılmaz**: `#067647` (durum başarı) ile
  `#0B6E4F` (marka CTA) aynı bileşende yan yana kullanılmaz — kullanıcı ikisini aynı sanır.
  CTA yeşili yalnız butonda, durum yeşili yalnız rozet/mesajda.
- **Neon yeşil `#20D994` sistemin hiçbir yerinde yoktur.** Alternatif palet A yalnızca
  `#0B0F14` sinematik zemini için, tek token olarak alınmıştır.

---

## 4. Tipografi sistemi

### 4.1 Seçim

| Rol                          | Aile               | Tür                       | Kaynak                                       | Gerekçe                                                                                                                                                                                                                                                                        |
| ---------------------------- | ------------------ | ------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Başlık (display)**         | **Archivo**        | Değişken (`wght`)         | Google Fonts / `next/font/google`, self-host | Neo-grotesk. Dar apertürler, dikey terminaller, düşük kontrast — "mühendislik/kurumsal" iskeleti. Büyük boylarda sıkı tracking ile sinematik, küçükte hâlâ okunur. Omnibus-Type yapımı; Latin diakritikleri (dâhil `ğ ş ı İ`) birinci sınıf vatandaş, sonradan eklenmiş değil. |
| **Gövde (text)**             | **Manrope**        | Değişken (`wght` 200–800) | Google Fonts / `next/font/google`, self-host | Yarı-geometrik, geniş sayaçlar, açık apertürler. Türkçenin uzun sondan-eklemeli kelimelerinde 17–18px'te nefes alır. Tek dosya değişken font — 3D bütçesi olan bir sitede ağırlık kritik.                                                                                      |
| **Kod / teknik veri (mono)** | **JetBrains Mono** | Değişken                  | Google Fonts / `next/font/google`, self-host | Ürün kodu, stok kodu, model numarası, uyumluluk tablosu. `I` / `l` / `1` ve `0` / `O` ayrımı net — bir parça kataloğunda bu okunabilirlik değil **doğruluk** meselesi. `latin-ext` alt kümesi dâhil, Türkçe destekli.                                                          |

**Neden Inter değil.** Inter mükemmel bir arayüz fontudur ama tam da bu yüzden hiçbir şey
söylemez: §1.4'ün yanlışlanabilirlik testinde Inter + herhangi bir şey, buradaki her rakipte
aynı derecede çalışır. Ayrıca Inter'in nötrlüğü, başlıkta "otorite" üretmek için ekstra
ağırlığa muhtaç olur ve o ağırlıkta neredeyse Archivo'ya dönüşür — kısa yol yerine doğrudan
otoriter iskeleti seçiyoruz.

**Neden SF Pro değil.** §14 Apple tanıtım sayfalarından _ilham_ almayı söylüyor, kopyalamayı
açıkça yasaklıyor. SF Pro lisansı Apple platformları dışında web dağıtımına izin vermez ve
Apple'ın font seçimini almak, ilham ile taklit arasındaki çizgiyi geçmektir.

**Tek eksende karşıtlık.** Archivo ve Manrope aynı sınıftadır (grotesk sans, aynı genişlik
sınıfı, aynı dönem, aynı x-yüksekliği bölgesi). Aralarındaki tek fark **apertür/açıklık**:
Archivo kapalı ve sıkı ("teknik otorite"), Manrope açık ve ferah ("okunur, davetkâr"). Bu tam
olarak §1.3'teki gerilimin tipografik karşılığıdır — çift, gerilimi tekrarlar, ona yeni bir
boyut eklemez.

### 4.2 Süper-aile testi (neden tek aile değil)

Tek aile (yalnız Manrope, 200–800 ağırlık ekseninde) **geçerli bir alternatiftir** ve şu
durumda tercih edilmelidir: performans bütçesi ölçümde 3D + font yüklemesini karşılamıyorsa.
Manrope ExtraBold, −0.03em tracking ile büyük başlıkta yeterince güçlüdür.

Ancak iki aile seçildi çünkü: Robot Fix'in _iki mantığı_ var (servis / mağaza) ve tek ağırlık
ekseni bu ikiliği taşıyamıyor — ağırlık farkı "daha önemli" der, "farklı türde bir yer" demez.
Archivo başlıkta göründüğünde kullanıcı koyu, anlatısal bölgede olduğunu; Manrope'a
döndüğünde karar bölgesine geçtiğini fark eder.

**Karar kuralı:** Toplam font ağırlığı (üç aile, `latin` + `latin-ext`, yalnız gereken
ağırlık aralıkları) **120 KB WOFF2'yi aşarsa** JetBrains Mono düşürülür ve teknik veri
Manrope + `font-variant-numeric: tabular-nums` ile yazılır. Aşmaya devam ederse Archivo
düşürülür ve tek aile moduna geçilir.

### 4.3 Türkçe karakter teyidi — doğrulama listesi

Üç ailenin de `latin-ext` alt kümesi vardır ve Türkçe desteklenen diller arasında listelenir.
`latin-ext` şu kod noktalarını içerir ve **Türkçe için kritik olanlar** bunlardır:

| Karakter             | Unicode              | Not                                                            |
| -------------------- | -------------------- | -------------------------------------------------------------- |
| `ı` noktasız küçük i | U+0131               | **Kritik.** `i` (U+0069) ile karıştırılamaz.                   |
| `İ` noktalı büyük İ  | U+0130               | **Kritik.** `I` (U+0049) ile karıştırılamaz.                   |
| `ğ` `Ğ`              | U+011F / U+011E      | Yumuşak g                                                      |
| `ş` `Ş`              | U+015F / U+015E      | Sedilli s — **U+0219/U+0218 (Romence virgüllü ș) değil**       |
| `ç` `Ç`              | U+00E7 / U+00C7      | Latin-1'de, sorun çıkmaz                                       |
| `ö` `Ö` `ü` `Ü`      | U+00F6/D6, U+00FC/DC | Latin-1'de, sorun çıkmaz                                       |
| `₺` Türk lirası      | U+20BA               | ⚠️ `latin-ext` alt kümesinde **garanti değildir** — bkz. aşağı |

**Yayından önce yapılacak somut doğrulama (bu belge bunu varsaymaz, ölçmeyi şart koşar):**

1. Her aile için şu dizgiyi indirilen WOFF2 ile ekranda render et ve gözle karşılaştır:
   `Iıİi ĞğŞş Çç Öö Üü — IŞIK ışık İLGİ ilgi ÇİĞ çiğ`
2. `ı` ve `i` gövdeleri **aynı genişlikte** olmalı, `ı` noktasız çıkmalı. Bir font `ı`
   içermiyorsa tarayıcı yedek fonta düşer ve satır içinde görünür bir sıçrama olur — testin
   yakalayacağı şey budur.
3. `İ` büyük harf yüksekliğini aşmamalı; başlıkta satır yüksekliği kırpması yapıp yapmadığı
   `line-height: 0.98` olan display kademesinde ayrıca kontrol edilir (**en riskli nokta**:
   `İ` + sıkı satır yüksekliği = üstten kesilme).
4. `₺` sembolü: üç ailede de test et. Yoksa fiyat bileşeninde para birimi için ayrı bir
   yedek zinciri tanımlanır (`font-family: <aile>, "Noto Sans", system-ui`) veya para birimi
   `TL` metniyle yazılır. **Bu bir tasarım kararıdır, keşfedilecek bir hata değil** — fiyat
   gösterimi yazılmadan önce çözülür.
5. `next/font` ile `subsets: ["latin", "latin-ext"]` **zorunlu**. `latin-ext` unutulursa
   Türkçe metin sessizce yedek fonta düşer; bu en sık yapılan hatadır.

### 4.4 Tip ölçeği

**Temel:** kök 16px. Gövde temeli 17px (mobil) → 18px (masaüstü). Türkçe kelime uzunluğu
İngilizceden belirgin daha fazladır; 16px gövde bu dilde yeterli değildir.

**Oran:** 1.25 (majör üçlü). Akışkanlık `clamp()` ile 390px → 1280px görünüm alanı aralığında
doğrusal; bu aralığın dışında sabitlenir.

| Kademe     | Token               | `font-size`                                               | `line-height` | `letter-spacing` | Aile / ağırlık         | Kullanım                                                               |
| ---------- | ------------------- | --------------------------------------------------------- | ------------- | ---------------- | ---------------------- | ---------------------------------------------------------------------- |
| Display XL | `--text-display-xl` | `clamp(2.75rem, 1.6rem + 4.72vw, 5.375rem)` (44→86px)     | `0.98`        | `-0.03em`        | Archivo 700            | Hero'da **tek** satır. Sayfa başına bir kez.                           |
| Display L  | `--text-display-l`  | `clamp(2.125rem, 1.523rem + 2.47vw, 3.5rem)` (34→56px)    | `1.05`        | `-0.025em`       | Archivo 700            | Sayfa `h1`, bölüm açılışı                                              |
| H2         | `--text-h2`         | `clamp(1.6875rem, 1.222rem + 1.91vw, 2.75rem)` (27→44px)  | `1.12`        | `-0.02em`        | Archivo 600            | Ana sayfa bölüm başlıkları                                             |
| H3         | `--text-h3`         | `clamp(1.375rem, 1.101rem + 1.12vw, 2rem)` (22→32px)      | `1.20`        | `-0.015em`       | Archivo 600            | Alt bölüm, hizmet kartı başlığı                                        |
| H4         | `--text-h4`         | `clamp(1.1875rem, 1.051rem + 0.56vw, 1.5rem)` (19→24px)   | `1.30`        | `-0.01em`        | Manrope 700            | **Ürün kartı adı**, SSS sorusu, tablo başlığı                          |
| Lead       | `--text-lead`       | `clamp(1.125rem, 1.043rem + 0.34vw, 1.3125rem)` (18→21px) | `1.55`        | `-0.005em`       | Manrope 400            | Bölüm giriş paragrafı, değer önerisi                                   |
| Body       | `--text-body`       | `clamp(1.0625rem, 1.035rem + 0.11vw, 1.125rem)` (17→18px) | `1.65`        | `0`              | Manrope 400            | Tüm gövde metni. Kalın vurgu 600.                                      |
| Body S     | `--text-body-sm`    | `0.875rem` (14px, sabit)                                  | `1.50`        | `0.005em`        | Manrope 400/500        | Yardımcı metin, kart alt bilgisi, form ipucu                           |
| Etiket     | `--text-label`      | `0.75rem` (12px, sabit)                                   | `1.20`        | `0.08em`         | Manrope 600            | Kategori/marka üst etiketi, rozet metni. Bkz. §4.5 büyük harf uyarısı. |
| Mono       | `--text-mono`       | `0.9375rem` (15px, sabit)                                 | `1.55`        | `0`              | JetBrains Mono 400/500 | Ürün kodu, stok kodu, model no, teknik özellik tablosu değerleri       |

**Kademelerin altındaki kurallar**

- **44px'in altına akışkanlık yok.** Body S, Etiket ve Mono sabittir: `clamp()` bu boyutlarda
  okunabilirlik tabanını delme riski taşır.
- **Satır yüksekliği başlıkta sıkı, gövdede geniş.** Türkçe uzun kelimeler dar sütunlarda kötü
  kenar (rag) üretir; gövdede `1.65` bunu telafi eder, düşürülmez.
- **Ölçü (measure):** gövde metni `max-inline-size: min(68ch, 100%)`, ideal 60–72 karakter.
  Sinematik/koyu bölümlerde daha kısa: `min(52ch, 100%)`.
- **Başlıklarda `text-wrap: balance`, gövdede `text-wrap: pretty`.** Türkçede tek uzun kelimenin
  son satıra düşmesi çok sık görülür; `balance` bunu görünür biçimde düzeltir.
- **Sayısal veri:** fiyat, ürün kodu, teknik değer → `font-variant-numeric: tabular-nums`.
  Fiyat listesi hizalanmadığında güven düşer.
- Archivo yalnız 600 ve 700 kullanılır; Manrope 400, 500, 600, 700. Değişken eksenden bu dört
  durak dışına çıkılmaz — token dışı ağırlık yok.

### 4.5 Türkçe mikro-tipografi

#### Kesme işareti

Her zaman tipografik kesme `’` (U+2019). Düz tırnak `'` (U+0027) **hiçbir yerde**.

| Doğru                         | Yanlış                        |
| ----------------------------- | ----------------------------- |
| Robot Fix’in servis süreci    | Robot Fix'in servis süreci    |
| WhatsApp’tan bilgi alın       | WhatsApp'tan bilgi alın       |
| Gaziantep’teki servis noktası | Gaziantep'teki servis noktası |
| Roomba’ya uyumlu fırça        | Roomba'ya uyumlu fırça        |

Kural: özel adlara gelen ekler kesme ile ayrılır; **marka/model adlarında da geçerlidir**
(Roborock’un, Dreame’ye). Ürün adı veritabanından geliyorsa kesme işaretinin doğru karakter
olduğu içerik girişinde kontrol edilir — yönetim panelinde bir uyarı gösterilebilir.

Tırnak işareti: Türkçede `“ ”` (U+201C / U+201D). Düz `"` kullanılmaz.

#### Büyük harf: İ/I sorunu

- `<html lang="tr">` **zorunludur.** Bu olmadan `text-transform: uppercase` "iletişim"i
  "ILETISIM" yapar; olduğunda doğru şekilde "İLETİŞİM" yapar.
- JavaScript'te asla `.toUpperCase()` kullanılmaz; **her zaman**
  `.toLocaleUpperCase("tr-TR")`. Aynı şekilde `.toLocaleLowerCase("tr-TR")`
  (`I` → `ı`, `İ` → `i`).
- **Marka adı istisnadır:** "Fix" içindeki `i` Türkçe kuralla `İ`ye döner (§2.2). Marka adına
  büyük harf dönüşümü uygulanmaz.
- Genel tercih: **büyük harf dönüşümünü mümkün olduğunca kullanma.** Etiket metinleri kaynakta
  zaten istenen kutuda yazılır. Dönüşüm yalnızca `--text-label` kademesinde ve yalnızca
  Türkçe kelimelerde serbesttir.
- Sıralama: marka/kategori listeleri `Intl.Collator("tr")` ile sıralanır — aksi hâlde
  "Çiçek" Z'den sonra gelir, `ı` yanlış yere düşer.

#### Tireleme (hyphenation)

- Başlıklarda `hyphens: none`. Tirelenen başlık premium hissi bitirir.
- Gövdede dar sütun (< 45ch) varsa `hyphens: auto` + `lang="tr"`; tarayıcı Türkçe sözlük
  desteği tutarsız olduğu için **etkisi ölçülmeden bırakılmaz**. Ölçülemiyorsa
  `hyphens: manual` ve gerektiğinde `&shy;` ile elle müdahale.
- Ürün kodu, model numarası ve URL gibi kırılmaması gereken diziler: `overflow-wrap: anywhere`
  yerine `word-break: normal` + kapsayıcıda yatay taşma önlemi. Bir parça kodunun ortadan
  kırılması yanlış sipariş demektir.

#### Sayı ve para birimi

- `Intl.NumberFormat("tr-TR")` — binlik ayırıcı nokta, ondalık virgül: `1.299,50`.
- Para birimi sembolü sayıdan sonra ve **kırılmaz boşlukla**: `1.299,50 ₺` (U+00A0).
- `₺` glif yoksa (§4.3-4) `TL` metni kullanılır; iki gösterim aynı sayfada karışmaz.

---

## 5. Token isimlendirme sözleşmesi

### 5.1 İki katman, tek yön

```
Ham (primitive)  →  Semantik (rol)  →  Bileşen
```

- **Ham token** rengin ne olduğunu söyler (`--color-navy-900`). Anlamı yoktur, değişmez.
- **Semantik token** rengin ne işe yaradığını söyler (`--color-action`). Ham token'a referans verir.
- **Bileşen asla ham token kullanmaz.** Bir bileşende `--color-green-700` görülüyorsa bu bir
  hatadır; semantik katman atlanmıştır.

Bu ayrım olmadan "CTA rengini değiştir" isteği kod tabanında 40 yere dokunur; ayrımla tek
satıra iner.

### 5.2 Ham katman

| Token                  | Değer     | Kaynak                                                                             |
| ---------------------- | --------- | ---------------------------------------------------------------------------------- |
| `--color-navy-900`     | `#0B1F33` | Gece Laciverti                                                                     |
| `--color-navy-800`     | `#123B5D` | Servis Laciverti                                                                   |
| `--color-ink-950`      | `#0B0F14` | Sinematik koyu zemin                                                               |
| `--color-blue-600`     | `#1769AA` | Güven Mavisi                                                                       |
| `--color-green-700`    | `#0B6E4F` | Güven Yeşili                                                                       |
| `--color-whatsapp-700` | `#075E54` | Koyu WhatsApp Yeşili                                                               |
| `--color-cyan-400`     | `#3FC7D3` | Hassas Camgöbeği                                                                   |
| `--color-slate-700`    | `#334155` | Koyu Arduvaz                                                                       |
| `--color-slate-200`    | `#D7E0E8` | Sis Grisi                                                                          |
| `--color-slate-50`     | `#F5F8FA` | Buz Beyazı                                                                         |
| `--color-white`        | `#FFFFFF` | Saf Beyaz                                                                          |
| `--color-steel-500`    | `#677684` | **Türev:** Sis Grisi %45 + Gece Laciverti %55. Yalnız §3.6.3 koyu yüzey kenarlığı. |
| `--color-success-600`  | `#067647` | Durum                                                                              |
| `--color-info-600`     | `#175CD3` | Durum                                                                              |
| `--color-warning-600`  | `#B54708` | Durum                                                                              |
| `--color-danger-600`   | `#B42318` | Durum                                                                              |
| `--color-neutral-600`  | `#475467` | Durum / soluk metin                                                                |

**Numaralandırma kuralı:** sayı, **ham rengin bağıl açıklığını** temsil eder (50 = en açık,
950 = en koyu), Tailwind'in genel sezgisiyle uyumludur. Palet kilitli olduğu için ara duraklar
(navy-700, blue-500 vb.) **yoktur ve üretilmez** — boş duraklar birinin araya renk sıkıştırma
davetidir.

### 5.3 Semantik katman — **açık yüzey** (varsayılan)

| Token                          | Referans               | Doğrulanmış kontrast                                                                      |
| ------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------- |
| `--color-surface`              | `--color-slate-50`     | — (zemin)                                                                                 |
| `--color-surface-raised`       | `--color-white`        | — (kart zemini)                                                                           |
| `--color-surface-brand`        | `--color-navy-900`     | — (koyu bölüm zemini)                                                                     |
| `--color-surface-brand-alt`    | `--color-navy-800`     | — (koyu kart/nav)                                                                         |
| `--color-surface-cinematic`    | `--color-ink-950`      | — (**yalnız** 3D bölüm)                                                                   |
| `--color-text`                 | `--color-slate-700`    | 10.35:1 / `raised`, 9.71:1 / `surface`                                                    |
| `--color-text-strong`          | `--color-navy-900`     | 16.69:1 / `raised`, 15.65:1 / `surface`                                                   |
| `--color-text-muted`           | `--color-neutral-600`  | 7.69:1 / `raised`                                                                         |
| `--color-text-inverse`         | `--color-white`        | 16.69:1 / `surface-brand`                                                                 |
| `--color-border`               | `--color-slate-200`    | 1.34:1 — ⚠️ **yalnız dekoratif ayırıcı** (§3.6.1)                                         |
| `--color-border-strong`        | `--color-neutral-600`  | 7.69:1 — form/çip/onay kutusu sınırı                                                      |
| `--color-focus`                | `--color-blue-600`     | 5.77:1 / `raised`                                                                         |
| `--color-link`                 | `--color-blue-600`     | 5.77:1 / `raised`, 5.41:1 / `surface`                                                     |
| `--color-link-hover`           | `--color-navy-800`     | 11.61:1 hesabı ters yönde; `#123B5D` on `#FFFFFF` = 24.5:1 ✅                             |
| `--color-action`               | `--color-green-700`    | metin `#FFF` 6.25:1                                                                       |
| `--color-action-text`          | `--color-white`        | 6.25:1                                                                                    |
| `--color-action-whatsapp`      | `--color-whatsapp-700` | metin `#FFF` 7.67:1                                                                       |
| `--color-action-whatsapp-text` | `--color-white`        | 7.67:1                                                                                    |
| `--color-action-secondary`     | `--color-blue-600`     | metin `#FFF` 5.77:1                                                                       |
| `--color-accent-tech`          | `--color-cyan-400`     | ⚠️ açık yüzeyde **metin/sınır değil**, yalnız dolgu; üzerine `--color-text-strong` 8.20:1 |
| `--color-status-success`       | `--color-success-600`  | `#FFF` 5.69:1                                                                             |
| `--color-status-info`          | `--color-info-600`     | `#FFF` 5.99:1                                                                             |
| `--color-status-warning`       | `--color-warning-600`  | `#FFF` 5.43:1                                                                             |
| `--color-status-danger`        | `--color-danger-600`   | `#FFF` 6.57:1                                                                             |
| `--color-status-neutral`       | `--color-neutral-600`  | `#FFF` 7.69:1                                                                             |

### 5.4 Semantik katman — **koyu yüzey** (`-on-dark` soneki)

**Neden `-on-dark`, neden tema anahtarı değil.** Robot Fix'te koyu ve açık yüzeyler _alternatif_
değil **eşzamanlıdır**: aynı belgede koyu hero + açık katalog + koyu footer bir arada yaşar
(§15 yüzey stratejisi). `prefers-color-scheme` veya `[data-theme]` anahtarı bu durumu ifade
edemez — o mekanizma "kullanıcı hangi temayı seçti" sorusunu çözer, "bu blok hangi zeminde
duruyor" sorusunu değil. Bu yüzden koyu yüzey setleri **ayrı adlandırılmış, aynı anda mevcut**
tokenlardır.

Ergonomi için: `@theme` içinde `-on-dark` tokenları global olarak tanımlanır; ayrıca bir
`.on-dark` yardımcı sınıfı, kendi alt ağacında semantik tokenları bu değerlere yeniden bağlar
— böylece koyu bölümün içindeki bileşenler kendi kodlarını değiştirmeden doğru renkte çıkar.
İki yol da aynı token setini kullanır, çakışmaz.

| Token                             | Referans               | Doğrulanmış kontrast (zemin `--color-surface-brand` = `#0B1F33`)                                      |
| --------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `--color-text-on-dark`            | `--color-white`        | **16.69:1** ✅ AAA                                                                                    |
| `--color-text-strong-on-dark`     | `--color-white`        | **16.69:1** ✅ AAA                                                                                    |
| `--color-text-muted-on-dark`      | `--color-slate-200`    | **12.49:1** ✅ AAA                                                                                    |
| `--color-border-on-dark`          | `--color-navy-800`     | 1.44:1 — ⚠️ **yalnız dekoratif ayırıcı**                                                              |
| `--color-border-strong-on-dark`   | `--color-steel-500`    | **3.58:1** ✅ (metin dışı 3:1)                                                                        |
| `--color-focus-on-dark`           | `--color-slate-50`     | **15.65:1** ✅ (mavi odak halkası koyuda kullanılamaz)                                                |
| `--color-link-on-dark`            | `--color-cyan-400`     | **8.20:1** ✅ AAA — **alt çizgi zorunlu**                                                             |
| `--color-link-hover-on-dark`      | `--color-white`        | **16.69:1** ✅                                                                                        |
| `--color-action-on-dark`          | `--color-green-700`    | yüzey 2.67:1 ❌ → `--color-border-strong-on-dark` 1px kenarlık **zorunlu**; iç metin `#FFF` 6.25:1 ✅ |
| `--color-action-whatsapp-on-dark` | `--color-whatsapp-700` | yüzey 2.18:1 ❌ → aynı kenarlık **zorunlu**; iç metin `#FFF` 7.67:1 ✅                                |
| `--color-accent-tech-on-dark`     | `--color-cyan-400`     | **8.20:1** ✅                                                                                         |

**Koyu yüzeyde yasaklı tokenlar:** `--color-link` (Güven Mavisi, 2.89:1 ❌),
`--color-focus` (aynı renk, 2.89:1 ❌), `--color-text` ve `--color-text-muted` (koyu
gri/arduvaz, okunmaz). Bunların koyu bir bloğa sızması lint/gözden geçirme ile yakalanır.

Sinematik zemin (`#0B0F14`) için ayrı set gerekmez: tüm `-on-dark` değerleri orada **daha
yüksek** kontrast verir (ör. beyaz 19.22:1, camgöbeği 9.45:1, çelik kenarlık 4.12:1). Yani
`-on-dark` seti sinematik yüzey için de güvenlidir.

### 5.5 Diğer token aileleri

| Aile             | Desen                                                                                  | Örnek                          |
| ---------------- | -------------------------------------------------------------------------------------- | ------------------------------ |
| Yarıçap          | `--radius-{sm,md,lg,xl,full}`                                                          | `--radius-md: 10px`            |
| Boşluk           | `--space-{1..16}` (4px tabanlı)                                                        | `--space-6: 24px`              |
| Tipografi boyutu | `--text-{kademe}` + `--text-{kademe}--line-height` + `--text-{kademe}--letter-spacing` | `--text-h2--line-height: 1.12` |
| Aile             | `--font-{display,text,mono}`                                                           | `--font-display` → Archivo     |
| Gölge            | `--shadow-{1,2,3}`                                                                     | §7.2                           |
| Easing           | `--ease-{brand,precise,enter,exit}`                                                    | §8                             |
| Süre             | `--motion-{instant,fast,base,slow,scene}`                                              | §8                             |
| Z ekseni         | `--z-{base,sticky,overlay,modal,toast}`                                                | —                              |

**Tailwind v4 notu.** Bu tokenlar `app/globals.css` içindeki `@theme` bloğunda yaşar
(`CLAUDE.md` mimari kararı). `--color-*`, `--font-*`, `--text-*`, `--radius-*`, `--ease-*`
v4'ün tanıdığı ad alanlarıdır ve otomatik yardımcı sınıf üretirler (`bg-surface`,
`text-text-muted`, `rounded-md`, `ease-brand`). Süre değerlerinin ad alanı desteği
sürüm bazında doğrulanmalıdır; desteklenmiyorsa `--motion-*` değişkenleri `:root` altında
tanımlanır ve `duration-[var(--motion-base)]` biçiminde tüketilir.

### 5.6 Marka → token devir tablosu (arayüz geliştiricisine)

| Katman        | Token                               | Değer / referans            | Kaynak                         | WCAG çifti + oran                                   |
| ------------- | ----------------------------------- | --------------------------- | ------------------------------ | --------------------------------------------------- |
| ham           | `--color-navy-900`                  | `#0B1F33`                   | §15 Gece Laciverti (kilitli)   | —                                                   |
| ham           | `--color-navy-800`                  | `#123B5D`                   | §15 Servis Laciverti (kilitli) | —                                                   |
| ham           | `--color-ink-950`                   | `#0B0F14`                   | §15 Alt. palet A, tek token    | —                                                   |
| ham           | `--color-blue-600`                  | `#1769AA`                   | §15 Güven Mavisi (kilitli)     | —                                                   |
| ham           | `--color-green-700`                 | `#0B6E4F`                   | §15 Güven Yeşili (kilitli)     | —                                                   |
| ham           | `--color-whatsapp-700`              | `#075E54`                   | §15 WhatsApp (kilitli)         | —                                                   |
| ham           | `--color-cyan-400`                  | `#3FC7D3`                   | §15 Hassas Camgöbeği (kilitli) | —                                                   |
| ham           | `--color-slate-700`                 | `#334155`                   | §15 Koyu Arduvaz (kilitli)     | —                                                   |
| ham           | `--color-slate-200`                 | `#D7E0E8`                   | §15 Sis Grisi (kilitli)        | —                                                   |
| ham           | `--color-slate-50`                  | `#F5F8FA`                   | §15 Buz Beyazı (kilitli)       | —                                                   |
| ham           | `--color-white`                     | `#FFFFFF`                   | §15 Saf Beyaz (kilitli)        | —                                                   |
| ham           | `--color-steel-500`                 | `#677684`                   | Türev (Sis %45 + Navy %55)     | `#0B1F33` üzerinde 3.58:1 (metin dışı ✅)           |
| ham           | `--color-neutral-600`               | `#475467`                   | §15 durum nötr (kilitli)       | —                                                   |
| ham           | `--color-success-600`               | `#067647`                   | §15 durum (kilitli)            | —                                                   |
| ham           | `--color-info-600`                  | `#175CD3`                   | §15 durum (kilitli)            | —                                                   |
| ham           | `--color-warning-600`               | `#B54708`                   | §15 durum (kilitli)            | —                                                   |
| ham           | `--color-danger-600`                | `#B42318`                   | §15 durum (kilitli)            | —                                                   |
| semantik-açık | `--color-surface`                   | `var(--color-slate-50)`     | §15 açık zemin                 | zemin                                               |
| semantik-açık | `--color-surface-raised`            | `var(--color-white)`        | §15 kart                       | zemin                                               |
| semantik-açık | `--color-surface-brand`             | `var(--color-navy-900)`     | §15 hero/footer                | zemin                                               |
| semantik-açık | `--color-surface-brand-alt`         | `var(--color-navy-800)`     | §15 nav/koyu kart              | zemin                                               |
| semantik-açık | `--color-surface-cinematic`         | `var(--color-ink-950)`      | §15 yalnız 3D                  | zemin                                               |
| semantik-açık | `--color-text`                      | `var(--color-slate-700)`    | §15 gövde metni                | `#334155` / `#FFFFFF` = 10.35:1 ✅                  |
| semantik-açık | `--color-text-strong`               | `var(--color-navy-900)`     | §15 başlık                     | `#0B1F33` / `#F5F8FA` = 15.65:1 ✅                  |
| semantik-açık | `--color-text-muted`                | `var(--color-neutral-600)`  | §15 nötr                       | `#475467` / `#FFFFFF` = 7.69:1 ✅                   |
| semantik-açık | `--color-border`                    | `var(--color-slate-200)`    | §15 sınır                      | 1.34:1 ❌ → **yalnız dekoratif**                    |
| semantik-açık | `--color-border-strong`             | `var(--color-neutral-600)`  | §3.6.1 telafisi                | 7.69:1 ✅ (3:1 eşiği)                               |
| semantik-açık | `--color-focus`                     | `var(--color-blue-600)`     | §15 erişilebilirlik            | 5.77:1 ✅ (3:1 eşiği)                               |
| semantik-açık | `--color-link`                      | `var(--color-blue-600)`     | §15 bağlantı                   | 5.77:1 ✅ + alt çizgi                               |
| semantik-açık | `--color-action`                    | `var(--color-green-700)`    | §15 ana CTA                    | metin `#FFF` 6.25:1 ✅                              |
| semantik-açık | `--color-action-text`               | `var(--color-white)`        | §15                            | 6.25:1 ✅                                           |
| semantik-açık | `--color-action-whatsapp`           | `var(--color-whatsapp-700)` | §15 WhatsApp                   | metin `#FFF` 7.67:1 ✅                              |
| semantik-açık | `--color-action-secondary`          | `var(--color-blue-600)`     | §15 ikincil buton              | metin `#FFF` 5.77:1 ✅                              |
| semantik-açık | `--color-accent-tech`               | `var(--color-cyan-400)`     | §15 teknoloji vurgusu          | üstüne `#0B1F33` 8.20:1 ✅ / `#FFF` 2.03:1 ❌       |
| semantik-koyu | `--color-text-on-dark`              | `var(--color-white)`        | §15 koyu alan                  | 16.69:1 ✅                                          |
| semantik-koyu | `--color-text-muted-on-dark`        | `var(--color-slate-200)`    | türetilmiş rol                 | 12.49:1 ✅                                          |
| semantik-koyu | `--color-border-on-dark`            | `var(--color-navy-800)`     | dekoratif                      | 1.44:1 ❌ → **yalnız dekoratif**                    |
| semantik-koyu | `--color-border-strong-on-dark`     | `var(--color-steel-500)`    | §3.6.3 telafisi                | 3.58:1 ✅                                           |
| semantik-koyu | `--color-focus-on-dark`             | `var(--color-slate-50)`     | §3.6.2 telafisi                | 15.65:1 ✅                                          |
| semantik-koyu | `--color-link-on-dark`              | `var(--color-cyan-400)`     | §3.6.2 telafisi                | 8.20:1 ✅ + alt çizgi                               |
| semantik-koyu | `--color-action-on-dark`            | `var(--color-green-700)`    | §15 CTA                        | yüzey 2.67:1 ❌ → kenarlık zorunlu; metin 6.25:1 ✅ |
| semantik-koyu | `--color-action-whatsapp-on-dark`   | `var(--color-whatsapp-700)` | §15 WhatsApp                   | yüzey 2.18:1 ❌ → kenarlık zorunlu; metin 7.67:1 ✅ |
| tipografi     | `--font-display`                    | Archivo (değişken)          | §4.1                           | —                                                   |
| tipografi     | `--font-text`                       | Manrope (değişken)          | §4.1                           | —                                                   |
| tipografi     | `--font-mono`                       | JetBrains Mono (değişken)   | §4.1                           | —                                                   |
| tipografi     | `--text-display-xl` … `--text-mono` | §4.4 tablosu                | §4.4                           | —                                                   |
| şekil         | `--radius-sm/md/lg/xl/full`         | 6 / 10 / 16 / 24 / 9999px   | §7.1                           | —                                                   |
| gölge         | `--shadow-1/2/3`                    | §7.2                        | §7.2                           | —                                                   |
| hareket       | `--motion-*`, `--ease-*`            | §8                          | §8                             | —                                                   |

---

## 6. Ses ve ton

### 6.1 Ses ekseni — Robot Fix'in duruşu

Her eksende **tek nokta**, "ortası" değil:

| Eksen                | ←       | Robot Fix | →        |
| -------------------- | ------- | --------- | -------- |
| Resmî ↔ Samimi       | Resmî   | ●———○———— | Samimi   | → **Resmîye yakın samimi.** "Siz" kullanılır, "sen" asla. Ama kurumsal jargon yok.            |
| Uzman ↔ Erişilebilir | Uzman   | ————●——○— | Basit    | → **Uzman ama tercüme eden.** Teknik terim kullanılır, hemen ardından bir cümleyle açıklanır. |
| İddialı ↔ Ölçülü     | İddialı | ————————● | Ölçülü   | → **Uç noktada ölçülü.** §16 ve §20 iddiayı yasaklıyor; bu bir tercih değil kısıt.            |
| Satıcı ↔ Danışman    | Satıcı  | ——————●—— | Danışman | → **Danışman.** Kapanış cümlesi soru sorar, baskı yapmaz.                                     |
| Sıcak ↔ Nötr         | Sıcak   | ———●————— | Nötr     | → **Ilık.** İnsan var ama abartı yok; emoji yok, ünlem neredeyse yok.                         |

### 6.2 Hiç esnemeyen üç kural

1. **Doğrulanmamış hiçbir sayı, statü veya taahhüt cümleye girmez.** Fiyat, süre, garanti,
   memnuniyet, tamir adedi, yetkili servis, sertifika, marka ortaklığı (§20).
2. **Aciliyet üretilmez.** Sayaç, "son 3 adet", "bugüne özel", sahte indirim yok (§16).
3. **Mutlak iddia yok.** "En iyi", "en hızlı", "kesin çözüm", "%100" yok (§16).

Bu üçü ton esnetmesinden muaftır: hero'da da, hata mesajında da, WhatsApp şablonunda da geçerli.

### 6.3 Ton esnemesi (yüzeye göre)

| Yüzey                 | Ton                             | Cümle uzunluğu |
| --------------------- | ------------------------------- | -------------- |
| Hero / marka anlatısı | En sakin, en kısa. Fiil odaklı. | 6–12 kelime    |
| Hizmet açıklaması     | Açıklayıcı, sıralı, adım adım   | 12–20 kelime   |
| Ürün kartı / detay    | Nesnel, kısa, veri ağırlıklı    | 8–16 kelime    |
| CTA                   | Eylem net, kanal açık           | 3–6 kelime     |
| Boş durum             | Yardımsever, yol gösteren       | 10–18 kelime   |
| Hata                  | Suçsuz, çözüm önce              | 8–15 kelime    |
| Onay                  | Ne oldu + sırada ne var         | 10–16 kelime   |

### 6.4 Do / Don't — yüzey bazlı, gerçek cümlelerle

#### Hero

| ✅ Yap                                                                          | ❌ Yapma                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------- |
| Robot süpürgenizin arızasını anlatın, doğru parçayı ve çözümü birlikte bulalım. | Türkiye’nin en hızlı robot süpürge servisi. |
| Bakım, onarım ve yedek parça aynı uzmanlıkta.                                   | 500+ başarılı tamir, %95 memnuniyet.        |
| Gaziantep’te teknik servis, Türkiye’ye kargo ile parça.                         | Tüm markaların yetkili servisi.             |

#### Ana CTA (genel eylem)

| ✅ Yap                     | ❌ Yapma      |
| -------------------------- | ------------- |
| Servis Talebi Oluştur      | Hemen Başla   |
| Uyumluluk Sor              | Devam         |
| Fiyat İçin İletişime Geçin | Fiyat Öğren!! |

#### WhatsApp CTA

| ✅ Yap                     | ❌ Yapma    |
| -------------------------- | ----------- |
| WhatsApp’tan Bilgi Al      | Bize Yazın  |
| WhatsApp’tan Sipariş Sor   | Sipariş Ver |
| WhatsApp’tan Arızanı Anlat | Tıkla Konuş |

Kural (§15): WhatsApp butonunda eylem açıkça yazar; yalnız simge veya yalnız "WhatsApp" yeterli değildir.

#### Pazaryeri butonu

| ✅ Yap                                | ❌ Yapma                      |
| ------------------------------------- | ----------------------------- |
| Amazon’daki ürün sayfasında görüntüle | Satın Al (logo ile)           |
| Hepsiburada mağazamızda görüntüle     | En uygun fiyat Hepsiburada’da |
| Trendyol mağazamıza git               | Diğer kanallar                |

Kural (§9): bağlantının mağazaya mı ürüne mi gittiği metinde yazar; bağlantı yoksa buton hiç gösterilmez.

#### Fiyat / stok

| ✅ Yap                                                             | ❌ Yapma           |
| ------------------------------------------------------------------ | ------------------ |
| Fiyat için iletişime geçin                                         | Fiyat: —           |
| Bulunabilirlik: Siparişle temin edilir                             | Stokta! Son 2 adet |
| Bu ürünün fiyatı kanala göre değişebilir; güncel fiyat için sorun. | En ucuz burada     |

#### Uyumluluk

| ✅ Yap                                                                                                            | ❌ Yapma                          |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Bu parça şu modellerle uyumlu olarak listelenmiştir: … Cihazınızın model kodunu yazarsanız birlikte doğrulayalım. | Tüm robot süpürgelerle uyumludur. |
| Model kodunuzdan emin değilseniz cihazın altındaki etiketin fotoğrafını gönderin.                                 | Uyumluluk garantilidir.           |

#### Boş durum (arama sonucu yok)

| ✅ Yap                                                                                                     | ❌ Yapma                         |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Bu aramaya uygun ürün bulunamadı. Aradığınız parçayı bize yazarsanız temin edilebilir mi birlikte bakalım. | Sonuç yok.                       |
| Filtreleri kaldırıp yeniden deneyebilir veya doğrudan sorabilirsiniz.                                      | Üzgünüz :( Hiçbir şey bulamadık! |

#### Hata (form)

| ✅ Yap                                                                                     | ❌ Yapma                        |
| ------------------------------------------------------------------------------------------ | ------------------------------- |
| Telefon numarasını 10 haneli olarak girin. Örnek: 5XX XXX XX XX                            | Geçersiz giriş.                 |
| Mesajınız gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin veya WhatsApp’tan yazın. | Hata oluştu!                    |
| Bu alanı doldurmanız gerekiyor.                                                            | Zorunlu alan boş bırakılamaz!!! |

#### Onay

| ✅ Yap                                                                             | ❌ Yapma                                                                     |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Talebiniz bize ulaştı. Çalışma saatleri içinde WhatsApp üzerinden dönüş yapacağız. | Teşekkürler! En kısa sürede döneceğiz. (süre taahhüdü yok ama "en kısa" boş) |
| WhatsApp penceresi açıldı. Mesajı gönderdiğinizde talebiniz bize iletilir.         | Siparişiniz alındı.                                                          |

> "En kısa sürede" ifadesi bile ölçülemez bir taahhüttür; yerine **doğrulanmış çalışma saatleri**
> yazılır. §10'daki "Hafta içi 09.00–18.00" bilgisi yayından önce teyit edilmelidir.

### 6.5 Register örnekleri — bağlı ses vs. makul ama yanlış ses

**Örnek 1 — hizmet giriş paragrafı**

- ✅ **Bağlı ses:** "Robot süpürgeler farklı markalarda farklı arızalanır. Belirtiyi
  ve model kodunu aldığımızda hangi parçanın değişmesi gerektiğini birlikte netleştiririz."
- ❌ **Yanlış ses (kurumsal boşluk):** "Müşteri memnuniyetini ön planda tutan yenilikçi
  vizyonumuzla robot süpürge sektöründe fark yaratıyoruz."
  → _Neden yanlış:_ hiçbir şey söylemiyor, doğrulanabilir tek bilgi yok, §16'nın "açık ve
  doğrudan" maddesini ihlal ediyor.
- ❌ **Yanlış ses (aşırı teknik):** "BLDC motor sargı direnci ve Hall sensör çıkışı
  ölçülerek PWM sürücü kartındaki MOSFET arızası teşhis edilir."
  → _Neden yanlış:_ §16 "aşırı teknik ve müşteriyi dışlayan anlatım" maddesini ihlal ediyor.
  Bu cümle uzman sayfasında bir yerde olabilir, giriş paragrafında olamaz.

**Örnek 2 — ürün detayında fiyat yokluğu**

- ✅ **Bağlı ses:** "Bu ürünün güncel fiyatı için iletişime geçin. Cihaz modelinizi
  yazarsanız uyumluluğu da birlikte kontrol ederiz."
- ❌ **Yanlış ses (satıcı paniği):** "Fiyatı öğrenmek için hemen tıkla! Kaçırma!"
  → _Neden yanlış:_ §16 satış baskısı yasağı; §15 sahte aciliyet yasağı.
- ❌ **Yanlış ses (özür dileyen):** "Maalesef bu ürün için fiyat bilgisi bulunmamaktadır."
  → _Neden yanlış:_ fiyat yokluğunu bir eksiklik olarak sunuyor; §1.3'e göre bu bir **giriş
  kapısıdır**, kusur değil. Ton, marka konumunu yıkıyor.

**Örnek 3 — marka listesi başlığı**

- ✅ **Bağlı ses:** "Ürün ve parça sunduğumuz markalar" / "Servis talebi aldığımız markalar"
- ❌ **Yanlış ses:** "Yetkili servisi olduğumuz markalar" / "İş ortaklarımız"
  → _Neden yanlış:_ §10 ve §20 doğrudan yasaklıyor. Bu bir ton hatası değil, **uyum ihlalidir**.

### 6.6 Slogan adayları — ❗ ONAYLANMAMIŞ

Aşağıdakiler **öneridir**; hiçbiri onaylanmış slogan değildir (§2 kaydı: "Bu ifade onaylanmış
nihai slogan değildir"). Kullanıcı seçmeden yayına girmez.

| Aday                                                                  | Neyi çözer                             | Riski                            |
| --------------------------------------------------------------------- | -------------------------------------- | -------------------------------- |
| Robot süpürgeniz için ürün, parça ve teknik servis tek uzman noktada. | §2'deki mevcut öneri; üç işi de sayar  | Uzun; hero'da tek satıra sığmaz  |
| Önce arıza, sonra parça.                                              | Gerilimi (§1.3) doğrudan söyler; kısa  | "Parça satmıyor" gibi okunabilir |
| Arızayı biliriz, parçayı bulur, cihazı çalıştırırız.                  | Üç aşamalı, ritmik, iddiasız           | Üç fiil biraz uzun               |
| Doğru parça, doğru teşhisle başlar.                                   | Kataloğu servise bağlar                | Soyut kalabilir                  |
| Robot süpürge servisi ve yedek parça. Gaziantep’ten Türkiye’ye.       | Yerel + erişim; tamamen doğrulanabilir | Slogan değil, tanım              |

---

## 7. Bileşen dili

### 7.1 Köşe yarıçapı felsefesi

**"Alet kasası yarıçapı."** Robot süpürge kendisi yumuşak köşeli sert bir nesnedir; arayüz de
öyle. Ne keskin kutu (ucuz, sert, tablo hissi) ne de tam yuvarlak hap (tüketici uygulaması,
oyuncak hissi).

| Token           | Değer    | Nerede                                                  |
| --------------- | -------- | ------------------------------------------------------- |
| `--radius-sm`   | `6px`    | Form alanı, çip, rozet, onay kutusu, küçük simge kutusu |
| `--radius-md`   | `10px`   | **Buton**, küçük kart, açılır menü öğesi, tooltip       |
| `--radius-lg`   | `16px`   | Ürün kartı, hizmet kartı, panel, form grubu             |
| `--radius-xl`   | `24px`   | Bölüm bloğu, sinematik kart, modal                      |
| `--radius-full` | `9999px` | **Yalnız** avatar ve durum noktası (dot)                |

**Kural:** Buton asla hap (pill) değildir. `--radius-full` bir butona uygulanırsa marka
kırılır — hap butonlar §15'in kaçınmamızı söylediği "oyuncu ürünü/tüketici uygulaması"
registerinin en güçlü sinyalidir.

**İç içe yarıçap:** iç öğenin yarıçapı = dış yarıçap − dolgu. 16px yarıçaplı kartın içindeki
16px dolgulu görsel alanı 6px alır, 10px değil.

### 7.2 Sınır mı gölge mi

**Açık yüzeyde: önce sınır, sonra gölge.** Kart varlığını 1px sınırla kurar; gölge yalnızca
**yükselme** anlatır (hover, popover, modal). Bu tercih dürüstlüktür: yüzen kartlar
yerleşimin sabit olduğunu inkâr eder.

| Token        | Değer                                                           | Kullanım                                |
| ------------ | --------------------------------------------------------------- | --------------------------------------- |
| `--shadow-1` | `0 1px 2px rgb(11 31 51 / .06), 0 1px 3px rgb(11 31 51 / .04)`  | Kart dinlenme durumu (sınırla birlikte) |
| `--shadow-2` | `0 4px 12px rgb(11 31 51 / .08), 0 2px 4px rgb(11 31 51 / .04)` | Kart hover, açılır menü                 |
| `--shadow-3` | `0 12px 32px rgb(11 31 51 / .12)`                               | Modal, hızlı ürün önizlemesi            |

Gölge rengi **siyah değil Gece Laciverti**'dir. Siyah gölge açık nötr yüzeyde gri, ölü ve
markasız görünür; lacivert gölge paletin soğuk koridoruyla (§3.1) aynı yönde kalır.

**Koyu yüzeyde gölge yoktur.** Koyu zeminde gölge görünmez; ayrım **1px açık kenarlık**
(`--color-border-strong-on-dark`, 3.58:1) ve **zemin açıklık farkı** (`#0B1F33` → `#123B5D`)
ile kurulur.

### 7.3 Buton anatomisi

| Nitelik               | Değer                                                                                                                                                                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yükseklik             | 44px (varsayılan) / 52px (hero birincil) / 36px (yoğun tablo satırı, yalnız masaüstü)                                                                                                                                                                                                        |
| Yatay dolgu           | 20px (44px) / 24px (52px) / 14px (36px)                                                                                                                                                                                                                                                      |
| Simge–metin boşluğu   | 8px                                                                                                                                                                                                                                                                                          |
| Yarıçap               | `--radius-md` (10px)                                                                                                                                                                                                                                                                         |
| Yazı                  | Manrope 600, `--text-body` (17–18px), tracking `0`                                                                                                                                                                                                                                           |
| Minimum dokunma alanı | 44×44px (dolgu görünürün dışına taşabilir)                                                                                                                                                                                                                                                   |
| Odak                  | `outline: 2px solid var(--color-focus); outline-offset: 2px` — açık yüzeyde 5.77:1 ✅; koyu yüzeyde `--color-focus-on-dark` 15.65:1 ✅                                                                                                                                                       |
| Devre dışı            | `opacity` **kullanılmaz** (kontrastı ölçülemez hâle getirir). Ayrı yüzey/metin tokenları: zemin `--color-slate-200`, metin `--color-neutral-600` (7.69:1 üzerinde değil — 1.28:1; bu yüzden devre dışı buton ayrıca `aria-disabled` ve açıklayıcı metin taşır, tek başına renkle anlatılmaz) |

**Hiyerarşi — bir ekranda tek birincil**

| Seviye    | Görünüm                                                                          | Kullanım                                   |
| --------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| Birincil  | Dolu `--color-action`, metin `--color-action-text`                               | Sayfa başına **bir** ana eylem             |
| WhatsApp  | Dolu `--color-action-whatsapp`, metin beyaz, **WhatsApp simgesi + fiil zorunlu** | Yalnız WhatsApp'a giden eylemler           |
| İkincil   | Dolu `--color-action-secondary` veya 1px `--color-border-strong` çerçeveli       | Alternatif eylem                           |
| Üçüncül   | Metin + kalıcı alt çizgi, renk `--color-link`                                    | Düşük öncelik                              |
| Pazaryeri | 1px `--color-border-strong` çerçeve, nötr zemin, **pazaryeri adı metinde**       | Amazon / Hepsiburada / Trendyol / Pazarama |

**Koyu yüzeyde:** birincil ve WhatsApp butonları **1px `--color-border-strong-on-dark`
kenarlık taşımak zorundadır** (§3.6.3) — bu isteğe bağlı bir stil değil, erişilebilirlik
gereğidir.

**Durumlar:** hover = zemin OKLCH `L` değeri −4%, gölge `--shadow-2`. Active = `L` −8%,
gölge `--shadow-1`, `translateY(1px)`. Renk tonu (H) ve kroma (C) **değişmez** — buton
"başka bir renk" olmaz.

### 7.4 Kart anatomisi

**Ürün kartı** (§1.3'ün üç kuralını taşıyan bileşen)

```
┌─ 1px --color-border ─ --radius-lg ─ --shadow-1 ────┐
│  Görsel alanı: 1:1, --color-surface-raised zemin,  │
│  object-fit: contain, 16px iç boşluk               │  ← ürün fotoğrafları beyaz fonlu
├────────────────────────────────────────────────────┤
│  20px dolgu (mobil) / 24px (masaüstü)              │
│  ETİKET  --text-label, --color-text-muted          │  ← marka · kategori
│  Ürün adı --text-h4, --color-text-strong, 2 satır  │
│  Uyumluluk satırı --text-body-sm --color-text      │  ← "Şu modellerle uyumlu: …"
│  ── 1px --color-border ayırıcı ──                  │
│  Fiyat --text-h4 tabular-nums  |  Durum rozeti     │  ← rozet: renk + metin + simge
│  Birincil eylem butonu (tam genişlik)              │
└────────────────────────────────────────────────────┘
```

Kurallar:

- Görsel alanı `contain`, `cover` değil: parça fotoğrafında kırpma yanlış ürün algısı yaratır.
- Ürün adı **2 satırda kesilir** (`line-clamp: 2`) ve tam ad `title`/`aria-label` ile korunur.
- Fiyat yoksa aynı tipografik ağırlıkta "Fiyat için iletişime geçin" yazar — boşluk bırakılmaz,
  küçültülmez. Bu satır her zaman aynı yerde durur.
- Durum rozeti hiçbir zaman yalnız renk değildir: `● Stokta` / `◔ Siparişle` / `⚠ Sınırlı stok`
  / `✕ Tükendi` gibi simge + metin.
- Hover: `--shadow-2` + sınır rengi `--color-border-strong`. Ölçek/döndürme **yok**.

**Hizmet kartı:** aynı iskelet, görsel alanı yerine 40×40px simge kutusu (`--radius-sm`,
zemin `--color-accent-tech` %12 karışım, simge `--color-text-strong`).

**Koyu yüzeyde kart:** zemin `--color-surface-brand-alt` (`#123B5D`), kenarlık
`--color-border-strong-on-dark`, gölge yok.

### 7.5 Boşluk ritmi

4px tabanlı, 8px ana adım:

| Token        | px  | Kullanım                                     |
| ------------ | --- | -------------------------------------------- |
| `--space-1`  | 4   | Simge–metin sıkı boşluk, rozet iç dolgu      |
| `--space-2`  | 8   | Buton simge boşluğu, etiket alt boşluk       |
| `--space-3`  | 12  | Form alanı iç dolgu (dikey)                  |
| `--space-4`  | 16  | Kart içi öğe arası, grid gap (mobil)         |
| `--space-5`  | 20  | Kart dolgusu (mobil)                         |
| `--space-6`  | 24  | Kart dolgusu (masaüstü), grid gap (masaüstü) |
| `--space-8`  | 32  | Blok arası                                   |
| `--space-12` | 48  | Alt bölüm arası                              |
| `--space-16` | 64  | **Bölüm dikey dolgusu — mobil**              |
| `--space-24` | 96  | **Bölüm dikey dolgusu — masaüstü**           |
| `--space-32` | 128 | Sinematik / hero bölüm dolgusu               |

Kurallar:

- **Koyu bölümler daha çok nefes ister:** koyu yüzeyli bir bölümün dikey dolgusu bir adım
  yukarı çıkar (masaüstünde 96 → 128).
- **Koyu→açık geçişinde ek boşluk yok**, sınır keskin: yüzey değişimi zaten ayırıcıdır.
- Kapsayıcı yatay dolgu: 20px (mobil) / 32px (tablet) / 48px (masaüstü); maksimum genişlik
  1280px, gövde metin bloğu 40rem.
- Dikey ritim yalnız bu ölçekten seçilir. `padding: 18px` gibi ara değer yoktur.

---

## 8. Marka hareket sıfatları

Hareket, robot süpürgenin kendi fiziğinden gelir: **kütlesi var, sessiz çalışır, kesin
konumlanır.** Aşağıdaki süre ve easing yönleri hareket dili çalışmasının başlangıç
sözleşmesidir; nihai değerler o çalışmada kesinleşir.

| Sıfat                              | Somut karşılık                                                                                                                                                                                                                      | Nerede                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **1. Ağır** (kütlesi var)          | Süre `--motion-slow: 480ms`, easing `--ease-brand: cubic-bezier(.2,.8,.2,1)` — hızlı çıkış, uzun yumuşak yerleşme. **Overshoot/yay yok** (`> 1` çıkan easing yasak): ağır bir cihaz zıplamaz.                                       | Bölüm geçişleri, modal açılışı, koyu→açık sahne değişimi   |
| **2. Kalibre** (kesin)             | Süre `--motion-fast: 150ms`, easing `--ease-precise: cubic-bezier(.4,0,.2,1)`. Mesafe küçük: en fazla `2px` `translateY`. Ölçek değişimi yok.                                                                                       | Buton hover/active, çip seçimi, filtre değişimi, form odak |
| **3. Sinematik** (kullanıcı sürer) | Kaydırmaya bağlı (`scroll-driven`), **otomatik oynatma yok**. Sahne ilerlemesi kaydırma mesafesine doğrusal bağlanır, easing yalnız uçlarda yumuşatılır. `--motion-scene: 900ms` yalnız sahnenin _kendi kendine_ toparlanma süresi. | Yalnız hero ve 3D anlatım bölümü. Kataloğa girmez.         |
| **4. Sessiz** (dikkat çalmaz)      | Katalogda giriş animasyonu: `opacity 0→1` + `translateY 8px→0`, `--motion-base: 220ms`, kademeli gecikme 40ms, **tek seferlik** (tekrar kaydırmada oynamaz). Fiyat, stok ve durum rozeti **hiç animasyonlanmaz**.                   | Ürün grid'i, hizmet listesi, SSS                           |
| **5. Hesap veren** (dürüst)        | Yükleniyor durumu = **iskelet (skeleton)**, spinner değil — düzen kayması olmaz. Hata durumunda titreme/sallanma (`shake`), nabız (`pulse`), yanıp sönme **yok**; hata metinle anlatılır. Başarı onayında konfeti/parıltı yok.      | Tüm veri yükleme, form gönderimi, hata ve onay durumları   |

**Genel sınırlar**

- Hiçbir animasyon 600ms'i geçmez (sinematik kaydırma hariç, o kullanıcı kontrolündedir).
- Aynı anda en fazla **iki** hareketli öğe. Üçüncüsü gürültüdür.
- Animasyon kaydırmayı, ürün incelemeyi veya WhatsApp'a ulaşmayı **hiçbir koşulda
  geciktirmez** (§14). WhatsApp butonu ilk boyamada etkileşime hazırdır.
- Yalnız `transform` ve `opacity` animasyonlanır. `width`, `height`, `top`, `left` asla.
- Camgöbeği parıltısı (glow) yalnız 3D sahnede, yalnız ışık olarak; DOM'da `box-shadow`
  parıltısı yok (§15 "parlak yeşil, neon efekt ve yoğun parıltı katalog alanlarında
  sınırlanmalıdır").

### 8.1 `prefers-reduced-motion: reduce` altında

Bu bir "hafifletme" değil, **ayrı ve tam bir deneyimdir**:

| Öğe                                       | Azaltılmış hareket davranışı                                                                                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Süre tokenları                            | `--motion-fast/base/slow/scene` → `1ms`. Geçişler görünmez ama durum değişimi anında ve **görsel olarak korunur** (hover/focus renkleri aynen çalışır).                 |
| Kaydırmaya bağlı 3D sahne                 | **Tamamen durur.** Yerine yüksek kaliteli statik poster görseli (`next/image`) gösterilir. Kullanıcı isterse "3D sahneyi başlat" butonuyla açar — varsayılan kapalıdır. |
| Parallax, scroll-scrub, otomatik carousel | Tamamen kapalı. Carousel varsa yalnız kullanıcı tetiklemesiyle ilerler.                                                                                                 |
| Giriş animasyonları (fade/slide)          | Kaldırılır; öğeler doğrudan son durumda render edilir.                                                                                                                  |
| İskelet (skeleton) parlaması              | Hareketli parlama yerine sabit nötr blok.                                                                                                                               |
| `scroll-behavior`                         | `auto` (yumuşak kaydırma kapalı).                                                                                                                                       |
| Video / GIF                               | `autoplay` yok; poster + oynat düğmesi.                                                                                                                                 |
| Odak göstergesi                           | Değişmez — her koşulda görünür (§15 erişilebilirlik kuralı).                                                                                                            |

Ek: 3D sahne, azaltılmış hareket tercihi olmasa bile **düşük güçlü cihaz ve dar bant**
durumlarında aynı poster yedeğine düşer (§14). Ve her koşulda: **Canvas'ta metin yoktur**;
ürün, hizmet ve iletişim bilgisi 3D hiç yüklenmese de DOM'da erişilebilirdir (`CLAUDE.md`).

---

## 9. Açık uçlar — yayından önce kullanıcıdan alınacak

Bu belge aşağıdakileri **uydurmadı**; §21 kapsamında kullanıcıdan alınacak:

| #   | Konu                                                              | Bu belgedeki durumu                                                         |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Nihai marka yazımı ("Robot Fix" / "RobotFix")                     | §2'de gerekçeli **öneri** verildi; karar kullanıcıya ait                    |
| 2   | Nihai logo ve wordmark çizimi                                     | Kapsam dışı; §2.5'te yalnız karakter yönü verildi                           |
| 3   | Slogan                                                            | §6.6'da adaylar **onaylanmamış** olarak listelendi                          |
| 4   | `₺` glif desteği ve para birimi gösterimi                         | §4.3-4'te ölçüm şartı olarak yazıldı                                        |
| 5   | Archivo / Manrope / JetBrains Mono Türkçe glif render doğrulaması | §4.3'te 5 adımlı somut test listesi verildi; **varsayılmadı**               |
| 6   | Çalışma saatleri (§10: "Hafta içi 09.00–18.00")                   | Onay metninde kullanılacak; teyit edilmeden yazılmaz                        |
| 7   | WhatsApp numarası                                                 | `site_settings` tablosunda yaşar; belgeye ve koda yazılmaz                  |
| 8   | Hizmet listesi kesinleşmesi                                       | Ses örneklerinde hizmet adı geçmedi; §5'teki liste teyit bekliyor           |
| 9   | Pazaryeri mağaza bağlantıları                                     | §6.4'teki pazaryeri buton metinleri hazır; bağlantı yoksa buton gösterilmez |
| 10  | Performans bütçesi ölçümü (font ağırlığı)                         | §4.2'de düşürme sırası tanımlandı; ölçüm yapılmadı                          |

---

## Ek A — Kontrast özeti (tek bakış)

**Geçenler (AA veya üstü)**

`#FFFFFF`/`#0B1F33` 16.69 · `#FFFFFF`/`#0B0F14` 19.22 · `#0B1F33`/`#F5F8FA` 15.65 ·
`#F5F8FA`/`#0B1F33` 15.65 · `#FFFFFF`/`#123B5D` 11.61 · `#F5F8FA`/`#123B5D` 10.88 ·
`#D7E0E8`/`#0B1F33` 12.49 · `#D7E0E8`/`#123B5D` 8.69 · `#334155`/`#FFFFFF` 10.35 ·
`#334155`/`#F5F8FA` 9.71 · `#3FC7D3`/`#0B0F14` 9.45 · `#0B1F33`/`#3FC7D3` 8.20 ·
`#3FC7D3`/`#0B1F33` 8.20 · `#475467`/`#FFFFFF` 7.69 · `#FFFFFF`/`#075E54` 7.67 ·
`#FFFFFF`/`#B42318` 6.57 · `#FFFFFF`/`#0B6E4F` 6.25 · `#0B6E4F`/`#FFFFFF` 6.25 ·
`#FFFFFF`/`#175CD3` 5.99 · `#FFFFFF`/`#1769AA` 5.77 · `#1769AA`/`#FFFFFF` 5.77 ·
`#FFFFFF`/`#067647` 5.69 · `#FFFFFF`/`#B54708` 5.43 · `#1769AA`/`#F5F8FA` 5.41 ·
`#677684`/`#0B1F33` 3.58 (metin dışı)

**Geçmeyenler — kullanımı daraltıldı, renk değiştirilmedi**

| Çift                        | Oran | Yasak                                                     | İzin                                |
| --------------------------- | ---- | --------------------------------------------------------- | ----------------------------------- |
| `#D7E0E8` / `#FFFFFF`       | 1.34 | Form sınırı, çip sınırı, odak, buton çerçevesi            | Dekoratif ayırıcı                   |
| `#D7E0E8` / `#F5F8FA`       | 1.25 | Aynı                                                      | Dekoratif ayırıcı                   |
| `#123B5D` / `#0B1F33`       | 1.44 | Koyuda işlevsel sınır                                     | Dekoratif ayırıcı, koyu kart zemini |
| `#075E54` yüzey / `#0B1F33` | 2.18 | Kenarlıksız buton                                         | 1px `#677684` kenarlıkla buton      |
| `#3FC7D3` / `#FFFFFF`       | 2.03 | Camgöbeği metin/sınır/odak; camgöbeği üstünde beyaz metin | Camgöbeği dolgu + `#0B1F33` metin   |
| `#0B6E4F` yüzey / `#0B1F33` | 2.67 | Kenarlıksız buton                                         | 1px `#677684` kenarlıkla buton      |
| `#1769AA` / `#0B1F33`       | 2.89 | Koyuda bağlantı, metin, ikon, odak, sınır                 | Yalnız açık yüzeyde                 |
| `#1769AA` / `#0B0F14`       | 3.24 | Koyuda metin (4.5 altı)                                   | Yalnız açık yüzeyde                 |
