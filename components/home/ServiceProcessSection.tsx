import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { SERVICE_PROCESS } from "@/lib/home/content";
import { whatsappCtaLabels } from "@/lib/site-config";

/*
  Servis süreci — TASLAK (bilgi dosyası §10).

  §10'daki dört adım eski siteden alınmıştır ve "operasyonel doğruluğu
  yayımdan önce teyit edilmelidir". Bu yüzden buradaki anlatım marka-bağımsız
  ve TAAHHÜTSÜZDÜR: süre, ücret, kargo yöntemi veya adrese teslim gibi
  doğrulanmamış hiçbir ayrıntı geçmez (metin `lib/home/content.ts`).

  Koyu yüzey burada bilinçlidir: bilgi dosyası §15 koyu yüzeyi MARKA
  ANLATIMI için ayırır; süreç anlatımı bir karar/katalog alanı değildir.

  Adımlar `<ol>` ile numaralandırılır — sıra bilgisi yalnız görsel bir
  rakamla değil, işaretlemede de vardır.
*/

export function ServiceProcessSection() {
  return (
    <Section id="surec" labelledBy="surec-baslik" surface="dark" width="wide">
      <SectionHeading
        id="surec-baslik"
        overline={SERVICE_PROCESS.overline}
        title={SERVICE_PROCESS.title}
      />

      <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICE_PROCESS.steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-2 border-t border-border pt-5">
            <span
              aria-hidden="true"
              className="font-mono text-caption font-semibold text-accent-tech"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-h4">{step.title}</h3>
            <p className="text-body text-text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-8 max-w-2xl text-caption text-text-muted">{SERVICE_PROCESS.note}</p>

      <div className="mt-8">
        <WhatsAppButton
          intent="service"
          label={whatsappCtaLabels.service}
          size="lg"
          event="whatsapp_process_click"
        />
      </div>
    </Section>
  );
}
