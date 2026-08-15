import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { isLoopbackOrPrivateHost } from "@/lib/private-host";

/*
  `next.config.ts`, Next 16'nın SSRF korumasını (`dangerouslyAllowLocalIP`)
  YALNIZ yerel Supabase için gevşetir. Bu kararı veren tek yer aşağıdaki
  yüklemdir; yanlış tarafa düşmesinin iki farklı bedeli vardır:

    - Yerel adres "genel" sayılırsa → görseller yerelde sessizce kırılır
      (bu dosyayı doğuran hata tam olarak buydu).
    - GENEL bir adres "yerel" sayılırsa → üretimde SSRF koruması kapanır.
      Asıl korunması gereken yön budur.
*/

describe("yerel/özel ağ adresleri", () => {
  it("loopback adreslerini tanır", () => {
    for (const host of ["127.0.0.1", "127.1.2.3", "localhost", "app.localhost", "::1", "[::1]"]) {
      expect(isLoopbackOrPrivateHost(host), host).toBe(true);
    }
  });

  it("RFC1918 ve link-local aralıklarını tanır", () => {
    for (const host of [
      "10.0.0.5",
      "192.168.1.10",
      "172.16.0.1",
      "172.31.255.254",
      "169.254.1.1",
    ]) {
      expect(isLoopbackOrPrivateHost(host), host).toBe(true);
    }
  });
});

describe("genel adresler yerel sayılmaz", () => {
  it("Supabase üretim alan adını genel sayar", () => {
    expect(isLoopbackOrPrivateHost("abcdefghijkl.supabase.co")).toBe(false);
  });

  it("özel aralıkların dışındaki IP'leri genel sayar", () => {
    for (const host of ["8.8.8.8", "172.15.0.1", "172.32.0.1", "192.169.0.1", "11.0.0.1"]) {
      expect(isLoopbackOrPrivateHost(host), host).toBe(false);
    }
  });

  it("yerel adres gibi görünen ama olmayan adları genel sayar", () => {
    // "localhost" ile BİTMEYEN, yalnız içinde geçen adlar saldırganın
    // kaydedebileceği gerçek alan adlarıdır.
    for (const host of ["localhost.example.com", "notlocalhost", "127.0.0.1.example.com"]) {
      expect(isLoopbackOrPrivateHost(host), host).toBe(false);
    }
  });
});

describe("next.config yerel istisnayı bu yüklemle bağlar", () => {
  const config = readFileSync(
    join(fileURLToPath(new URL("..", import.meta.url)), "next.config.ts"),
    "utf8",
  );

  it("dangerouslyAllowLocalIP koşulsuz açılmaz", () => {
    expect(config).toContain("isLoopbackOrPrivateHost");
    expect(config).not.toMatch(/dangerouslyAllowLocalIP:\s*true/);
  });
});
