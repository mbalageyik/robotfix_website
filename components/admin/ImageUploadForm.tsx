"use client";

import { useActionState, useId } from "react";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { uploadProductImageAction } from "@/lib/admin/image-actions";
import { IDLE_ACTION_STATE } from "@/lib/admin/action-result";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/admin/schemas";

/*
  Görsel yükleme formu.

  `accept` ve boyut metni İSTEMCİ KOLAYLIĞIDIR, güvenlik değildir: gerçek
  kısıt sunucudaki `validateImageFile` ve kovanın kendi `allowed_mime_types` /
  `file_size_limit` ayarlarıdır (migrasyon 04). Üç katman da aynı sabitlerden
  beslenir — bu yüzden değerler burada elle yazılmaz, şemadan içe aktarılır.
*/

const MAX_MB = MAX_IMAGE_BYTES / (1024 * 1024);

export function ImageUploadForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState(uploadProductImageAction, IDLE_ACTION_STATE);
  const formId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />

      <FormFeedback state={state} />

      <Field
        id={`${formId}-file`}
        label="Görsel dosyası"
        required
        hint={`JPEG, PNG, WebP veya AVIF. En fazla ${MAX_MB} MB.`}
        error={state.fieldErrors.file}
      >
        {(props) => (
          <input
            {...props}
            type="file"
            name="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            required
          />
        )}
      </Field>

      {/*
        ALTERNATİF METİN boş bırakılabilir — bu "unuttum" değil, "bu görsel
        DEKORATİF" demektir ve şemada `not null default ''` olarak karşılığı
        vardır. Ekran okuyucu boş alt metinli görseli atlar; ürünü anlatan bir
        görsele yanlış bir açıklama uydurmaktan iyidir.
      */}
      <Field
        id={`${formId}-alt`}
        label="Alternatif metin"
        hint="Görselde ne göründüğünü kısaca yazın. Görsel yalnız dekoratifse boş bırakın."
        error={state.fieldErrors.altText}
      >
        {(props) => <input {...props} name="altText" maxLength={300} />}
      </Field>

      <div>
        <SubmitButton pendingLabel="Yükleniyor…">Görseli yükle</SubmitButton>
      </div>
    </form>
  );
}
