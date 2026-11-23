"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiRequestError } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { isBlank, isValidCpf, isValidPassword, isValidUrl } from "@/lib/validation";

type ProfileForm = {
  firstName: string;
  lastName: string;
  cpf: string;
  password: string;
  musicUrl: string;
};
type FormErrors = Partial<Record<keyof ProfileForm, string>>;

function ProfileForm({ user }: { user: User }) {
  const { updateProfile } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState<ProfileForm>(() => ({
    firstName: user.firstName,
    lastName: user.lastName,
    cpf: user.cpf,
    password: "",
    musicUrl: user.musicUrl ?? "",
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const update = (key: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.firstName)) nextErrors.firstName = "Informe seu nome";
    if (isBlank(form.lastName)) nextErrors.lastName = "Informe seu sobrenome";
    if (!isValidCpf(form.cpf)) nextErrors.cpf = "CPF inválido";
    if (!isValidPassword(form.password)) {
      nextErrors.password = "Use 8+ caracteres com maiúscula, minúscula e número";
    }
    if (!isBlank(form.musicUrl) && !isValidUrl(form.musicUrl)) nextErrors.musicUrl = "URL inválida";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        cpf: form.cpf.replace(/\D/g, ""),
        password: form.password,
        musicUrl: isBlank(form.musicUrl) ? null : form.musicUrl.trim(),
      });
      setForm((current) => ({ ...current, password: "" }));
      notify("Perfil atualizado", "success");
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key in form) apiErrors[key as keyof ProfileForm] = messages[0];
        });
        setErrors(apiErrors);
      }
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          <Field label="Nome" htmlFor="firstName" error={errors.firstName}>
            <Input id="firstName" autoComplete="given-name" value={form.firstName} invalid={Boolean(errors.firstName)} onChange={(event) => update("firstName", event.target.value)} />
          </Field>
          <Field label="Sobrenome" htmlFor="lastName" error={errors.lastName}>
            <Input id="lastName" autoComplete="family-name" value={form.lastName} invalid={Boolean(errors.lastName)} onChange={(event) => update("lastName", event.target.value)} />
          </Field>
          <Field label="E-mail" htmlFor="email" hint="Não pode ser alterado">
            <Input id="email" value={user.email} disabled />
          </Field>
          <Field label="CPF" htmlFor="cpf" error={errors.cpf}>
            <Input id="cpf" inputMode="numeric" value={form.cpf} invalid={Boolean(errors.cpf)} onChange={(event) => update("cpf", event.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="URL da música" htmlFor="musicUrl" error={errors.musicUrl}>
              <Input id="musicUrl" type="url" value={form.musicUrl} invalid={Boolean(errors.musicUrl)} onChange={(event) => update("musicUrl", event.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Nova senha"
              htmlFor="password"
              error={errors.password}
              hint="A API exige uma nova senha ao salvar o perfil."
            >
              <Input id="password" type="password" autoComplete="new-password" value={form.password} invalid={Boolean(errors.password)} onChange={(event) => update("password", event.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={loading}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Configurações" description="Atualize seus dados pessoais." />
      {user ? <ProfileForm key={user.id} user={user} /> : null}
    </div>
  );
}
