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
import { registerFormSchema } from "@/lib/schemas";
import type { RegisterFormValues } from "@/lib/schemas";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { notify } = useToast();
  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      cpf: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email.toLowerCase(),
        cpf: values.cpf.replace(/\D/g, ""),
        password: values.password,
      });
      notify("Conta criada com sucesso", "success");
      router.replace("/dashboard");
    } catch (error) {
      applyApiIssues(error, setError);
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível cadastrar", "error");
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Comece a organizar seus estudos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Nome" htmlFor="firstName" error={errors.firstName?.message}>
            <Input id="firstName" autoComplete="given-name" invalid={Boolean(errors.firstName)} {...field("firstName")} />
          </Field>
          <Field label="Sobrenome" htmlFor="lastName" error={errors.lastName?.message}>
            <Input id="lastName" autoComplete="family-name" invalid={Boolean(errors.lastName)} {...field("lastName")} />
          </Field>
          <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" invalid={Boolean(errors.email)} {...field("email")} />
          </Field>
          <Field label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
            <Input id="cpf" inputMode="numeric" invalid={Boolean(errors.cpf)} {...field("cpf")} />
          </Field>
          <Field label="Senha" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" invalid={Boolean(errors.password)} {...field("password")} />
          </Field>
          <Field label="Confirmar senha" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" invalid={Boolean(errors.confirmPassword)} {...field("confirmPassword")} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Criar conta
            </Button>
          </div>
        </form>
        <p className="text-center text-sm text-neutral-600">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-lime-800 hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
