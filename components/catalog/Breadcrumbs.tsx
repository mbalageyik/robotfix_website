import Link from "next/link";

/*
  Kırıntı navigasyonu.

  Son öğe bağlantı DEĞİLDİR (bulunduğunuz sayfa) ve `aria-current="page"`
  taşır. Ayırıcı `aria-hidden`: ekran okuyucu "büyüktür" diye okumaz.
*/

export interface Crumb {
  label: string;
  /** Son (mevcut) öğede bulunmaz. */
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Sayfa yolu">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-link hover:text-link-hover hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="text-text">
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
