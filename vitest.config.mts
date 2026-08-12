import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    // Veritabanı testleri ayrı yapılandırmada (yerel Supabase gerektirir).
    exclude: ["__tests__/db/**"],
  },
});
