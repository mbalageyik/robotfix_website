import { Client, type QueryResult, type QueryResultRow } from "pg";

/*
  Yerel Supabase Postgres'ine bağlanan test yardımcısı.

  Bağlantı dizesi YEREL geliştirme varsayılanıdır (supabase/config.toml'daki
  port). Sır değildir; üretim kimlik bilgisi buraya yazılmaz.
*/
export const LOCAL_DB_URL =
  process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54342/postgres";

export async function connect(): Promise<Client> {
  const client = new Client({ connectionString: LOCAL_DB_URL });
  await client.connect();
  return client;
}

/**
 * Test gövdesini bir işlemde çalıştırır ve DAİMA geri alır.
 * Testler birbirinin verisini bozmaz; `supabase db reset` gerekmez.
 */
export async function inRollback<T>(
  client: Client,
  body: (client: Client) => Promise<T>,
): Promise<T> {
  await client.query("begin");
  try {
    return await body(client);
  } finally {
    await client.query("rollback");
  }
}

/*
  Rol değişimi `set local` kullanır ve YALNIZ bir işlem içinde etkilidir.
  İşlem dışında sessizce hiçbir şey yapmaz — o durumda sorgu `postgres`
  rolüyle çalışır ve RLS atlanır, yani test YANLIŞ NEDENLE geçer.
  Bunu önlemek için rol yardımcıları işlem içinde olduklarını doğrular.
*/
async function assertRole(client: Client, expected: string): Promise<void> {
  const { rows } = await client.query<{ current_user: string }>("select current_user");
  if (rows[0].current_user !== expected) {
    throw new Error(
      `Rol değişmedi: '${expected}' beklendi, '${rows[0].current_user}' bulundu. ` +
        `\`set local\` yalnız işlem içinde çalışır — sorguyu inRollback() içine alın. ` +
        `Aksi hâlde test RLS atlanarak yanlış nedenle geçer.`,
    );
  }
}

/**
 * Rolü geri almayı DENER ama orijinal hatayı asla maskelemez.
 * Sorgu başarısız olduğunda işlem iptal durumuna geçer ve sonraki her sorgu
 * "current transaction is aborted" verir; bu hata gerçek RLS hatasını gizlerdi.
 */
async function resetRoleQuietly(client: Client): Promise<void> {
  try {
    await client.query("set local role postgres");
  } catch {
    // İşlem zaten iptal; çağıran taraf rollback yapacak.
  }
}

/** Sorguyu anonim rolle çalıştırır (Supabase'in `anon` rolü). */
export async function asAnon<R extends QueryResultRow = QueryResultRow>(
  client: Client,
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<R>> {
  await client.query("set local role anon");
  await assertRole(client, "anon");
  try {
    return await client.query<R>(sql, params);
  } finally {
    await resetRoleQuietly(client);
  }
}

/**
 * Sorguyu `authenticated` rolüyle ve verilen kullanıcı kimliğiyle çalıştırır.
 * `auth.uid()` bu JWT talebinden okunur.
 */
export async function asAuthenticated<R extends QueryResultRow = QueryResultRow>(
  client: Client,
  userId: string,
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<R>> {
  // `SET` bind parametresi kabul etmez; `set_config(..., true)` işlem kapsamlıdır.
  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: userId, role: "authenticated" }),
  ]);
  await client.query("set local role authenticated");
  await assertRole(client, "authenticated");
  try {
    return await client.query<R>(sql, params);
  } finally {
    await resetRoleQuietly(client);
  }
}

/** Yönetici bir kullanıcı oluşturur ve id'sini döner (işlem içinde, geri alınır). */
export async function createAdminUser(client: Client): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
       email_confirmed_at, created_at, updated_at)
     values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
       'authenticated', 'admin-test@example.com', '', now(), now(), now())
     returning id`,
  );
  const id = rows[0].id;
  await client.query("insert into public.admin_users (user_id, email) values ($1, $2)", [
    id,
    "admin-test@example.com",
  ]);
  return id;
}

/** Yönetici OLMAYAN bir kullanıcı oluşturur. */
export async function createPlainUser(client: Client): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
       email_confirmed_at, created_at, updated_at)
     values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
       'authenticated', 'plain-test@example.com', '', now(), now(), now())
     returning id`,
  );
  return rows[0].id;
}
