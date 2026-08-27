import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      /*
        `server-only` paketi varsayılan girdisinde BİLEREK hata atar; amacı bir
        sunucu modülünün istemci paketine sızmasını derleme zamanında yakalamak.
        Next.js bunu `react-server` koşuluyla zararsız `empty.js`'e çözer.

        Vitest'in Node çözümleyicisinde o koşul yoktur, bu yüzden `server-only`
        içeren her modülü içe aktarmak testi çökertirdi — yetkilendirme
        katmanı (`lib/auth/dal.ts`) tam olarak öyle bir modüldür ve test
        edilmemesi kabul edilebilir değil.

        Bu, korumayı ZAYIFLATMAZ: koruma üretim derlemesinde çalışır ve
        `npm run build` her fazda kapı olarak koşulur. Aynı takma ad
        `vitest.db.config.mts` içinde de var; gerekçe oradakiyle aynıdır.
      */
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    // Veritabanı testleri ayrı yapılandırmada (yerel Supabase gerektirir).
    exclude: ["__tests__/db/**"],
  },
});
