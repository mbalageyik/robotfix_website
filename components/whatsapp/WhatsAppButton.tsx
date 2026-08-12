import { ButtonLink, type ButtonSize } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getSiteConfig } from "@/lib/site-config";
import {
  buildProductMessage,
  buildServiceMessage,
  buildWhatsAppUrl,
  type ProductMessageInput,
  type ServiceMessageInput,
} from "@/lib/whatsapp";

/*
  WhatsApp CTA'sı — sunucu bileşeni, istemci JS yok.

  Bilgi dosyası §15: buton metninde eylem AÇIKÇA yazar; yalnız renge veya
  simgeye güvenilmez. Bu yüzden `label` zorunludur.

  Numara yapılandırılmamışsa buton HİÇ render edilmez — bozuk bir wa.me
  bağlantısı göstermektense göstermemek doğrudur.

  `data-event` analitik entegrasyon noktasıdır; bu fazda bir sağlayıcı
  bağlanmaz (Faz 7).
*/

interface BaseProps {
  /** Eylemi açıkça bildiren metin. */
  label: string;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Analitik olay adı (bkz. bilgi dosyası §19). */
  event?: string;
  className?: string;
}

type WhatsAppButtonProps = BaseProps &
  (
    | { intent: "product"; product: ProductMessageInput; service?: never }
    | { intent: "service"; service?: ServiceMessageInput; product?: never }
  );

export async function WhatsAppButton({
  label,
  size = "md",
  fullWidth,
  event,
  className,
  ...rest
}: WhatsAppButtonProps) {
  // Numara önce site_settings'ten, yoksa env'den gelir. Prop sözleşmesi değişmedi.
  const { whatsappPhone } = await getSiteConfig();
  if (!whatsappPhone) return null;

  const message =
    rest.intent === "product"
      ? buildProductMessage(rest.product)
      : buildServiceMessage(rest.service ?? {});

  const href = buildWhatsAppUrl({ phone: whatsappPhone, message });

  return (
    <ButtonLink
      href={href}
      variant="whatsapp"
      size={size}
      fullWidth={fullWidth}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      data-event={event ?? `whatsapp_${rest.intent}_click`}
    >
      <WhatsAppIcon className={size === "sm" ? "size-4" : "size-5"} />
      {label}
      <span className="sr-only">(WhatsApp&rsquo;ta yeni sekmede açılır)</span>
    </ButtonLink>
  );
}
