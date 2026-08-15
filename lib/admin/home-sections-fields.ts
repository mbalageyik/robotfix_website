/*
  Ana sayfa bölüm formunun alan adları.

  NEDEN AYRI DOSYA: aksiyon dosyası `"use server"` ile işaretlidir ve böyle bir
  modül YALNIZ asenkron fonksiyon dışa aktarabilir. Bu yardımcılar senkron
  olduğu için orada duramaz; ama hem formun (istemci) hem aksiyonun (sunucu)
  aynı adları kullanması şart — ad üretimi tek yerde kalsın diye buraya alındı.

  Kimlik alan adının İÇİNDE taşınır (`enabled:sss`). Alternatif, her bölüm için
  ayrı bir gizli kimlik alanı göndermekti; bu, satır sayısını ikiye katlar ve
  kimliğin hangi satıra ait olduğunu formdan okunamaz hâle getirirdi.
*/

const ENABLED_PREFIX = "enabled:";
const STATUS_PREFIX = "status:";

/** Bölümün açık/kapalı onay kutusunun `name` değeri. */
export function homeSectionEnabledField(id: string): string {
  return `${ENABLED_PREFIX}${id}`;
}

/** Bölümün onay durumu seçicisinin `name` değeri. */
export function homeSectionStatusField(id: string): string {
  return `${STATUS_PREFIX}${id}`;
}
