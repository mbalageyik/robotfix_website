import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getPublicSupabaseConfig } from "@/lib/supabase/env";

/*
  ÇEREZ FARKINDALIKLI sunucu istemcisi — oturumu olan istekler için.

  `lib/supabase/public-client.ts` ile FARKI önemlidir:
    - public-client: çerez okumaz, oturum tutmaz, katalog sayfaları statik
      kalabilsin diye. Anonim okuma için.
    - bu dosya: çerezden oturumu okur, dolayısıyla rotayı dinamiğe çevirir.
      YALNIZ yönetim paneli ve kimlik doğrulama akışları için.

  ANAHTAR: burada da **anon** anahtarı kullanılır, service role DEĞİL. Yönetici
  yazma işlemleri kullanıcının kendi oturumuyla ve RLS ALTINDA yapılır — böylece
  `is_admin()` politikası ikinci savunma hattı olarak çalışmaya devam eder.
  Service role yalnız RLS'in aşılması ZORUNLU olduğu yerde kullanılır
  (bkz. lib/supabase/admin-client.ts ve kullanım listesi docs/design-decisions.md).
*/

/**
 * İstek kapsamlı Supabase istemcisi. `cookies()` okuduğu için çağıran rota
 * dinamik hâle gelir.
 */
export async function getServerClient(): Promise<SupabaseClient<Database>> {
  const { url, anonKey } = getPublicSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        /*
          Sunucu bileşenlerinden çerez yazmak Next.js'te hatadır; yalnız Server
          Action ve Route Handler bağlamında mümkündür. Supabase token yenilerken
          buraya yazmayı dener.

          Yutmak GÜVENLİDİR çünkü oturum tazeleme `proxy.ts` içinde yapılır ve
          yanıt çerezleri orada yazılır. Burada yutulmasaydı her sunucu bileşeni
          render'ı çökerdi.
        */
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Sunucu bileşeni bağlamı — proxy.ts tazelemeyi üstlenir.
        }
      },
    },
  });
}
