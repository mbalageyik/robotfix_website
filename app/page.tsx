/*
  Faz 0 yer tutucu ana sayfa.
  Gerçek ana sayfa akışı (bilgi dosyası §13 — 12 bölüm) Faz 5'te kurulacak.
  Bu sayfada hiçbir doğrulanmamış işletme bilgisi, fiyat veya istatistik bulunmaz.
*/
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <p className="text-sm font-medium tracking-widest text-neutral-500 uppercase">Faz 0</p>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Robot Fix</h1>
      <p className="text-neutral-600">
        Proje iskeleti kuruldu. Tasarım sistemi, ürün kataloğu, yönetim paneli ve 3D katmanı sonraki
        fazlarda eklenecek.
      </p>
    </main>
  );
}
