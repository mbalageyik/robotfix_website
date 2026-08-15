/*
  ANA SAYFA METİNLERİ — tek kaynak.

  Bu dosyada YALNIZ marka anlatısı ve süreç açıklaması bulunur. Ürün, marka,
  kategori ve hizmet adları burada DEĞİL, veritabanından gelir; buraya elle
  yazılmış bir katalog verisi girmez.

  DOĞRULUK SINIRI (bilgi dosyası §10, §20 + CLAUDE.md):
  Burada hiçbir sayısal başarı iddiası, süre taahhüdü, memnuniyet oranı,
  yetkili servis/ortaklık ifadesi veya fiyat bulunmaz. Süreç ve SSS metinleri
  "işletme tarafından onaylanana kadar taslak" statüsündedir; her biri
  aşağıda `TODO(business)` ile işaretlidir.
*/

// ---------------------------------------------------------------------------
// Açılış (hero) — bilgi dosyası §13/1
// ---------------------------------------------------------------------------
/*
  İÇERİK SÖZLEŞMESİ (Faz 5'ten devralındı, DEĞİŞTİRİLMEDİ):
  Başlık, değer önerisi ve iki CTA hero'nun görsel sunumu ne olursa olsun
  DOM'da metin olarak kalır (bilgi dosyası §14: "Temel ürün, hizmet ve
  iletişim bilgileri 3D sahne yüklenmese bile erişilebilir olmalıdır").

  Metinler buraya Faz 6'da TAŞINDI — yeniden yazılmadı. Önceden bileşenin
  içinde satır içiydi; sunumu değişen bir bileşenin metni de birlikte
  değişmesin diye tek kaynağa alındı.
*/
export const HERO_CONTENT = {
  /* Üst etikette marka adı YOKTUR — aşağıdaki büyütme kuralına bakınız. */
  overline: "Gaziantep · Robot süpürge teknik servisi ve yedek parça",
  title: "Robot süpürgeniz için parça ve teknik servis",
  body:
    "Robot Fix; robot süpürgelerin bakımını, onarımını ve yedek parça tedarikini tek bir " +
    "uzmanlık altında toplar. Cihazınızın markasını ve modelini iletin, uygun çözümü birlikte " +
    "belirleyelim.",
  primaryCtaLabel: "Ürünleri İncele",
  primaryCtaHref: "/urunler",
  /*
    GÖRSEL YER TUTUCUDUR. Projede gerçek ürün/servis fotoğrafı yoktur ve
    stok görsel hotlink edilmez. Dosyanın kendi içinde de gerekçe yazılıdır.
    TODO(business): gerçek fotoğraf sağlandığında hem dosya hem bu alt metni
    güncellenecek.
  */
  image: {
    src: "/gorseller/hero-ornek-gorsel.svg",
    /* Alt metin görselin YER TUTUCU olduğunu da söyler — sessizce gerçekmiş gibi sunulmaz. */
    alt: "[ÖRNEK] Robot süpürgenin üstten görünümünü anlatan çizim — gerçek ürün fotoğrafı yerine kullanılan yer tutucu",
    width: 1200,
    height: 750,
  },
} as const;

// ---------------------------------------------------------------------------
// Değer önerisi (bilgi dosyası §2 — konumlandırma)
// ---------------------------------------------------------------------------

/*
  ÜST ETİKETLERDE (`overline`) MARKA ADI GEÇMEZ — İHLAL EDİLEMEZ.

  Üst etiketler arayüzde CSS `text-transform: uppercase` ile basılır. Belge
  `lang="tr"` olduğu için tarayıcı TÜRKÇE büyütme kuralını uygular: "Fix"in
  "i"si noktalı büyük harfe döner ve ekranda CLAUDE.md'nin yasakladığı
  varyantlardan biri belirir. Kaynak metinde marka adı DOĞRU yazıldığı için
  düz bir yazım denetimi bunu yakalayamaz. Marka adı bu yüzden yalnız başlık
  ve gövde metninde kullanılır; oralarda büyütme yoktur.

  `__tests__/home-content.test.ts` bunu otomatik kontrol eder.
*/
/** Konumlandırmanın bir ayağı. `lead` işaretli olan arayüzde önde durur. */
export interface ValuePillar {
  title: string;
  body: string;
  /**
   * Konumlandırmanın TAŞIYICI ayağı mı.
   *
   * §22'nin 1. maddesi ("yalnızca yedek parça mağazası olarak değil, ürün ve
   * teknik servis uzmanlığını birleştiren marka olarak konumlandır") üç eşit
   * sütunla anlatıldığında kayboluyordu: teknik servis, parça yönlendirmesi ve
   * iletişimle aynı görsel ağırlıktaydı. İşaret, o ayağa arayüzde daha büyük
   * bir başlık ve vurgu çizgisi verir.
   *
   * Bu bir DURUM GÖSTERGESİ DEĞİLDİR, hiyerarşidir: bilgi kaybı olmaz, ayrım
   * yalnız renkle de anlatılmaz (başlık boyutu ve sıra da farklıdır).
   */
  lead?: boolean;
}

export const VALUE_PROPOSITION = {
  overline: "Uzmanlık alanımız",
  /* §2'deki marka vaadinin sırası korunarak teknik servis öne alındı. */
  title: "Teknik servis, parça ve ürün tek bir uzman noktada",
  /*
    §2'deki konumlandırmanın doğrudan karşılığı: "Robot Fix yalnızca yedek
    parça satan bir mağaza olarak konumlandırılmamalıdır."

    Faz 7'de GÜÇLENDİRİLDİ, yeniden yazılmadı: özgün cümlelerin üçü de
    yerinde durur; başa §2'nin "teknik servis uzmanlığı ... marka anlatısının
    temel parçasıdır" vurgusu eklendi. Yeni bir iddia (süre, adet, oran,
    yetki) EKLENMEDİ.
  */
  body:
    "Robot Fix yalnızca yedek parça satan bir mağaza değildir; çekirdeğinde teknik " +
    "servis vardır. Arıza tespiti, bakım ve onarım aynı çatı altında yürür — cihazı " +
    "inceleyen, arızayı tespit eden ve onaran ekiple parçayı öneren ekip aynıdır. Bu " +
    "yüzden “hangi parça uyar” sorusu satıştan önce cevaplanır.",
  pillars: [
    {
      title: "Teknik servis",
      body:
        "Arıza tespiti, bakım ve onarım. Cihazın durumu görülmeden işlem yapılmaz; " +
        "parça önerisi de bu incelemenin sonucudur.",
      lead: true,
    },
    {
      title: "Doğru parça yönlendirmesi",
      body:
        "Parçalar marka ve modele göre listelenir. Emin olamadığınızda cihaz modelinizi " +
        "yazın, uyumluluğu birlikte kontrol edelim.",
    },
    {
      title: "Açık iletişim",
      body:
        "WhatsApp üzerinden doğrudan yazışma. Ne yapılacağı ve ücreti konuşulmadan " +
        "işleme başlanmaz.",
    },
  ] as readonly ValuePillar[],
} as const;

// ---------------------------------------------------------------------------
// Servis vitrini (bilgi dosyası §2, §14, §22 · 1)
// ---------------------------------------------------------------------------
/*
  Bu bölüm bir SÜREÇ ANLATIMI DEĞİLDİR — `SERVICE_PROCESS` (dört adım, işletme
  onayı bekliyor) ile karıştırılmamalıdır. Burada anlatılan şey konumlandırma:
  teknik servisin markanın çekirdeği olduğu (§2, §22 · 1). Bu yüzden onay
  bekleyen operasyonel hiçbir ayrıntı (süre, ücret, kargo, adrese teslim)
  geçmez ve bölüm `contentStatus: "live"` olarak kayıtlıdır.

  GÖRÜNTÜ YER TUTUCUDUR. Projede gerçek Robot Fix atölye çekimi yoktur; yerine
  ticari kullanıma açık, atıf gerektirmeyen bir stok görüntü YERELE indirildi
  (kaynak ve lisans: `docs/varlik-lisanslari.md`). Görüntü bir mekânı ya da
  ekibi TEMSİL ETMEZ; teknik işin yakın planıdır ve alt metninde yer tutucu
  olduğu açıkça yazar — hero görselinde kurulan sözleşmenin aynısı.
*/
export const SERVICE_SHOWCASE = {
  /* Üst etikette marka adı YOKTUR — Türkçe büyütme tuzağı, yukarıdaki nota bakınız. */
  overline: "Teknik servis uzmanlığı",
  title: "Uzman ellerde teknik servis",
  body:
    "Robot süpürge; motoru, fırça sistemi, sensörleri ve şarj elektroniği birlikte " +
    "çalışan bir cihazdır. Robot Fix bu cihaza parça dizilen bir raf olarak değil, " +
    "açılıp incelenen bir bütün olarak bakar: bakım, onarım ve parça aynı uzmanlık " +
    "altında yürür.",
  media: {
    /*
      YEREL DOSYA — dış CDN'e bağlanılmaz. Hotlink her sayfa açılışını üçüncü
      bir sunucunun ayakta olmasına bağlardı.
      TODO: gerçek Robot Fix atölye/servis videosu ile değiştirilecek.
    */
    videoSrc: "/videos/servis-vitrini.mp4",
    poster: {
      src: "/gorseller/servis-vitrini-poster.jpg",
      /* Alt metin görüntünün YER TUTUCU olduğunu da söyler — gerçekmiş gibi sunulmaz. */
      alt:
        "[ÖRNEK] Bir cihazın metal alt kapağındaki vidaların tornavidayla sökülüşünü " +
        "gösteren yakın plan — gerçek Robot Fix atölye çekimi yerine kullanılan geçici görüntü",
      width: 1280,
      height: 720,
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Uyumluluk anlatımı (bilgi dosyası §13 · 7)
// ---------------------------------------------------------------------------

export const COMPATIBILITY_CONTENT = {
  overline: "Uyumluluk",
  title: "Parçanın cihazınıza uyduğundan emin olun",
  body:
    "Robot süpürgelerde aynı görünen parçalar farklı modellerde farklı çalışır. " +
    "Katalogda ürünler marka, kategori ve uyumlu cihaz modeline göre daraltılabilir; " +
    "ürün sayfasında o parçanın uyumlu olduğu modeller listelenir.",
  /*
    Uyumluluk doğrulanmış bir iddiadır (§20): doğrulanmamış kayıt ürün
    sayfasında "doğrulanmadı" ibaresiyle görünür. Bu cümle o davranışın
    kullanıcıya anlatımıdır, bir garanti değildir.
  */
  note:
    "Modelinizi listede göremiyorsanız veya emin değilseniz, cihazınızın marka ve " +
    "modelini bize yazın.",
} as const;

// ---------------------------------------------------------------------------
// Servis süreci (bilgi dosyası §10 — TASLAK)
// ---------------------------------------------------------------------------
/*
  TODO(business): §10'daki dört adımlı akış eski siteden alınmıştır ve
  "operasyonel doğruluğu yayımdan önce teyit edilmelidir". Bu yüzden buradaki
  metin MARKA-BAĞIMSIZ ve TAAHHÜTSÜZ yazıldı: süre, ücret, kargo firması,
  adrese teslim gibi doğrulanmamış hiçbir operasyonel ayrıntı geçmez.
  İşletme akışı onayladığında bu metin somutlaştırılabilir.
*/
export const SERVICE_PROCESS = {
  overline: "Servis süreci",
  title: "Cihazınızı bildirin, gerisini birlikte planlayalım",
  steps: [
    {
      title: "Cihazınızı bildirin",
      body: "Marka, model ve yaşadığınız sorunu WhatsApp üzerinden iletin.",
    },
    {
      title: "Değerlendirme",
      body: "Aktardığınız bilgiye göre olası nedenler ve izlenecek yol konuşulur.",
    },
    {
      title: "Onarım",
      body: "Onayınızın ardından cihaz incelenir ve gereken işlem yapılır.",
    },
    {
      title: "Teslim",
      body: "İşlem tamamlandığında bilgilendirilir, cihazınız size ulaştırılır.",
    },
  ],
  note:
    "Süreç cihazın durumuna göre değişebilir. Süre ve ücret bilgisi, cihaz " +
    "değerlendirildikten sonra paylaşılır.",
} as const;

// ---------------------------------------------------------------------------
// Pazaryeri kanalları (bilgi dosyası §3, §9)
// ---------------------------------------------------------------------------
/*
  §9: "Robot Fix, Amazon ve Hepsiburada gibi çevrimiçi pazaryerlerinde satış
  yapar." — bu bilgi dosyasında OLGU olarak geçer, bu yüzden yazılabilir.
  Ancak MAĞAZA BAĞLANTISI doğrulanmadan yayımlanamaz: bağlantılar yalnız
  `site_settings` üzerinden gelir, kodda sabit bir URL bulunmaz.
*/
export const MARKETPLACE_CONTENT = {
  overline: "Satış kanalları",
  title: "Pazaryerlerinden de ulaşabilirsiniz",
  body:
    "Robot Fix ürünleri Amazon ve Hepsiburada gibi çevrimiçi pazaryerlerinde de " +
    "sunulur. Bu site markanın merkezi vitrinidir; pazaryerleri alternatif " +
    "satın alma kanalıdır.",
  /** Doğrulanmış mağaza bağlantısı girilmediğinde gösterilir. Sahte bağlantı üretilmez. */
  emptyNote:
    "Doğrulanmış mağaza bağlantıları site ayarlarına eklendiğinde burada listelenecek. " +
    "Bu arada ürün ve parça taleplerinizi WhatsApp üzerinden iletebilirsiniz.",
  /*
    §9: "Pazaryerindeki fiyat ve stok bilgilerinin otomatik olarak güncel
    olduğu izlenimi, gerçek bir entegrasyon yoksa verilmemelidir."
  */
  disclaimer:
    "Pazaryerlerindeki fiyat ve stok bilgisi ilgili pazaryerinde geçerlidir; bu " +
    "sitedeki bilgilerle otomatik eşleşmez.",
} as const;

// ---------------------------------------------------------------------------
// Marka listesi uyarısı (bilgi dosyası §10 — İHLAL EDİLEMEZ)
// ---------------------------------------------------------------------------
/*
  §10: "Bu liste, yetkili servis veya resmî marka ortaklığı anlamına gelmez."
  Marka adlarının göründüğü her yerde bu ifade GÖRÜNÜR olmalıdır; bu yüzden
  metin tek yerde tutulur ve bölüm bileşeninden çıkarılamaz.
*/
export const BRANDS_DISCLAIMER =
  "Marka adları, hizmet verilen ve parça sunulan cihazları belirtmek için kullanılır. " +
  "Yetkili servis veya resmî marka ortaklığı anlamına gelmez.";

// ---------------------------------------------------------------------------
// Sık sorulan sorular (TASLAK)
// ---------------------------------------------------------------------------
/*
  TODO(business): bilgi dosyasında hazır SSS içeriği YOKTUR. Aşağıdaki beş
  soru-cevap, doğrulanmamış hiçbir iddia içermeyecek biçimde yazılmış
  TASLAKTIR; işletme onayından sonra somutlaştırılmalıdır.

  Bu taslak durumu iki yerde görünür: burada ve `HOMEPAGE_SECTIONS` içindeki
  `contentStatus: "draft"` alanında.

  YAPILANDIRILMIŞ VERİ: bu bölüm için FAQPage JSON-LD ÜRETİLMEZ. Arama
  motoruna verilen yapılandırılmış cevap, işletmenin onayladığı cevaptır;
  taslak metin o statüyü taşımaz (§18).
*/
export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "Hangi markalara hizmet veriyorsunuz?",
    answer:
      "Farklı marka ve modellerdeki robot süpürgeler için servis ve parça desteği " +
      "sunuyoruz. Cihazınızın marka ve modelini yazarsanız, o cihaz için ne " +
      "yapabileceğimizi netleştirebiliriz.",
  },
  {
    question: "Bazı ürünlerde neden fiyat görünmüyor?",
    answer:
      "Fiyat yalnızca doğrulandığı ürünlerde yayımlanır. Fiyatı görünmeyen ürünler " +
      "için WhatsApp üzerinden güncel bilgi alabilirsiniz.",
  },
  {
    question: "Parçanın cihazıma uyduğunu nasıl anlarım?",
    answer:
      "Ürün sayfasında, o parçanın uyumlu olduğu cihaz modelleri listelenir. " +
      "Modelinizi listede göremiyorsanız cihaz modelinizi bize yazın.",
  },
  {
    question: "Onarım ne kadar sürer?",
    answer:
      "Süre; arızaya, gereken parçaya ve cihazın durumuna göre değişir. Cihazınız " +
      "değerlendirildikten sonra size bilgi verilir.",
  },
  {
    question: "Teslimat ve kargo nasıl işliyor?",
    answer:
      "Teslimat koşulları talebe göre değişebilir. Güncel koşulları görüşme " +
      "sırasında paylaşıyoruz.",
  },
] as const;

// ---------------------------------------------------------------------------
// Boş durum metinleri
// ---------------------------------------------------------------------------
/*
  Veri yokken SAHTE İÇERİK ÜRETİLMEZ. Boş bölüm ya gizlenir ya da durumu
  olduğu gibi anlatır — "yakında 500 ürün" türü bir vaat kurulmaz.
*/
export const EMPTY_STATES = {
  featured: {
    title: "Seçki henüz yayında değil",
    description:
      "Öne çıkan ürünler yönetim panelinden belirlenir. Aradığınız parçayı şimdiden " +
      "WhatsApp üzerinden sorabilirsiniz.",
  },
  queryFailed: {
    title: "Bu bölüm şu anda yüklenemedi",
    description:
      "Ürün bilgisi geçici olarak getirilemedi. WhatsApp üzerinden yazarsanız " +
      "aradığınız parçayı birlikte bulabiliriz.",
  },
} as const;
