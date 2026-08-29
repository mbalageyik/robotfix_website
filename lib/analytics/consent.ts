/*
  ============================================================================
  ÇEREZ ONAYI — kararın saklanması, okunması ve dinlenmesi.
  ============================================================================

  KVKK ve bilgi dosyası §19 gereği analitik çerezi ONAY ÖNCESİ yerleştirilemez.
  Bu dosya kararın kendisini taşır; kararı KULLANAN taraf
  `components/analytics/` altındadır.

  NEDEN `localStorage`, NEDEN ÇEREZ DEĞİL. Kararın kendisi sunucuda hiç
  okunmuyor: gtag.js tamamen tarayıcıda çalışıyor ve sayfalar statik üretiliyor.
  Kararı çereze yazsaydık her isteğe binen, sunucunun hiç bakmadığı bir başlık
  eklemiş ve statik önbelleği gereksiz yere bölmüş olurduk. `localStorage`
  sunucuya hiçbir şey göndermez ve tam olarak ihtiyacımız olan yerde —
  tarayıcıda — durur.

  NEDEN BİR "DEPO" (subscribe + snapshot), NEDEN DÜZ BİR OKUMA DEĞİL. React'in
  harici veri kaynakları için sözleşmesi `useSyncExternalStore`tur ve
  `localStorage` tam olarak öyle bir kaynaktır. Kararı bir efektin içinde okuyup
  `setState` ile React'e taşımak basamaklı render üretir (React'in
  `set-state-in-effect` kuralı bunu yakalar). Buradaki abonelik ayrıca BEDAVA
  BİR DAVRANIŞ kazandırır: `storage` olayı sayesinde bir sekmede verilen karar
  açık olan DİĞER sekmelere de anında yansır — kullanıcı onayı bir yerde geri
  aldıysa öbür sekmede ölçüm sürmez.

  ANLIK GÖRÜNTÜ ÖNBELLEKLENİR. `useSyncExternalStore` her render'da
  `getSnapshot()` çağırır ve dönen değeri `Object.is` ile karşılaştırır; değer
  her çağrıda yeniden hesaplansaydı gereksiz `localStorage` okumaları olurdu.
  Önbellek yalnız karar değiştiğinde (yazma ya da `storage` olayı) düşürülür.

  SÜRÜM ÖN EKİ ZORUNLU. İleride ölçüm kapsamı genişlerse (örneğin reklam
  ölçümü eklenirse) eski "kabul" kararı YENİ kapsamı kapsamaz; onay yeniden
  alınmalıdır. Sürüm numarasını artırmak, saklanan tüm eski kararları
  otomatik olarak geçersiz kılar.
*/

export type ConsentChoice = "granted" | "denied";

/** Karar henüz sorulmamışken kullanılan üçüncü durum. */
export type ConsentState = ConsentChoice | "unknown";

const STORAGE_KEY = "rf-analytics-consent";

/**
 * Onay metninin sürümü. Ölçümün KAPSAMI değişirse artırılır; artırıldığı anda
 * kullanıcılara bant yeniden gösterilir.
 */
const CONSENT_VERSION = 1;

/** Saklanan biçim: `<sürüm>:<karar>` — örn. `1:granted`. */
function serialize(choice: ConsentChoice): string {
  return `${CONSENT_VERSION}:${choice}`;
}

/*
  DEPOLAMA ERİŞİLEMEZSE KULLANILAN BELLEK YEDEĞİ. `localStorage` gizli sekmede
  veya çerezleri tamamen kapatan bir tarayıcıda erişim hatası atabilir. O
  durumda karar hiç saklanamaz; kullanıcının bu sekmedeki tercihini yine de
  onurlandırmak için bellekte tutulur ve sekme kapanınca unutulur.
*/
let memoryFallback: ConsentState = "unknown";

/** `getSnapshot()` kararlılığı için önbellek; `null` = henüz okunmadı. */
let cachedState: ConsentState | null = null;

const listeners = new Set<() => void>();

/** Saklanan kararı gerçekten okur — önbelleği ATLAR. */
function readFromStorage(): ConsentState {
  if (typeof window === "undefined") return "unknown";

  let stored: string | null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Depolama yok; bu sekmede verilmiş bir karar varsa o geçerlidir.
    return memoryFallback;
  }

  if (stored === serialize("granted")) return "granted";
  if (stored === serialize("denied")) return "denied";
  // Eski sürümlü veya bozuk kayıt → karar yok sayılır, onay yeniden istenir.
  return "unknown";
}

/** Önbelleği düşürür ve aboneleri uyandırır. */
function emit(): void {
  cachedState = null;
  for (const listener of listeners) listener();
}

function handleStorageEvent(event: StorageEvent): void {
  // `key === null` → `localStorage.clear()`; bizim anahtarımız da gitmiştir.
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  emit();
}

/**
 * `useSyncExternalStore` aboneliği. Referansı KARARLI olmak zorunda olduğu için
 * modül seviyesinde tanımlıdır; her render'da yeniden üretilen bir fonksiyon
 * React'i her seferinde yeniden abone olmaya zorlardı.
 */
export function subscribeConsent(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

/** İstemci anlık görüntüsü. Asla hata fırlatmaz. */
export function getConsentSnapshot(): ConsentState {
  cachedState ??= readFromStorage();
  return cachedState;
}

/**
 * Sunucu anlık görüntüsü — her zaman "sorulmadı".
 *
 * Sunucu `localStorage`i göremez. Güvenli taraf budur: karar bilinmiyorsa
 * analitik YÜKLENMEZ.
 */
export function getConsentServerSnapshot(): ConsentState {
  return "unknown";
}

/** Kararı saklar. Yazılamazsa karar oturum boyunca bellekte yaşar. */
export function storeConsent(choice: ConsentChoice): void {
  memoryFallback = choice;
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(choice));
  } catch {
    // Bellek yedeği yukarıda zaten güncellendi.
  }
  emit();
}

/** Saklanan kararı siler — kullanıcı tercihini yeniden değerlendirmek istediğinde. */
export function clearStoredConsent(): void {
  memoryFallback = "unknown";
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Yok sayılır; bellekteki durum yukarıda sıfırlandı.
  }
  emit();
}
