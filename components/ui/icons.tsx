import type { ReactElement, SVGProps } from "react";

/*
  Robot Fix simge seti — el yazımı SVG, harici ikon paketi yok.
  Ortak dilbilgisi: 24 birim kutu, 1.75 kalınlık, yuvarlak uç ve köşe,
  currentColor. Simgeler tek başına anlam taşımaz; her zaman metinle birlikte
  kullanılır (bilgi dosyası §15: "Renk hiçbir bilgi veya durumun tek göstergesi
  olmamalıdır" — simge de tek gösterge değildir).
*/

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Stokta / başarı. */
export function CheckCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </Icon>
  );
}

/** Sınırlı stok / uyarı. */
export function AlertTriangleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4.5 21 19.5H3L12 4.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

/** Siparişle / bekleyen durum. */
export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" />
    </Icon>
  );
}

/** Tükendi / kapalı. */
export function SlashCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m6.2 17.8 11.6-11.6" />
    </Icon>
  );
}

/** Hata / kritik. */
export function AlertCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16h.01" />
    </Icon>
  );
}

/** Bilgi. */
export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 8h.01" />
    </Icon>
  );
}

/** Boş sonuç. */
export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4" />
    </Icon>
  );
}

/*
  Menü aç / kapat — dar ekran gezinme açıcısında.

  İkisi de tek başına anlam taşımaz: açıcının erişilebilir adı yanındaki
  metindir ("Menü"), simge yalnız onun görsel karşılığıdır.
*/
export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Icon>
  );
}

/** Harici bağlantı — pazaryeri butonlarında yeni sekme işareti. */
export function ExternalLinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 5h5v5" />
      <path d="M19 5l-7.5 7.5" />
      <path d="M18 13.5V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V7.5A1.5 1.5 0 0 1 6 6h4.5" />
    </Icon>
  );
}

/** WhatsApp — dolu (marka simgesi), kontur değil. */
export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06s.89 2.39 1.01 2.56c.12.16 1.74 2.66 4.22 3.73.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

/** Yükleniyor — dönen halka. */
export function SpinnerIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="9" opacity="0.28" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// İletişim ve yön simgeleri
// ---------------------------------------------------------------------------

/** Adres / konum. */
export function MapPinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s6.5-5.4 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.6" r="2.4" />
    </Icon>
  );
}

/** Telefon. */
export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.2 4.5H5.6A1.6 1.6 0 0 0 4 6.2c0 7.6 6.2 13.8 13.8 13.8a1.6 1.6 0 0 0 1.7-1.6v-2.6l-3.6-1.3-1.7 1.9a12.4 12.4 0 0 1-4.6-4.6l1.9-1.7Z" />
    </Icon>
  );
}

/** İleri yönlendirme — kategori ve bölüm bağlantılarında. */
export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </Icon>
  );
}

// ---------------------------------------------------------------------------
// Hizmet simgeleri — `services.icon_key` sütununun karşılıkları
// ---------------------------------------------------------------------------
/*
  `icon_key` serbest metindir ama ARAYÜZDE serbest değildir: yalnız aşağıdaki
  sözlükte karşılığı olan anahtarlar simge üretir. Tanınmayan anahtar sessizce
  simgesiz render edilir — kart yine ad ve açıklamayla anlamlıdır (simge tek
  gösterge değildir, bilgi dosyası §15).
*/

/** Batarya kontrolü ve değişimi. */
export function BatteryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="7.5" width="15" height="9" rx="2" />
      <path d="M21 10.5v3" />
      <path d="M6.5 10.5v3" />
      <path d="M10 10.5v3" />
    </Icon>
  );
}

/** Motor, fan ve emiş sistemi. */
export function FanIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10c0-3 .8-5.5 2.6-5.5 1.5 0 2.2 1.6 1.4 3.1C15.2 9.2 13.6 10 12 10Z" />
      <path d="M14 12c3 0 5.5.8 5.5 2.6 0 1.5-1.6 2.2-3.1 1.4C14.8 15.2 14 13.6 14 12Z" />
      <path d="M10 12c-3 0-5.5-.8-5.5-2.6 0-1.5 1.6-2.2 3.1-1.4C9.2 8.8 10 10.4 10 12Z" />
      <path d="M12 14c0 3-.8 5.5-2.6 5.5-1.5 0-2.2-1.6-1.4-3.1C8.8 14.8 10.4 14 12 14Z" />
    </Icon>
  );
}

/** Fırça, tekerlek ve mekanik. */
export function BrushIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4.5" width="16" height="6" rx="2" />
      <path d="M7 10.5v3.5" />
      <path d="M10.3 10.5v5" />
      <path d="M13.7 10.5v5" />
      <path d="M17 10.5v3.5" />
    </Icon>
  );
}

/** Sensör ve navigasyon. */
export function SensorIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 15.5a5 5 0 0 1 0-7" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M6 18a9 9 0 0 1 0-12" />
      <path d="M18 6a9 9 0 0 1 0 12" />
    </Icon>
  );
}

/** Şarj istasyonu ve kart. */
export function ChargingIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 3.5 6.5 13H12l-1 7.5L17.5 11H12l1-7.5Z" />
    </Icon>
  );
}

/** Arıza tespiti. */
export function DiagnoseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 4.5 4.5" />
      <path d="M10.5 7.8v5.4" />
      <path d="M7.8 10.5h5.4" />
    </Icon>
  );
}

/** Periyodik bakım ve temizlik — anahtar/servis. */
export function WrenchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15.6 4.4a4.6 4.6 0 0 0-5.9 5.6l-5.1 5.1a1.7 1.7 0 0 0 0 2.4l1.9 1.9a1.7 1.7 0 0 0 2.4 0l5.1-5.1a4.6 4.6 0 0 0 5.6-5.9l-2.7 2.7-2.5-.6-.6-2.5 2.7-2.7Z" />
    </Icon>
  );
}

/** Yedek parça satışı. */
export function PartsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3.5 7.5 4v9L12 20.5 4.5 16.5v-9L12 3.5Z" />
      <path d="M4.5 7.5 12 11.5l7.5-4" />
      <path d="M12 11.5v9" />
    </Icon>
  );
}

/*
  Katalog görünüm değiştirici simgeleri (liste / 2 sütun / 4 sütun).

  Üçü de aynı 24 birimlik kutuyu doldurur ki düğme sırasında optik ağırlıkları
  eşit olsun. Simge tek gösterge DEĞİLDİR: düğmelerde `aria-label` her zaman
  vardır, geniş ekranda ayrıca metin etiketi de görünür.
*/

/** Liste görünümü — satır satır. */
export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h16" />
      <path d="M4 12h16" />
      <path d="M4 17.5h16" />
    </Icon>
  );
}

/** İki sütunlu ızgara. */
export function GridTwoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4.5" width="6.5" height="15" rx="1.25" />
      <rect x="13.5" y="4.5" width="6.5" height="15" rx="1.25" />
    </Icon>
  );
}

/** Dört sütunlu ızgara — iki satır, iki sütun olarak çizilir. */
export function GridFourIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4.5" width="6.5" height="6.5" rx="1.25" />
      <rect x="13.5" y="4.5" width="6.5" height="6.5" rx="1.25" />
      <rect x="4" y="13" width="6.5" height="6.5" rx="1.25" />
      <rect x="13.5" y="13" width="6.5" height="6.5" rx="1.25" />
    </Icon>
  );
}

/** `services.icon_key` → simge bileşeni. Tanınmayan anahtar `null` döner. */
const SERVICE_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  battery: BatteryIcon,
  motor: FanIcon,
  brush: BrushIcon,
  sensor: SensorIcon,
  charging: ChargingIcon,
  diagnose: DiagnoseIcon,
  service: WrenchIcon,
  parts: PartsIcon,
};

export function getServiceIcon(
  iconKey: string | null | undefined,
): ((props: IconProps) => ReactElement) | null {
  if (!iconKey) return null;
  return SERVICE_ICONS[iconKey.trim().toLowerCase()] ?? null;
}
