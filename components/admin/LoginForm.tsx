"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { signInAction, type LoginState } from "@/lib/auth/actions";

/*
  Giriş formu. İstemci bileşeni olmasının TEK sebebi `useActionState` ile
  bekleme durumu ve hata mesajını göstermek; doğrulama ve kimlik doğrulama
  tamamen sunucuda (`signInAction`) yapılır.
*/

const initialState: LoginState = { error: null };

export function LoginForm({ continueTo }: { continueTo?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {continueTo && <input type="hidden" name="devam" value={continueTo} />}

      {state.error && (
        <ErrorState title="Giriş yapılamadı" description={state.error} />
      )}

      <Field id="email" label="E-posta" required>
        {(props) => (
          <input
            {...props}
            type="email"
            name="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        )}
      </Field>

      <Field id="password" label="Parola" required>
        {(props) => (
          <input
            {...props}
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        )}
      </Field>

      <Button type="submit" loading={pending} fullWidth>
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
    </form>
  );
}
