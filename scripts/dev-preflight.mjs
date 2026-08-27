#!/usr/bin/env node
/*
  GELİŞTİRME ÖN KONTROLÜ — `npm run dev` öncesinde otomatik çalışır (`predev`).

  NEDEN VAR:

  Yerel Supabase, Docker içinde ayrı bir yığın olarak çalışır. Docker Desktop
  kapatıldığında (bilgisayar yeniden başlatıldığında, güncelleme sonrası, ya da
  elle) o yığın da durur. `next dev` bundan HABERSİZ ayağa kalkar ve site
  çalışıyormuş gibi görünür — ta ki bir sunucu bileşeni veri istemeye çalışana
  kadar. O noktada supabase-js'in altındaki `fetch` bağlantı kuramaz ve geriye
  yalnızca şu kalır:

      TypeError: fetch failed

  Bu mesaj NEDENİ söylemez. Belirti ise veri okuyan her yüzeyde ayrı ayrı,
  birbirinden bağımsızmış gibi görünür:

      [site-settings] bölüm yapılandırması okunamadı: TypeError: fetch failed
      "Ürünler şu anda listelenemiyor"        (app/(site)/urunler/page.tsx)
      "Bu bölüm şu anda yüklenemedi"          (lib/home/content.ts)

  Üçü de aynı tek nedenden gelir: `lib/supabase/public-client.ts`. Yığın elle
  yeniden başlatılınca hepsi birden düzelir, sonraki Docker kapanışında hepsi
  birden geri gelir. "Düzelttik, yine bozuldu" döngüsünün kaynağı budur.

  BU DOSYA O DÖNGÜYÜ KIRAR: dev sunucusu başlamadan ÖNCE yerel Supabase'in
  gerçekten cevap verdiğini doğrular, vermiyorsa önce kendisi ayağa kaldırmayı
  dener, kaldıramazsa ne yapılacağını açıkça yazıp DURUR. Böylece hata artık
  render sırasında anlamsız bir `fetch failed` olarak değil, başlangıçta
  okunabilir bir mesaj olarak görünür.

  KAPSAM: yalnız YEREL (loopback/özel ağ) Supabase adresleri. Uzak bir proje
  adresi yapılandırılmışsa bu betik hiçbir şeyi başlatmaya çalışmaz — uzak
  servisi yönetmek bizim işimiz değildir, yalnız uyarır ve yolu açar.

  Bağımlılık eklemez: yalnız Node çekirdeği ve zaten kurulu olan Docker/Supabase
  CLI'ları kullanılır.
*/

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Konsol süslemesi; TTY değilse (CI, log dosyası) düz metne düşer. */
const paint = (code, text) => (process.stdout.isTTY ? `[${code}m${text}[0m` : text);
const bold = (text) => paint("1", text);
const red = (text) => paint("31", text);
const yellow = (text) => paint("33", text);
const green = (text) => paint("32", text);

const label = bold("[ön kontrol]");
const info = (message) => console.log(`${label} ${message}`);
const warn = (message) => console.log(`${label} ${yellow(message)}`);

/**
 * `.env.local` içinden TEK bir anahtarı okur.
 *
 * `dotenv` kurmuyoruz: burada ihtiyacımız olan tek şey `NEXT_PUBLIC_SUPABASE_URL`
 * ve o bir sır değil (istemciye zaten gömülür). Anahtar/parola değerleri bu
 * betikte hiç okunmaz, yazdırılmaz, loglanmaz.
 */
function readEnvValue(key) {
  // Zaten ortamda tanımlıysa (kabuk export'u, CI) dosyaya hiç bakma.
  if (process.env[key]) return process.env[key];

  for (const file of [".env.local", ".env"]) {
    let contents;
    try {
      contents = readFileSync(resolve(projectRoot, file), "utf8");
    } catch {
      continue;
    }
    const match = contents.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, "m"));
    if (!match) continue;
    // Satır sonu yorumu ve tırnak temizliği — dotenv'in yaptığının azı.
    const value = match[1].trim().replace(/^["']|["']$/g, "");
    if (value) return value;
  }
  return "";
}

/** `lib/private-host.ts` ile aynı kural. Orası TypeScript olduğu için burada tekrarlanır. */
function isLocalHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host === "0.0.0.0") return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4) return false;
  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return false;

  const [a, b] = octets;
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

/** `supabase/config.toml` içindeki proje kimliği — kapsayıcı adlarının son eki. */
function readProjectId() {
  try {
    const contents = readFileSync(resolve(projectRoot, "supabase/config.toml"), "utf8");
    const match = contents.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function run(command, args, { timeout = 120_000 } = {}) {
  try {
    const stdout = execFileSync(command, args, { encoding: "utf8", stdio: "pipe", timeout });
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, stdout: error?.stdout ?? "", stderr: error?.stderr ?? String(error) };
  }
}

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * REST uç noktasına kısa zaman aşımlı bir istek atar.
 *
 * Kimlik doğrulaması YAPMAZ: anon anahtar olmadan 401 döner ve bu bizim için
 * yeterlidir — sorumuz "veri okunabiliyor mu" değil, "sunucu ayakta mı".
 * Anahtar okumamak, betiği sır dokunmayan bir kontrol olarak tutar.
 */
async function isReachable(baseUrl, timeoutMs = 3000) {
  try {
    const response = await fetch(new URL("/rest/v1/", baseUrl), {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    return response.status > 0;
  } catch {
    return false;
  }
}

async function waitUntilReachable(baseUrl, totalMs) {
  const deadline = Date.now() + totalMs;
  while (Date.now() < deadline) {
    if (await isReachable(baseUrl, 2000)) return true;
    await wait(2000);
  }
  return false;
}

/** Bu projeye ait kapsayıcı adları (çalışan + durmuş). */
function projectContainers(projectId) {
  const result = run("docker", [
    "ps",
    "-a",
    "--filter",
    // Baştan da bağlanır: yalnız `supabase_*` kapsayıcıları. Sondaki `$`
    // olmasaydı başka projeler de eşleşirdi (aynı makinede birden çok yerel
    // Supabase yığını olabiliyor).
    `name=^supabase_.*_${projectId}$`,
    "--format",
    "{{.Names}}\t{{.State}}",
  ]);
  if (!result.ok) return [];
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, state] = line.split("\t");
      return { name, state };
    });
}

/**
 * Durmuş kapsayıcıları yeniden başlatır.
 *
 * `supabase start` bu durumda İŞE YARAMAZ: veritabanı kapsayıcısı "exited"
 * durumdayken CLI "supabase start is already running" deyip çıkar ve geri kalan
 * servisleri ayağa kaldırmaz. Kapsayıcılar zaten var olduğu için `docker start`
 * doğru araçtır — ve `supabase stop && supabase start` turundan farklı olarak
 * veritabanı içeriğine hiç dokunmaz.
 *
 * Sıra önemlidir: önce veritabanı sağlıklı olmalı, diğer servisler ona bağlanır.
 * Bu bekleme, veritabanı kapsayıcısı ZATEN ÇALIŞIYOR görünse bile yapılır:
 * Docker Desktop yeni açıldığında kapsayıcı "running" ama sağlık durumu henüz
 * "starting" olabilir. Yalnız "durmuş olanlar" kümesine baksaydık bu durumda
 * beklemeyi atlar ve bağımlı servisleri hazır olmayan bir veritabanına
 * bağlamaya çalışırdık.
 */
async function waitForDatabaseHealth(database) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const probe = run("docker", ["inspect", "-f", "{{.State.Health.Status}}", database.name]);

    // Sağlık kontrolü TANIMSIZ olan bir kapsayıcıda `docker inspect` hata verir
    // ("map has no entry for key Health"). Beklenecek bir sağlık durumu yoksa
    // 90 saniyeyi boşa harcamayız; kapsayıcının ayakta olması yeterli sayılır.
    if (!probe.ok) return;

    const health = probe.stdout.trim();
    if (health === "healthy") return;
    if (health === "" || health === "<no value>") return;
    await wait(2000);
  }
  warn("veritabanı sağlık kontrolü zaman aşımına uğradı; yine de devam ediliyor");
}

async function restartStoppedContainers(containers) {
  const database = containers.find((container) => container.name.startsWith("supabase_db_"));
  const stopped = containers.filter((container) => container.state !== "running");

  if (database) {
    if (database.state !== "running") {
      info(`veritabanı kapsayıcısı başlatılıyor: ${database.name}`);
      run("docker", ["start", database.name]);
    }
    await waitForDatabaseHealth(database);
  }

  const rest = stopped.filter((container) => container !== database);
  if (rest.length > 0) {
    info(`durmuş servisler başlatılıyor (${rest.length})`);
    for (const container of rest) {
      run("docker", ["start", container.name]);
    }
  }
}

async function main() {
  const rawUrl = readEnvValue("NEXT_PUBLIC_SUPABASE_URL");

  // Supabase hiç yapılandırılmamış: bu DESTEKLENEN bir durumdur (bkz.
  // `lib/supabase/env.ts`). Site açılır, veri katmanı "not_configured" döner.
  if (!rawUrl) {
    warn("NEXT_PUBLIC_SUPABASE_URL boş — site katalog verisi olmadan açılacak.");
    warn("Kurulum: docs/supabase-setup.md");
    return;
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    warn(`NEXT_PUBLIC_SUPABASE_URL geçerli bir adres değil: ${rawUrl}`);
    return;
  }

  if (!isLocalHost(url.hostname)) {
    // Uzak proje: ayağa kaldırmak bizim işimiz değil, yalnız durumu bildiririz.
    if (!(await isReachable(url.origin, 5000))) {
      warn(`uzak Supabase (${url.hostname}) şu anda cevap vermiyor.`);
      warn("Dev sunucusu yine de başlatılacak; veri okuyan sayfalar hata gösterebilir.");
    }
    return;
  }

  if (await isReachable(url.origin)) {
    info(green(`yerel Supabase ayakta (${url.origin})`));
    return;
  }

  warn(`yerel Supabase cevap vermiyor: ${url.origin}`);

  /*
    "Docker KURULU DEĞİL" ile "Docker kurulu ama daemon kapalı" ayrı sorunlardır
    ve çözümleri de ayrıdır. İkisine de aynı "Docker Desktop'ı başlatın" mesajını
    vermek, kurulu olmayan makinede kullanıcıyı olmayan bir uygulamayı aramaya
    gönderir.
  */
  const dockerProbe = run("docker", ["info"], { timeout: 15_000 });
  if (!dockerProbe.ok) {
    const notInstalled = /ENOENT|not found/i.test(dockerProbe.stderr ?? "");
    console.error("");
    if (notInstalled) {
      console.error(red(bold("Docker kurulu değil — yerel Supabase yığını çalıştırılamaz.")));
      console.error("");
      console.error("  Docker Desktop kurun: https://docs.docker.com/desktop/");
    } else {
      console.error(red(bold("Docker çalışmıyor — yerel Supabase yığını da kapalı.")));
      console.error("");
      console.error("  Docker Desktop'ı başlatın, sonra tekrar deneyin:");
      console.error(bold("    open -a Docker && npm run dev"));
    }
    console.error("");
    console.error("  Veritabanı olmadan çalışmak isterseniz (site verisiz açılır):");
    console.error(bold("    SKIP_DEV_PREFLIGHT=1 npm run dev"));
    console.error("");
    process.exitCode = 1;
    return;
  }

  /*
    `config.toml` okunamazsa kapsayıcı adlarını türetemeyiz. Bu, "yığın hiç
    kurulmamış" ile AYNI ŞEY DEĞİLDİR — o varsayımla `supabase start`
    çalıştırmak, 600 saniyelik bir zaman aşımını yanlış teşhis uğruna riske
    atmak olurdu. Durumu olduğu gibi söyleyip çıkıyoruz.
  */
  const projectId = readProjectId();
  if (!projectId) {
    console.error("");
    console.error(red(bold("supabase/config.toml okunamadı veya `project_id` bulunamadı.")));
    console.error("");
    console.error("  Yığını elle başlatın:");
    console.error(bold("    npm run db:start"));
    console.error("");
    process.exitCode = 1;
    return;
  }

  const containers = projectContainers(projectId);

  if (containers.length > 0) {
    await restartStoppedContainers(containers);
  } else {
    // Yığın hiç kurulmamış: burada `supabase start` DOĞRU araçtır (kapsayıcı
    // yok, `docker start` edilecek bir şey de yok). CLI yoksa 600 saniye
    // beklemek yerine hemen söyleriz.
    if (!run("supabase", ["--version"], { timeout: 15_000 }).ok) {
      console.error("");
      console.error(red(bold("Supabase CLI bulunamadı — yığın ilk kez kurulamıyor.")));
      console.error("");
      console.error("  Kurulum:");
      console.error(bold("    brew install supabase/tap/supabase"));
      console.error("  Ayrıntı: docs/supabase-setup.md");
      console.error("");
      process.exitCode = 1;
      return;
    }
    info("Supabase yığını hiç kurulmamış — `supabase start` çalıştırılıyor (ilk sefer uzun sürer)");
    run("supabase", ["start"], { timeout: 600_000 });
  }

  if (await waitUntilReachable(url.origin, 90_000)) {
    info(green(`yerel Supabase ayağa kalktı (${url.origin})`));
    return;
  }

  console.error("");
  console.error(red(bold("Yerel Supabase ayağa kaldırılamadı.")));
  console.error("");
  console.error("  Elle deneyin:");
  console.error(bold("    npm run db:stop && npm run db:start"));
  console.error("");
  console.error("  Sorun sürerse kapsayıcı günlüklerine bakın:");
  console.error(bold(`    docker logs supabase_db_${projectId ?? "<proje>"}`));
  console.error("");
  process.exitCode = 1;
}

/*
  Kaçış kapısı: veritabanı olmadan yalnız arayüz üzerinde çalışmak istendiğinde
  kontrol tamamen atlanır.

  Bayrak değil ORTAM DEĞİŞKENİ kullanılır: npm, `npm run dev -- <bayrak>` ile
  verilen argümanları `predev` betiğine GEÇİRMEZ, yalnız `dev` betiğine ekler.
  Bir bayrak burada hiçbir zaman görünmezdi.
*/
if (process.env.SKIP_DEV_PREFLIGHT === "1") {
  info("atlandı (SKIP_DEV_PREFLIGHT=1)");
} else {
  await main();
}
