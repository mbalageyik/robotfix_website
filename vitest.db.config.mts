import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

/*
  Veritabanı testleri — YEREL SUPABASE GEREKTİRİR (`supabase start`).
  Varsayılan `npm run test` bunları çalıştırmaz; Docker'ı olmayan bir ortamda
  birim testleri yine de yeşil kalır. Çalıştırma: npm run test:db

  `.env.local` BURADA yüklenir çünkü testlerin bir kısmı PostgREST üzerinden
  (anon anahtarıyla) gider — doğrudan Postgres bağlantısı PostgREST'in sorgu
  anlamını test EDEMEZ. Anahtarlar yalnız sürece aktarılır, hiçbir yere basılmaz.
*/
const env = loadEnv("", process.cwd(), "");

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      /*
        `server-only` paketi varsayılan girdisinde BİLEREK hata atar; amacı bir
        sunucu modülünün istemci paketine sızmasını derleme zamanında yakalamak.
        Next.js bunu `react-server` koşuluyla zararsız `empty.js`'e çözer.

        Vitest'in Node çözümleyicisinde o koşul yoktur, bu yüzden `server-only`
        içeren her modülü içe aktarmak testi çökertir. Burada Next.js'in yaptığı
        çözümün AYNISI elle yapılır.

        Bu, korumayı ZAYIFLATMAZ: koruma üretim derlemesinde çalışır ve `npm run
        build` her fazda kapı olarak koşulur. Burada yalnız test koşucusunun
        modülü yükleyebilmesi sağlanır.
      */
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/db/**/*.test.ts"],
    // Aynı satırlara dokunan işlemler kilitlenmesin.
    fileParallelism: false,
    testTimeout: 30_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      // Testler demo veri üzerinde çalışır; geliştiricinin .env.local bayrağına
      // bağlı kalmasın diye BURADA sabitlenir.
      NEXT_PUBLIC_SHOW_DEMO_PRODUCTS: "true",
    },
  },
});
