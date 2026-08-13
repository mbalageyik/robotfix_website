import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/*
  ============================================================================
  PROXY — Next.js 16'da `middleware.ts`'in yeni adı. Davranış aynıdır.
  ============================================================================

  İKİ İŞİ VAR, ÜÇÜNCÜSÜ YOK:

  1. Oturum çerezini TAZELER. Supabase erişim token'ı kısa ömürlüdür; sunucu
     bileşenleri çerez yazamadığı için tazeleme burada yapılır ve yanıta yazılır.

  2. İYİMSER ön eleme. Oturum çerezi hiç yoksa `/admin/*` istekleri giriş
     sayfasına yönlendirilir. Bu bir UX/prefetch optimizasyonudur.

  3. YETKİLENDİRME YAPMAZ. Next.js dokümanı proxy'nin "tam oturum yönetimi veya
     yetkilendirme çözümü" olarak kullanılmamasını açıkça söyler: proxy her
     rotada, prefetch edilenler dâhil çalışır; buraya veritabanı sorgusu koymak
     hem yavaşlatır hem de tek savunma hattı yanılsaması yaratır.

     Gerçek kontrol `lib/auth/dal.ts` içinde, her sayfa ve her aksiyonda yapılır.
     Veritabanı hattı ise RLS'tir. Bu dosya SİLİNSE bile panel güvenli kalmalıdır
     — testler bunu ayrıca doğrular.
*/

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Supabase yapılandırılmamışsa proxy hiçbir şey yapmaz; sayfa katmanı
  // "yapılandırılmadı" durumunu zaten anlamlı biçimde gösterir.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  /*
    Token'ı tazeler ve `setAll` üzerinden yanıt çerezlerini günceller.
    Dönen kullanıcı burada YALNIZ "oturum var mı" sorusu için kullanılır;
    yönetici olup olmadığına bakılmaz (o, DAL'ın işi).
  */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Giriş sayfası ve yetkisiz sayfası korumanın dışında — aksi hâlde
  // oturumsuz kullanıcı sonsuz yönlendirmeye girerdi.
  const isPublicAdminRoute =
    pathname === "/admin/giris" || pathname.startsWith("/admin/giris/");

  if (pathname.startsWith("/admin") && !isPublicAdminRoute && !user) {
    const loginUrl = new URL("/admin/giris", request.url);
    // Girişten sonra kullanıcıyı istediği sayfaya geri götürebilmek için.
    loginUrl.searchParams.set("devam", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Oturumu açık kullanıcı giriş sayfasına giderse panele al.
  if (isPublicAdminRoute && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  /*
    Yalnız `/admin` altında çalışır. Katalog sayfalarında çalışsaydı her istekte
    Auth sunucusuna gidip statik üretimi bozardı.
  */
  matcher: ["/admin/:path*"],
};
