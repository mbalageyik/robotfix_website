/*
  ============================================================================
  GA4 YAPILANDIRMASI — ölçüm kimliğinin okunduğu TEK yer.
  ============================================================================

  Ölçüm kimliği koda GÖMÜLMEZ, `NEXT_PUBLIC_GA_MEASUREMENT_ID` ortam
  değişkeninden gelir. Değişken boşsa analitik katmanı hiç render edilmez:
  ne script yüklenir, ne çerez onayı bandı görünür. Yani "GA yok" durumu
  sessiz ve tam bir kapanmadır, yarım yüklenmiş bir izleyici değildir.

  `process.env.NEXT_PUBLIC_*` build sırasında METİN OLARAK gömülür. Bu yüzden
  değişkene burada olduğu gibi TAM adıyla ve statik olarak erişilmelidir;
  `process.env[key]` biçiminde dinamik erişim derlemede boş döner.

  BİÇİM DOĞRULANIR. Yanlış kimlik (örneğin GTM konteyner kimliği `GTM-…` veya
  eski Universal Analytics `UA-…`) sessizce yüklenirse hiçbir veri gelmez ve
  sorun aylar sonra fark edilir. Desen tutmuyorsa konsola yazıp kapanmak,
  görünmez biçimde çalışmamaktan iyidir.
*/

/** GA4 ölçüm kimliği biçimi: `G-` + en az dört büyük harf/rakam. */
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;

const rawMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/**
 * Doğrulanmış GA4 ölçüm kimliği; yapılandırılmamışsa veya biçimi bozuksa
 * `null`. `null` olduğunda analitik katmanının tamamı render edilmez.
 */
export const gaMeasurementId: string | null = (() => {
  const value = rawMeasurementId.trim();
  if (!value) return null;

  if (!MEASUREMENT_ID_PATTERN.test(value)) {
    console.error(
      `[analytics] NEXT_PUBLIC_GA_MEASUREMENT_ID biçimi tanınmadı: "${value}". ` +
        `Beklenen biçim "G-XXXXXXXXXX" (GA4 ölçüm kimliği). Analitik yüklenmedi.`,
    );
    return null;
  }

  return value;
})();

/** Analitik katmanının render edilip edilmeyeceği. */
export const isAnalyticsConfigured = gaMeasurementId !== null;
