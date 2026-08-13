import type { Metadata } from "next";

/*
  Yönetim panelinin arama motoru direktifleri — TEK KAYNAK.

  Bilgi dosyası §17: "Yönetici alanı ... arama motorlarınca indekslenmemeli."

  İki katman birlikte uygulanır:
    1. Bu meta (`noindex, nofollow`) — sayfa başına, her admin rotasında.
    2. `app/robots.ts` içindeki `Disallow: /admin` — site genelinde tarama engeli.

  İkisi de gerekli: robots.txt taramayı engeller ama başka bir siteden bağlantı
  verilirse sayfa yine de indekslenebilir; `noindex` bunu keser. Tersine
  `noindex` yalnız sayfa alındığında görülür; robots.txt trafiği baştan keser.
*/
export const ADMIN_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
  },
};
