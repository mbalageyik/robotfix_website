import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getPublicSupabaseConfig } from "@/lib/supabase/env";

/*
  Genel (anon) Supabase istemcisi.

  Çerez OKUMAZ ve oturum tutmaz. Bu bilinçlidir: çerez okuyan bir istemci
  Next.js rotasını dinamiğe çevirir ve katalog sayfaları statik üretilemez.
  Anonim okuma zaten RLS ile sınırlıdır — oturuma ihtiyaç yoktur.

  Faz 3'te yönetim paneli için AYRI bir çerez farkındalıklı istemci eklenecek;
  bu dosya değişmeyecek.
*/

let cached: SupabaseClient<Database> | null = null;

/** Süreç ömrü boyunca yeniden kullanılan anon istemci. */
export function getPublicClient(): SupabaseClient<Database> {
  if (cached) return cached;

  const { url, anonKey } = getPublicSupabaseConfig();

  cached = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { "x-application-name": "robot-fix-web" },
    },
  });

  return cached;
}
