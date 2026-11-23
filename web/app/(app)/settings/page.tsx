"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/components/auth/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiRequestError } from "@/lib/api/client";
import { applyApiIssues, nullableTrimmed } from "@/lib/form";
import { profileFormSchema } from "@/lib/schemas";
import type { ProfileFormValues } from "@/lib/schemas";
import type { User } from "@/lib/api/types";

function ProfileForm({ user }: { user: User }) {
  const { updateProfile } = useAuth();
  const { notify } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      cpf: user.cpf,
      password: "",
      confirmPassword: "",
      musicUrl: user.musicUrl ?? "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        cpf: values.cpf.replace(/\D/g, ""),
        password: values.password,
        musicUrl: nullableTrimmed(values.musicUrl),
      });
      reset({ ...values, password: "", confirmPassword: "" });
      notify("Perfil atualizado", "success");
    } catch (error) {
      applyApiIssues(error, setError);
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar", "error");
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Nome" htmlFor="firstName" error={errors.firstName?.message}>
            <Input id="firstName" autoComplete="given-name" invalid={Boolean(errors.firstName)} {...register("firstName")} />
          </Field>
          <Field label="Sobrenome" htmlFor="lastName" error={errors.lastName?.message}>
            <Input id="lastName" autoComplete="family-name" invalid={Boolean(errors.lastName)} {...register("lastName")} />
          </Field>
          <Field label="E-mail" htmlFor="email" hint="Não pode ser alterado">
            <Input id="email" value={user.email} disabled />
          </Field>
          <Field label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
            <Input id="cpf" inputMode="numeric" invalid={Boolean(errors.cpf)} {...register("cpf")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="URL da música" htmlFor="musicUrl" error={errors.musicUrl?.message}>
              <Input id="musicUrl" type="url" invalid={Boolean(errors.musicUrl)} {...register("musicUrl")} />
            </Field>
          </div>
          <Field
            label="Nova senha"
            htmlFor="password"
            error={errors.password?.message}
            hint="A API exige uma nova senha ao salvar o perfil."
          >
            <Input id="password" type="password" autoComplete="new-password" invalid={Boolean(errors.password)} {...register("password")} />
          </Field>
          <Field label="Confirmar senha" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" invalid={Boolean(errors.confirmPassword)} {...register("confirmPassword")} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={isSubmitting}>
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
