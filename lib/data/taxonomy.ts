import { getPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured, showDemoContent } from "@/lib/supabase/env";
import { fail, ok, type DataResult } from "@/lib/data/result";
import type { BrandRow, CategoryRow, DeviceModelRow, ServiceRow } from "@/lib/data/types";

/*
  Marka, kategori, cihaz modeli ve hizmet sorguları.

  Ürün sorgularında olduğu gibi burada da `status` filtresi YAZILMAZ —
  görünürlük RLS'in işidir.
*/

// --- Markalar -------------------------------------------------------------

export async function listBrands(): Promise<DataResult<BrandRow[]>> {
  if (!isSupabaseConfigured) return fail("not_configured", "Supabase yapılandırılmamış.");

  let query = getPublicClient()
    .from("brands")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (!showDemoContent) query = query.eq("is_demo", false);

  const { data, error } = await query;

  if (error) return fail("query_failed", error.message, error.code);
  return ok(data);
}

export async function getBrandBySlug(slug: string): Promise<DataResult<BrandRow>> {
  if (!isSupabaseConfigured) return fail("not_configured", "Supabase yapılandırılmamış.");

  const { data, error } = await getPublicClient()
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return fail("query_failed", error.message, error.code);
  if (!data) return fail("not_found", `Marka bulunamadı: ${slug}`);
  return ok(data);
}

// --- Kategoriler ----------------------------------------------------------

export async function listCategories(): Promise<DataResult<CategoryRow[]>> {
  if (!isSupabaseConfigured) return fail("not_configured", "Supabase yapılandırılmamış.");

  let query = getPublicClient()
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (!showDemoContent) query = query.eq("is_demo", false);

  const { data, error } = await query;

  if (error) return fail("query_failed", error.message, error.code);
  return ok(data);
}

export async function getCategoryBySlug(slug: string): Promise<DataResult<CategoryRow>> {
  if (!isSupabaseConfigured) return fail("not_configured", "Supabase yapılandırılmamış.");

  const { data, error } = await getPublicClient()
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return fail("query_failed", error.message, error.code);
  if (!data) return fail("not_found", `Kategori bulunamadı: ${slug}`);
  return ok(data);
}

// --- Cihaz modelleri ------------------------------------------------------

/** Uyumluluk filtresi için model listesi; markaya göre daraltılabilir. */
export async function listDeviceModels(brandSlug?: string): Promise<DataResult<DeviceModelRow[]>> {
  if (!isSupabaseConfigured) return fail("not_configured", "Supabase yapılandırılmamış.");

  let query = getPublicClient()
    .from("device_models")
    .select("*, brand:brands!inner ( slug )")
    .order("name", { ascending: true });

  if (brandSlug) query = query.eq("brands.slug", brandSlug);
  if (!showDemoContent) query = query.eq("is_demo", false);

  const { data, error } = await query;

  if (error) return fail("query_failed", error.message, error.code);
  return ok(data);
}

// --- Hizmetler ------------------------------------------------------------

export async function listServices(): Promise<DataResult<ServiceRow[]>> {
  if (!isSupabaseConfigured) return fail("not_configured", "Supabase yapılandırılmamış.");

  let query = getPublicClient()
    .from("services")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (!showDemoContent) query = query.eq("is_demo", false);

  const { data, error } = await query;

  if (error) return fail("query_failed", error.message, error.code);
  return ok(data);
}

export async function getServiceBySlug(slug: string): Promise<DataResult<ServiceRow>> {
  if (!isSupabaseConfigured) return fail("not_configured", "Supabase yapılandırılmamış.");

  const { data, error } = await getPublicClient()
    .from("services")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return fail("query_failed", error.message, error.code);
  if (!data) return fail("not_found", `Hizmet bulunamadı: ${slug}`);
  return ok(data);
}
