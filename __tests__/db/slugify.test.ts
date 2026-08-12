import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connect } from "./helpers/db";

/*
  `public.slugify()` — Türkçe karakter sadeleştirmesi.

  Slug üretimi TEK YERDE (veritabanında) yaşar. Yönetim paneli (Faz 3) önizleme
  için aynı fonksiyonu RPC ile çağırır; ikinci bir TypeScript uygulaması
  YAZILMADI çünkü iki uygulama zamanla birbirinden sapardı.

  Kritik nokta: Türkçe'de I→ı ve İ→i'dir. Postgres'in `lower()` fonksiyonu
  bunu bilmez; bu yüzden büyük harfler `lower()` çağrılmadan ÖNCE çevrilir.
*/

let client: Client;

beforeAll(async () => {
  client = await connect();
});

afterAll(async () => {
  await client?.end();
});

async function slugify(input: string): Promise<string> {
  const { rows } = await client.query<{ slug: string }>("select public.slugify($1) as slug", [
    input,
  ]);
  return rows[0].slug;
}

describe("slugify — Türkçe karakterler", () => {
  it.each([
    ["Şarj İstasyonu", "sarj-istasyonu"],
    ["Ana Fırça Modülü", "ana-firca-modulu"],
    ["IŞIK ışık", "isik-isik"],
    ["İlgi ilgi", "ilgi-ilgi"],
    ["Çiğ Köfte", "cig-kofte"],
    ["Yağmur Ölçer", "yagmur-olcer"],
    ["ĞÜŞİÖÇ", "gusioc"],
    ["ığüşöç", "igusoc"],
    ["Türkçe: ıİğĞşŞçÇöÖüÜ", "turkce-iiggssccoouu"],
    ["Sensör ve Navigasyon", "sensor-ve-navigasyon"],
    ["Yedek Parça Satışı", "yedek-parca-satisi"],
    ["Periyodik Bakım ve Temizlik", "periyodik-bakim-ve-temizlik"],
  ])("%s → %s", async (input, expected) => {
    expect(await slugify(input)).toBe(expected);
  });
});

describe("slugify — biçimsel kurallar", () => {
  it.each([
    ["  Boşluklu   Ad  ", "bosluklu-ad"],
    ["Roborock S7 MaxV Ultra", "roborock-s7-maxv-ultra"],
    ["Çok---Fazla___Ayırıcı", "cok-fazla-ayirici"],
    ["-Baştaki ve sondaki-", "bastaki-ve-sondaki"],
    ["Nokta.Virgül,Ünlem!", "nokta-virgul-unlem"],
    ["100% Pamuk (2'li)", "100-pamuk-2-li"],
  ])("%s → %s", async (input, expected) => {
    expect(await slugify(input)).toBe(expected);
  });

  it("üretilen slug şemadaki slug kısıtını karşılar", async () => {
    const samples = [
      "Şarj İstasyonu Adaptörü",
      "HEPA Filtre — İkili Paket",
      "Lidar Sensör Modülü (Yeni)",
    ];
    for (const sample of samples) {
      const slug = await slugify(sample);
      expect(slug, `${sample} → ${slug}`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("tohumlanan tüm slug'lar geçerli", async () => {
    for (const table of ["brands", "categories", "products", "services", "device_models"]) {
      const { rows } = await client.query<{ slug: string }>(
        `select slug from public.${table} where slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
      );
      expect(rows.map((r) => r.slug), `${table} geçersiz slug içeriyor`).toEqual([]);
    }
  });
});
