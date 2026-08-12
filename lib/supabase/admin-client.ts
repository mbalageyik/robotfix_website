import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/*
  ============================================================================
  SERVICE ROLE İSTEMCİSİ — RLS'İ ATLAR.
  ============================================================================

  `import "server-only"` bu modülün bir istemci bileşeninden import edilmesini
  DERLEME ZAMANINDA hata hâline getirir. Anahtarın tarayıcıya sızması için
  önce build'in kırılması gerekir.

  İkinci savunma hattı: anahtar adı `NEXT_PUBLIC_` öneki TAŞIMAZ, bu yüzden
  Next.js onu istemci paketine gömmez.

  Üçüncü savunma hattı: aşağıdaki çalışma zamanı kontrolü.

  Bu istemci Faz 3'te yalnız şu işler için kullanılacaktır: yönetim paneli
  yazma işlemleri ve tohumlama. Genel okuma DAİMA anon istemcisiyle yapılır —
  aksi hâlde RLS'in koruması devre dışı kalır.
*/

/** Service role anahtarı eksikse veya yanlış bağlamda çağrıldıysa atılır. */
export class ServiceRoleUnavailableError extends Error {
  constructor(reason: string) {
    super(`Service role istemcisi kullanılamıyor: ${reason}`);
    this.name = "ServiceRoleUnavailableError";
  }
}

let cached: SupabaseClient<Database> | null = null;

/**
 * Yönetici (service role) istemcisi. YALNIZ sunucu bağlamında çağrılabilir.
 *
 * @throws {ServiceRoleUnavailableError} tarayıcıda çağrılırsa veya
 *   `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_URL` tanımsızsa.
 */
export function getAdminClient(): SupabaseClient<Database> {
  // Çalışma zamanı kontrolü: `server-only` bir şekilde atlanırsa burada durur.
  if (typeof window !== "undefined") {
    throw new ServiceRoleUnavailableError("tarayıcı bağlamında çağrıldı");
  }

  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url) throw new ServiceRoleUnavailableError("NEXT_PUBLIC_SUPABASE_URL tanımsız");
  if (!serviceRoleKey) {
    throw new ServiceRoleUnavailableError("SUPABASE_SERVICE_ROLE_KEY tanımsız");
  }

  cached = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
