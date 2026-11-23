"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiRequestError } from "@/lib/api/client";
import { isBlank, isValidEmail } from "@/lib/validation";

type LoginForm = { email: string; password: string };
type FormErrors = Partial<Record<keyof LoginForm, string>>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.email)) nextErrors.email = "Informe seu e-mail";
    else if (!isValidEmail(form.email)) nextErrors.email = "E-mail inválido";
    if (isBlank(form.password)) nextErrors.password = "Informe sua senha";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password });
      const requested = new URLSearchParams(window.location.search).get("next");
      const nextPath = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
      notify("Login realizado com sucesso", "success");
      router.replace(nextPath);
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key === "email" || key === "password") apiErrors[key] = messages[0];
        });
        setErrors(apiErrors);
      }
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível entrar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="E-mail" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              invalid={Boolean(errors.email)}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </Field>
          <Field label="Senha" htmlFor="password" error={errors.password}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              invalid={Boolean(errors.password)}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>
        <p className="text-center text-sm text-neutral-600">
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-medium text-lime-800 hover:underline">
            Cadastrar-se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
