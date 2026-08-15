import type { NextConfig } from "next";
// Yol takma adı (`@/`) burada çözülmez: bu dosya Next'in kendi yükleyicisiyle
// okunur, tsconfig `paths` ayarı devreye girmez. Bu yüzden göreli yol.
import { isLoopbackOrPrivateHost } from "./lib/private-host";

/*
  Supabase Storage görselleri `next/image` ile servis edilir (CLAUDE.md mimari
  kararı). `next/image` uzak bir kaynaktan görsel almadan önce o kaynağın
  AÇIKÇA izinli olmasını ister — aksi hâlde site açık bir görsel proxy'sine
  dönüşür ve başkasının bant genişliğini bizim üzerimizden harcayabilir.

  Desen env'den TÜRETİLİR, elle yazılmaz: yerelde `127.0.0.1:54341`, üretimde
  proje alan adı olur. İkisini de sabit yazsaydık ortamlardan biri sessizce
  bozulurdu.

  `NEXT_PUBLIC_SUPABASE_URL` tanımsızsa hiç desen eklenmez; Supabase
  yapılandırılmadığında zaten gösterilecek görsel yoktur.
*/
function supabaseUrl(): URL | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function supabaseImagePattern(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const url = supabaseUrl();
  if (!url) return [];

  return [
    {
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      port: url.port || undefined,
      // Yalnız herkese açık nesne yolu; imzalı/özel yollar buradan geçmez.
      pathname: "/storage/v1/object/public/**",
    },
  ];
}

/*
  YEREL SUPABASE İSTİSNASI (Next 16 SSRF koruması).

  Next 16, görsel iyileştiricinin ÖZEL/loopback bir IP'ye istek atmasını
  varsayılan olarak reddeder (`fetchExternalImage` → "url parameter is not
  allowed", 400). Bu, sunucuyu iç ağa yönlendirmeye çalışan SSRF saldırılarına
  karşı doğru bir varsayılandır.

  Ama yerel geliştirmede Supabase `http://127.0.0.1:54341` üzerinde çalışır;
  bu koruma yüzünden HER ürün görseli yerelde kırık görünür — üretimde ise
  sorunsuz çalışır. Sessiz bir ortam farkı.

  Bu yüzden istisnayı YALNIZCA yapılandırılmış Supabase adresinin kendisi
  loopback/özel ağ adresiyken açıyoruz. Genel bir alan adı (üretim) görülürse
  bayrak `false` kalır — üretimde SSRF koruması hiç gevşemez.

  Gevşeme kapsamı yine `remotePatterns` ile sınırlıdır: iyileştirici sadece o
  tek host + port + `/storage/v1/object/public/**` yolunu çekebilir; rastgele
  bir iç adres yine reddedilir.
*/
function allowLocalImageHost(): boolean {
  const url = supabaseUrl();
  return url !== null && isLoopbackOrPrivateHost(url.hostname);
}

const nextConfig: NextConfig = {
  // Üst dizinde (~) başka bir package-lock.json bulunduğu için workspace kökünü
  // bu projeye sabitliyoruz; aksi hâlde Turbopack yanlış kökü seçtiğini uyarıyor.
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: supabaseImagePattern(),
    dangerouslyAllowLocalIP: allowLocalImageHost(),
  },
};

export default nextConfig;
