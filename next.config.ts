import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Üst dizinde (~) başka bir package-lock.json bulunduğu için workspace kökünü
  // bu projeye sabitliyoruz; aksi hâlde Turbopack yanlış kökü seçtiğini uyarıyor.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
