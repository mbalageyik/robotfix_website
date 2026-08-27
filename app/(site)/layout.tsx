import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/*
  ============================================================================
  GENEL SİTE KABUĞU — başlık + alt bilgi.
  ============================================================================

  NEDEN ROTA GRUBU (`(site)`), NEDEN KÖK DÜZEN DEĞİL. Kabuk kök düzene
  konsaydı yönetim paneline de binerdi; panelin kendi kabuğu ve gezinmesi
  var. Parantezli klasör URL'e girmez (Next.js "Route Groups"), yani
  `/urunler` yine `/urunler`tir; değişen tek şey hangi sayfaların bu düzeni
  paylaştığıdır.

  Kabuğun sayfa sayfa elle eklenmemesinin sebebi de bu: yeni bir genel sayfa
  eklendiğinde başlığı eklemeyi UNUTMAK mümkün olmamalı. Klasöre koymak
  yeter.

  `/styleguide` ve `/veri-kontrol` bilinçli olarak DIŞARIDA: ikisi de
  geliştirici teşhis yüzeyidir, pazarlama kabuğunu taşımaları anlamsız
  olurdu ve `/veri-kontrol` zaten üretim gezinmesinde yer almaz.

  ATLAMA BAĞLANTISI burada durur, her sayfada tekrar edilmez. Hedefi
  `#icerik`; her genel sayfanın `<main>` öğesi bu id'yi taşır.

  HEDEF `tabIndex={-1}` TAŞIMAK ZORUNDA. Yalnız `id` yetmez: `<main>`
  doğal olarak odaklanabilir bir öğe değildir, bu yüzden çapaya gidildiğinde
  tarayıcı sayfayı kaydırır ama ODAĞI TAŞIMAZ — `document.activeElement`
  `<body>`de kalır. Sonuç, gözle bakınca çalışıyormuş gibi görünen ama ekran
  okuyucuya hiçbir şey bildirmeyen bir bağlantıdır (WCAG 2.4.1). `-1` öğeyi
  Tab sırasına SOKMADAN programatik odağa açar; doğru davranış budur.
*/

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-surface-raised focus:px-3 focus:py-2 focus:text-text focus:outline-2 focus:outline-offset-2 focus:outline-focus"
      >
        İçeriğe geç
      </a>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
