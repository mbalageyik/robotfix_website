import { Card } from "@/components/ui/Card";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { VALUE_PROPOSITION } from "@/lib/home/content";

/*
  Değer önerisi (bilgi dosyası §2, §13/2).

  Metin `lib/home/content.ts` içindedir; burada yalnız yerleşim vardır.
  Üç sütun bir "özellik listesi" değil, konumlandırmanın üç ayağıdır —
  sayı, oran veya süre iddiası taşımaz.
*/

export function ValuePropositionSection() {
  return (
    <Section id="hakkinda" labelledBy="deger-onerisi-baslik">
      <SectionHeading
        id="deger-onerisi-baslik"
        overline={VALUE_PROPOSITION.overline}
        title={VALUE_PROPOSITION.title}
        description={VALUE_PROPOSITION.body}
      />

      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {VALUE_PROPOSITION.pillars.map((pillar) => (
          <li key={pillar.title} className="flex">
            <Card className="flex w-full flex-col gap-2">
              <h3 className="text-h4">{pillar.title}</h3>
              <p className="text-body text-text-muted">{pillar.body}</p>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
