#!/usr/bin/env bash
# =============================================================================
# YALNIZ YEREL GELİŞTİRME. Demo ürünlerin yer tutucu görsellerini Storage'a yükler.
# =============================================================================
#
# NEDEN GEREKLİ. `supabase/seed.sql` demo ürünler için `product_images` satırları
# ekler ama Storage'a hiçbir dosya koymaz — o satırların amacı veri katmanının
# görsel mantığını (ana görsel seçimi, `display_order`) gerçek satırlarla test
# edilebilir kılmaktı. Demo ürünler yayına alınınca (dev_activate_demo.sql) bu
# yollar 404 döner, `next/image` 400 verir ve kartlarda SİYAH BOŞ KUTU görünür.
# Bu betik o boşluğu kapatır.
#
# Görseller ÜRÜN FOTOĞRAFI DEĞİLDİR: şematik çizimlerdir ve kadrajda "[ÖRNEK]"
# yazar. Gerçek bir fotoğrafı taklit eden yer tutucu, "demo veri" olduğu
# unutulduğu anda sahte bir ürün görseline dönüşürdü.
#
# Çalıştırma:
#   npm run db:demo:images
#
# `supabase db reset` Storage nesnelerini de siler; sıfırlamadan sonra bu betik
# yeniden çalıştırılır.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
assets="$here/demo-assets"
bucket="product-images"
prefix="demo/yer-tutucu"

if ! command -v supabase >/dev/null 2>&1; then
  echo "HATA: supabase CLI bulunamadı." >&2
  exit 1
fi

# Değerler çalışan yığından okunur; .env.local'e dokunulmaz ve hiçbir anahtar
# ekrana basılmaz.
status="$(supabase status -o env)"
api_url="$(printf '%s\n' "$status" | sed -n 's/^API_URL="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')"
service_key="$(printf '%s\n' "$status" | sed -n 's/^SERVICE_ROLE_KEY="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p')"

if [ -z "$api_url" ] || [ -z "$service_key" ]; then
  echo "HATA: yerel yığın çalışmıyor gibi görünüyor. Önce: supabase start" >&2
  exit 1
fi

# ÜRETİM KORUMASI. service_role anahtarı RLS'i atlar; bu betiğin uzak bir
# projeye dosya yazması hiçbir koşulda istenmez.
case "$api_url" in
  http://127.0.0.1:*|http://localhost:*|http://0.0.0.0:*) ;;
  *)
    echo "REDDEDİLDİ: API adresi yerel değil ($api_url). Bu betik yalnız yerel yığında çalışır." >&2
    exit 1
    ;;
esac

uploaded=0
# Klasör boşsa glob'un düz metin olarak curl'e gitmesini engeller.
shopt -s nullglob

for file in "$assets"/*.webp; do
  name="$(basename "$file")"
  # Anahtar KOMUT SATIRINDA GEÇMEZ. `-H "Authorization: Bearer $key"`
  # yazsaydık anahtar `ps` çıktısında görünürdü ve aynı makinedeki başka bir
  # kullanıcı okuyabilirdi. `--config -` seçenekleri stdin'den alır; argüman
  # listesine hiç girmez.
  #
  # `x-upsert` sayesinde betik tekrar tekrar çalıştırılabilir.
  code="$(printf 'header = "Authorization: Bearer %s"\n' "$service_key" | curl -sS \
    --config - \
    -o /dev/null -w '%{http_code}' \
    -X POST "$api_url/storage/v1/object/$bucket/$prefix/$name" \
    -H "Content-Type: image/webp" \
    -H "x-upsert: true" \
    --data-binary "@$file")"

  if [ "$code" = "200" ]; then
    echo "yüklendi: $prefix/$name"
    uploaded=$((uploaded + 1))
  else
    echo "HATA ($code): $prefix/$name" >&2
    exit 1
  fi
done

echo "Toplam $uploaded dosya yüklendi → $bucket/$prefix"
