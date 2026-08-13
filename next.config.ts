import type { NextConfig } from "next";

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
function supabaseImagePattern(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return [];
  }

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

const nextConfig: NextConfig = {
  // Üst dizinde (~) başka bir package-lock.json bulunduğu için workspace kökünü
  // bu projeye sabitliyoruz; aksi hâlde Turbopack yanlış kökü seçtiğini uyarıyor.
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: supabaseImagePattern(),
  },
};

export default nextConfig;
