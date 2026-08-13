"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/*
  Panel gezinmesi. İstemci bileşeni olmasının tek sebebi `usePathname` ile
  aktif bağlantıyı işaretlemek.

  Aktif durum YALNIZ renkle anlatılmaz: `aria-current="page"` ve kalın ağırlık
  da vardır (bilgi dosyası §15).
*/

interface AdminLink {
  href: string;
  label: string;
  /** Yalnız tam eşleşmede aktif sayılır (kök "/admin" her yolun ön ekidir). */
  exact?: boolean;
}

const LINKS: readonly AdminLink[] = [
  { href: "/admin", label: "Panel", exact: true },
  { href: "/admin/urunler", label: "Ürünler" },
  { href: "/admin/markalar", label: "Markalar" },
  { href: "/admin/kategoriler", label: "Kategoriler" },
  { href: "/admin/cihaz-modelleri", label: "Cihaz Modelleri" },
  { href: "/admin/hizmetler", label: "Hizmetler" },
  { href: "/admin/site-ayarlari", label: "Site Ayarları" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Yönetim paneli" className="flex flex-wrap gap-1">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-caption transition-colors",
              "duration-(--duration-fast) ease-(--ease-standard)",
              active
                ? "bg-surface-raised font-bold text-text"
                : "font-medium text-text-muted hover:bg-surface-raised hover:text-text",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
