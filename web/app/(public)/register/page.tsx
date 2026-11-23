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
import { isBlank, isValidCpf, isValidEmail, isValidPassword } from "@/lib/validation";

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  password: string;
  confirmPassword: string;
};
type FormErrors = Partial<Record<keyof RegisterForm, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    cpf: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const update = (key: keyof RegisterForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.firstName)) nextErrors.firstName = "Informe seu nome";
    if (isBlank(form.lastName)) nextErrors.lastName = "Informe seu sobrenome";
    if (isBlank(form.email)) nextErrors.email = "Informe seu e-mail";
    else if (!isValidEmail(form.email)) nextErrors.email = "E-mail inválido";
    if (!isValidCpf(form.cpf)) nextErrors.cpf = "CPF inválido";
    if (!isValidPassword(form.password)) {
      nextErrors.password = "Use 8+ caracteres com maiúscula, minúscula e número";
    }
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "As senhas não conferem";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        cpf: form.cpf.replace(/\D/g, ""),
        password: form.password,
      });
      notify("Conta criada com sucesso", "success");
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key in form) apiErrors[key as keyof RegisterForm] = messages[0];
        });
        setErrors(apiErrors);
      }
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível cadastrar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Comece a organizar seus estudos.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          <Field label="Nome" htmlFor="firstName" error={errors.firstName}>
            <Input id="firstName" autoComplete="given-name" value={form.firstName} invalid={Boolean(errors.firstName)} onChange={(event) => update("firstName", event.target.value)} />
          </Field>
          <Field label="Sobrenome" htmlFor="lastName" error={errors.lastName}>
            <Input id="lastName" autoComplete="family-name" value={form.lastName} invalid={Boolean(errors.lastName)} onChange={(event) => update("lastName", event.target.value)} />
          </Field>
          <Field label="E-mail" htmlFor="email" error={errors.email}>
            <Input id="email" type="email" autoComplete="email" value={form.email} invalid={Boolean(errors.email)} onChange={(event) => update("email", event.target.value)} />
          </Field>
          <Field label="CPF" htmlFor="cpf" error={errors.cpf}>
            <Input id="cpf" inputMode="numeric" value={form.cpf} invalid={Boolean(errors.cpf)} onChange={(event) => update("cpf", event.target.value)} />
          </Field>
          <Field label="Senha" htmlFor="password" error={errors.password}>
            <Input id="password" type="password" autoComplete="new-password" value={form.password} invalid={Boolean(errors.password)} onChange={(event) => update("password", event.target.value)} />
          </Field>
          <Field label="Confirmar senha" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} invalid={Boolean(errors.confirmPassword)} onChange={(event) => update("confirmPassword", event.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" loading={loading}>
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
