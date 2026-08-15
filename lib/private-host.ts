/*
  Bir sunucu adının LOOPBACK ya da özel (iç ağ) adres olup olmadığını söyler.

  Tek kullanıcısı `next.config.ts`: Next 16'nın görsel iyileştiricisi, SSRF'e
  karşı özel IP'lere istek atmayı varsayılan olarak reddeder. Yerel Supabase
  `127.0.0.1` üzerinde çalıştığı için bu koruma yerelde tüm ürün görsellerini
  kırar. İstisnayı yalnız yerel adres için açabilmek üzere bu ayrımı yaparız —
  üretimde (genel alan adı) koruma olduğu gibi kalır.

  Sadece SÖZDİZİMSEL bir kontroldür: alan adı çözümlemesi yapmaz. Bu yeterli,
  çünkü karar verdiğimiz şey "kendi yapılandırdığımız Supabase adresi yerel mi"
  sorusudur; kullanıcıdan gelen rastgele bir adres değil.
*/
export function isLoopbackOrPrivateHost(hostname: string): boolean {
  // IPv6 adresleri URL'de köşeli parantezle gelir: [::1]
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host === "0.0.0.0") return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4) return false;

  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return false;

  const [a, b] = octets;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // RFC1918 /8
  if (a === 192 && b === 168) return true; // RFC1918 /16
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918 /12
  if (a === 169 && b === 254) return true; // link-local
  return false;
}
