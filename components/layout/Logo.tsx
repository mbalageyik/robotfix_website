import { cn } from "@/lib/cn";

/*
  ============================================================================
  GEÇİCİ LOGO — yer tutucudur, marka kimliği çalışması değildir.
  ============================================================================

  Gerçek bir logo tasarlanana kadar sitenin bir işareti olsun diye yazıldı.
  Değiştirileceği üç yerde bellidir: bu not, `data-placeholder` özniteliği ve
  `docs/varlik-lisanslari.md` kaydı.

  İKİ PARÇA, İKİ FARKLI GEREKÇE:

  1. SEMBOL bir SVG'dir — üstten görünen bir robot süpürge: gövde dairesi,
     ön tampon yayı ve lidar kulesi noktası. `currentColor` kullanır, yani
     koyu/açık yüzeyde ayrı dosya gerekmez.

  2. KELİME İŞARETİ GERÇEK METİNDİR, görsel değil. Bunun üç sebebi var:
     ekran okuyucu adı doğrudan okur, arama motoru metni görür ve
     CLAUDE.md'nin "marka adı her zaman iki kelimedir" kuralı görsele
     gömülmüş bir yazımla dolanılamaz. Bitişik yazım yalnız bir logo
     ÇİZİMİNİN içinde serbesttir; burada çizim yok, metin var — bu yüzden
     ad iki kelime olarak yazılır.

  `aria-hidden` sembolde: adı kelime işareti zaten söylüyor, ekran okuyucunun
  aynı adı iki kez duyurmasına gerek yok.
*/

export interface LogoProps {
  /** Kelime işareti gizlenip yalnız sembol gösterilsin mi (dar alanlar). */
  symbolOnly?: boolean;
  className?: string;
}

export function Logo({ symbolOnly = false, className }: LogoProps) {
  return (
    <span
      data-placeholder="gecici-logo"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
        className="size-8 shrink-0 text-accent-tech"
      >
        {/* Gövde — üstten görünen robot süpürge. */}
        <circle cx="16" cy="16" r="12.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
        {/*
          Ön tampon — gövdenin üst yayında daha kalın bir şerit. Cihazın
          "önü" olduğunu gösteren tek işaret bu; simetrik bir daire robot
          süpürge değil sadece daire olurdu.
        */}
        <path
          d="M6.6 10.4a11 11 0 0 1 18.8 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* Lidar kulesi. */}
        <circle cx="16" cy="16" r="3.2" fill="currentColor" />
      </svg>

      <span
        className={cn(
          "font-display text-h4 leading-none font-bold tracking-tight text-text",
          // `sr-only`: sembol tek başına dururken bile ad okunur kalır.
          symbolOnly && "sr-only",
        )}
      >
        Robot Fix
      </span>
    </span>
  );
}
