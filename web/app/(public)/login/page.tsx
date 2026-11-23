"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiRequestError } from "@/lib/api/client";
import { applyApiIssues } from "@/lib/form";
import { loginFormSchema } from "@/lib/schemas";
import type { LoginFormValues } from "@/lib/schemas";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { notify } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login({ email: values.email.toLowerCase(), password: values.password });
      const requested = new URLSearchParams(window.location.search).get("next");
      const nextPath = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
      notify("Login realizado com sucesso", "success");
      router.replace(nextPath);
    } catch (error) {
      applyApiIssues(error, setError);
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível entrar", "error");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" invalid={Boolean(errors.email)} {...register("email")} />
          </Field>
          <Field label="Senha" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" invalid={Boolean(errors.password)} {...register("password")} />
          </Field>
          <Button type="submit" className="w-full" loading={isSubmitting}>
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
