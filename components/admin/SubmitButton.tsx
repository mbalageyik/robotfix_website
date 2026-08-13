"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/Button";

/*
  Gönder butonu.

  `useFormStatus` KENDİ formunun durumunu okur; bu yüzden bileşen formun
  İÇİNDE olmalıdır (kardeş değil). Ayrı bir bileşen olmasının sebebi budur:
  formun kendisi sunucu bileşeni kalabilsin, yalnız bu küçük parça istemciye
  insin.

  Gönderim sırasında buton devre dışı kalır — çift gönderim, ürünü iki kez
  oluşturmanın en yaygın yoludur.
*/

export interface SubmitButtonProps extends Omit<ButtonProps, "type" | "loading"> {
  /** Beklerken gösterilecek metin. Verilmezse çocuk metin korunur. */
  pendingLabel?: string;
}

export function SubmitButton({ children, pendingLabel, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
