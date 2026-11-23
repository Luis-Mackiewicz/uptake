"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { ResourceFormPage } from "@/components/forms/resource-form-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useResourceItem } from "@/hooks/use-resource-item";
import { api } from "@/lib/api/client";
import { friendlyApiMessage } from "@/lib/api/errors";
import type { CreateStudyGroupRequest, StudyGroup } from "@/lib/api/types";
import { notifyResourceChanged } from "@/lib/events";
import { applyApiIssues, nullableTrimmed } from "@/lib/form";
import { groupFormSchema } from "@/lib/schemas";
import type { GroupFormValues } from "@/lib/schemas";

interface StudyGroupFormProps {
  group?: StudyGroup;
}

export function StudyGroupForm({ group }: StudyGroupFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: group?.name ?? "",
      description: group?.description ?? "",
    },
  });

  const onSubmit = async (values: GroupFormValues) => {
    const payload: CreateStudyGroupRequest = {
      name: values.name,
      description: nullableTrimmed(values.description),
    };

    try {
      if (group) await api.patch(`/study-groups/${group.id}`, payload);
      else await api.post("/study-groups", payload);
      notify(group ? "Grupo atualizado" : "Grupo criado", "success");
      notifyResourceChanged();
      router.push("/study-groups");
      router.refresh();
    } catch (caught) {
      applyApiIssues(caught, setError);
      notify(friendlyApiMessage(caught, "Não foi possível salvar"), "error");
    }
  };

  return (
    <ResourceFormPage
      title={group ? "Editar grupo" : "Novo grupo"}
      description="Defina o nome e a descrição do grupo de estudo."
      breadcrumbs={[
        { label: "Grupos de estudo", href: "/study-groups" },
        { label: group ? "Editar" : "Novo" },
      ]}
      backHref="/study-groups"
      onSubmit={handleSubmit(onSubmit)}
      submitting={isSubmitting}
    >
      <Field label="Nome" htmlFor="group-name" error={errors.name?.message}>
        <Input id="group-name" invalid={Boolean(errors.name)} {...register("name")} />
      </Field>
      <Field label="Descrição" htmlFor="group-description" error={errors.description?.message}>
        <Textarea id="group-description" invalid={Boolean(errors.description)} {...register("description")} />
      </Field>
    </ResourceFormPage>
  );
}

export function StudyGroupEditPage({ groupId }: { groupId: number }) {
  const query = useResourceItem<StudyGroup>(`/study-groups/${groupId}`);

  if (query.loading || (!query.error && !query.data)) {
    return (
      <Card className="p-6">
        <p className="text-sm text-neutral-600">Carregando grupo...</p>
      </Card>
    );
  }

  if (query.error || !query.data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-700" role="alert">
          {query.error ?? "Grupo não encontrado"}
        </p>
        <Link href="/study-groups" className="mt-4 inline-block">
          <Button variant="secondary">
            <ArrowLeft size={16} aria-hidden />
            Voltar
          </Button>
        </Link>
      </Card>
    );
  }

  return <StudyGroupForm group={query.data} />;
}
