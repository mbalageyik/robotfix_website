import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
  ============================================================================
  YÖNETİM PANELİ GÜVENLİK BEKÇİLERİ
  ============================================================================

  Bu dosya çalışma zamanını DEĞİL, kaynağın kendisini denetler. Sebebi şu:
  Faz 3'ün ihlal edilemez kuralı "her admin server action KENDİ yetki
  kontrolünü yapar"dır ve bu kuralın ihlali sessizdir — kontrolü unutulmuş bir
  aksiyon çalışır, test edilirse (yetkili oturumla) geçer ve yalnız bir
  saldırgan aksiyona doğrudan istek attığında fark edilir.

  Statik denetim bu boşluğu kapatır: YENİ eklenen bir aksiyon kontrolü
  unutursa bu test kırılır. Kontrolün doğru ÇALIŞTIĞINI ise RLS testleri
  (__tests__/db/rls.test.ts) ve DAL'ın kendisi doğrular.
*/

const root = fileURLToPath(new URL("../..", import.meta.url));

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

function collectFiles(dir: string, matcher: (name: string) => boolean): string[] {
  const absolute = join(root, dir);
  let entries: string[];
  try {
    entries = readdirSync(absolute);
  } catch {
    return [];
  }

  return entries.flatMap((entry) => {
    const full = join(absolute, entry);
    if (statSync(full).isDirectory()) return collectFiles(join(dir, entry), matcher);
    return matcher(entry) ? [join(dir, entry).replaceAll("\\", "/")] : [];
  });
}

/**
 * Bir dosyadaki `export async function` gövdelerini kabaca ayırır.
 *
 * Tam bir ayrıştırıcı değildir ve olması da gerekmez: aradığımız şey bir
 * çağrının VARLIĞI. Sonraki `export` anahtar sözcüğüne kadar okumak, bir
 * aksiyonun gövdesini güvenle kapsar.
 */
function exportedAsyncFunctions(source: string): { name: string; body: string }[] {
  const pattern = /export\s+async\s+function\s+(\w+)/g;
  const found: { name: string; index: number }[] = [];

  for (const match of source.matchAll(pattern)) {
    found.push({ name: match[1], index: match.index });
  }

  return found.map((entry, position) => {
    const next = found[position + 1]?.index ?? source.length;
    return { name: entry.name, body: source.slice(entry.index, next) };
  });
}

// ---------------------------------------------------------------------------
// 1. Her yazma aksiyonu kendi yetkisini doğrular
// ---------------------------------------------------------------------------

describe("server action yetkilendirmesi", () => {
  const actionFiles = collectFiles("lib/admin", (name) => name.endsWith("-actions.ts"));

  it("taranacak aksiyon dosyası bulundu", () => {
    expect(actionFiles.length).toBeGreaterThanOrEqual(4);
  });

  it("her dosya 'use server' ile işaretli", () => {
    for (const file of actionFiles) {
      expect(read(file).slice(0, 40), `${file} "use server" ile başlamalı`).toContain(
        "use server",
      );
    }
  });

  it("dışa aktarılan HER aksiyon requireAdminAction() çağırır", () => {
    const offenders: string[] = [];

    for (const file of actionFiles) {
      for (const fn of exportedAsyncFunctions(read(file))) {
        if (!fn.body.includes("requireAdminAction()")) {
          offenders.push(`${file} → ${fn.name}`);
        }
      }
    }

    expect(
      offenders,
      "Her admin server action kendi yetki kontrolünü yapmalıdır; " +
        "sayfa veya proxy korumasına güvenilmez (CLAUDE.md).",
    ).toEqual([]);
  });

  it("yetki kontrolü aksiyonun İLK işidir", () => {
    /*
      Kontrolün var olması yetmez; doğrulamadan ÖNCE veritabanına yazan bir
      aksiyon kontrolü yapsa bile geç kalmış olurdu. Bu yüzden `requireAdminAction`
      çağrısı, herhangi bir Supabase çağrısından önce gelmelidir.
    */
    const offenders: string[] = [];

    for (const file of actionFiles) {
      for (const fn of exportedAsyncFunctions(read(file))) {
        const guardAt = fn.body.indexOf("requireAdminAction()");
        const clientAt = fn.body.indexOf("getServerClient()");
        if (guardAt !== -1 && clientAt !== -1 && clientAt < guardAt) {
          offenders.push(`${file} → ${fn.name}`);
        }
      }
    }

    expect(
      offenders,
      "Yetki kontrolü veritabanı istemcisi kurulmadan önce yapılmalıdır.",
    ).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Panel sayfaları korumalı ve indekslenmez
// ---------------------------------------------------------------------------

describe("yönetim paneli sayfaları", () => {
  const adminPages = collectFiles("app/admin", (name) => name === "page.tsx");

  /*
    İKİ MUAF SAYFA ve gerekçeleri:
      - giris    : oturum AÇMAK için var; yetki isteseydi kimse giriş yapamazdı.
      - yetkisiz : 403 metnini gösterir; yönetici yetkisi isteseydi sonsuz
                   yönlendirmeye girerdi. Kendi içinde oturum kontrolü YAPAR.
  */
  const AUTH_EXEMPT = ["app/admin/giris/page.tsx", "app/admin/yetkisiz/page.tsx"];

  it("panel sayfaları bulundu", () => {
    expect(adminPages.length).toBeGreaterThanOrEqual(9);
  });

  it("muaf olmayan her sayfa requireAdminPage() çağırır", () => {
    const offenders = adminPages
      .filter((file) => !AUTH_EXEMPT.includes(file))
      .filter((file) => !read(file).includes("requireAdminPage()"));

    expect(
      offenders,
      "Her panel sayfası kendi yetkisini doğrulamalıdır; layout güvenlik sınırı değildir.",
    ).toEqual([]);
  });

  it("muaf sayfalar da korumasız değildir", () => {
    // Giriş sayfası oturumluyu panele gönderir, yetkisiz sayfası oturum ister.
    expect(read("app/admin/yetkisiz/page.tsx")).toContain("getAuthUser()");
    expect(read("app/admin/yetkisiz/page.tsx")).toContain("getIsAdmin()");
  });

  it("HER panel sayfası noindex taşır", () => {
    const offenders = adminPages.filter((file) => !read(file).includes("ADMIN_ROBOTS"));

    expect(
      offenders,
      "Yönetici alanı arama motorlarınca indekslenmemeli (bilgi dosyası §17).",
    ).toEqual([]);
  });

  it("ADMIN_ROBOTS gerçekten index:false, follow:false", () => {
    const source = read("lib/admin/robots.ts");
    expect(source).toMatch(/index:\s*false/);
    expect(source).toMatch(/follow:\s*false/);
  });

  it("panel düzeni de noindex taşır", () => {
    expect(read("app/admin/layout.tsx")).toContain("ADMIN_ROBOTS");
  });

  it("panel sayfaları statik üretilmez", () => {
    /*
      Oturuma bağlı bir sayfanın statik üretilmesi, bir yöneticinin gördüğü
      HTML'in önbelleğe alınıp başkasına sunulması riskidir.
    */
    const offenders = adminPages.filter(
      (file) => !read(file).includes('dynamic = "force-dynamic"'),
    );

    expect(offenders, "Panel sayfaları force-dynamic olmalıdır.").toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. robots.txt panelin tamamını kapatır
// ---------------------------------------------------------------------------

describe("robots.txt", () => {
  const source = read("app/robots.ts");

  it("/admin taramaya kapalı", () => {
    expect(source).toContain('"/admin"');
    expect(source).toMatch(/disallow:/);
  });

  it("teşhis sayfası da kapalı", () => {
    expect(source).toContain('"/veri-kontrol"');
  });
});

// ---------------------------------------------------------------------------
// 3b. Teşhis sayfasının KENDİ meta'sı
// ---------------------------------------------------------------------------

/*
  `app/veri-kontrol` panel dizininin DIŞINDA olduğu için yukarıdaki dinamik
  `app/admin` taraması onu görmez — bir süre bekçisizdi ve tek kaynağı
  (`ADMIN_ROBOTS`) kullanmayı kaçırmıştı.

  robots.txt'teki `Disallow` tek başına YETMEZ: tarama engeli, başka bir
  siteden bağlantı verilen sayfanın indekslenmesini durdurmaz — bunu sayfanın
  kendi `noindex` meta'sı yapar (gerekçe: lib/admin/robots.ts).
*/
describe("teşhis sayfası indekslenmez", () => {
  const source = read("app/veri-kontrol/page.tsx");

  it("robots direktifi tek kaynaktan gelir", () => {
    expect(source).toContain("ADMIN_ROBOTS");
    expect(source).toContain("robots: ADMIN_ROBOTS");
  });

  it("kendi robots nesnesini elle yazmaz", () => {
    // Elle yazılan bir nesne tek kaynaktan sessizce ayrışabilir.
    expect(source).not.toMatch(/robots:\s*\{/);
  });

  it("statik üretilmez", () => {
    expect(source).toContain('export const dynamic = "force-dynamic"');
  });
});

// ---------------------------------------------------------------------------
// 4. Service role anahtarı ve gizli değerler
// ---------------------------------------------------------------------------

describe("service role anahtarı", () => {
  it("yalnız admin-client üzerinden okunur", () => {
    /*
      SUPABASE_SERVICE_ROLE_KEY'in kaynakta geçtiği TEK yer
      lib/supabase/admin-client.ts olmalıdır. Başka bir dosyada geçmesi,
      RLS'i atlayan bir yolun gözden kaçmış olması demektir.
    */
    const sourceFiles = ["app", "components", "lib"].flatMap((dir) =>
      collectFiles(dir, (name) => name.endsWith(".ts") || name.endsWith(".tsx")),
    );

    const users = sourceFiles.filter((file) =>
      read(file).includes("SUPABASE_SERVICE_ROLE_KEY"),
    );

    expect(users).toEqual(["lib/supabase/admin-client.ts"]);
  });

  it("service role istemcisi server-only", () => {
    expect(read("lib/supabase/admin-client.ts")).toContain('import "server-only"');
  });

  it("anahtar adı NEXT_PUBLIC_ öneki taşımaz", () => {
    // Öneki taşısaydı Next.js onu istemci paketine gömerdi.
    expect(read("lib/supabase/admin-client.ts")).not.toContain(
      "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
    );
  });

  it("panel yazmaları service role DEĞİL, kullanıcının oturumunu kullanır", () => {
    /*
      Panelin RLS'i atlaması, uygulamadaki tek bir hatanın tüm veriyi açması
      demekti. Aksiyonlar `getServerClient()` (anon + oturum) kullanır ve
      `is_admin()` politikası ikinci savunma hattı olarak yerinde kalır.
    */
    const actionFiles = collectFiles("lib/admin", (name) => name.endsWith("-actions.ts"));
    const offenders = actionFiles.filter((file) => read(file).includes("getAdminClient"));

    expect(offenders, "Panel aksiyonları service role istemcisi kullanmamalıdır.").toEqual([]);
  });
});

describe("gizli değerler kaynakta yok", () => {
  it("kaynakta JWT benzeri uzun anahtar dizisi yok", () => {
    const sourceFiles = ["app", "components", "lib"].flatMap((dir) =>
      collectFiles(dir, (name) => name.endsWith(".ts") || name.endsWith(".tsx")),
    );

    // Supabase anahtar biçimleri: eski `eyJ...` JWT ve yeni `sb_secret_...`.
    const SECRET_PATTERNS = [/eyJ[A-Za-z0-9_-]{20,}/, /sb_secret_[A-Za-z0-9_-]{10,}/];

    const offenders = sourceFiles.filter((file) => {
      const content = read(file);
      return SECRET_PATTERNS.some((pattern) => pattern.test(content));
    });

    expect(offenders, "Anahtarlar yalnız .env.local içinde bulunmalıdır.").toEqual([]);
  });
});
