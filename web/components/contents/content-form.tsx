"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ResourceFormPage } from "@/components/forms/resource-form-page";
import { ResourceLoadState } from "@/components/forms/resource-load-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useResourceItem } from "@/hooks/use-resource-item";
import { api } from "@/lib/api/client";
import { friendlyApiMessage } from "@/lib/api/errors";
import type { Content, CreateContentRequest, StudyGroup } from "@/lib/api/types";
import { notifyResourceChanged } from "@/lib/events";
import { applyApiIssues, nullableTrimmed } from "@/lib/form";
import { contentFormSchema } from "@/lib/schemas";
import type { ContentFormValues } from "@/lib/schemas";

interface ContentFormProps {
  group: StudyGroup;
  content?: Content;
}

export function ContentForm({ group, content }: ContentFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const backHref = `/study-groups/${group.id}/contents`;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: content?.title ?? "",
      description: content?.description ?? "",
    },
  });

  const onSubmit = async (values: ContentFormValues) => {
    const payload: CreateContentRequest = {
      title: values.title,
      description: nullableTrimmed(values.description),
      studyGroupId: group.id,
    };

    try {
      if (content) await api.patch(`/contents/${content.id}`, payload);
      else await api.post("/contents", payload);
      notify(content ? "Conteúdo atualizado" : "Conteúdo criado", "success");
      notifyResourceChanged();
      router.push(backHref);
      router.refresh();
    } catch (caught) {
      applyApiIssues(caught, setError);
      notify(friendlyApiMessage(caught, "Não foi possível salvar"), "error");
    }
  };

  return (
    <ResourceFormPage
      title={content ? "Editar conteúdo" : "Novo conteúdo"}
      description={`Grupo: ${group.name}`}
      breadcrumbs={[
        { label: "Grupos de estudo", href: "/study-groups" },
        { label: group.name, href: backHref },
        { label: content ? "Editar" : "Novo" },
      ]}
      backHref={backHref}
      onSubmit={handleSubmit(onSubmit)}
      submitting={isSubmitting}
    >
      <Field label="Título" htmlFor="content-title" error={errors.title?.message}>
        <Input id="content-title" invalid={Boolean(errors.title)} {...register("title")} />
      </Field>
      <Field label="Descrição" htmlFor="content-description" error={errors.description?.message}>
        <Textarea id="content-description" invalid={Boolean(errors.description)} {...register("description")} />
      </Field>
    </ResourceFormPage>
  );
}

export function ContentNewPage({ groupId }: { groupId: number }) {
  const groupQuery = useResourceItem<StudyGroup>(`/study-groups/${groupId}`);
  const backHref = "/study-groups";

  if (groupQuery.loading || groupQuery.error || !groupQuery.data) {
    return (
      <ResourceLoadState
        loading={groupQuery.loading}
        error={groupQuery.error}
        backHref={backHref}
        notFoundLabel="Grupo não encontrado"
      />
    );
  }

  return <ContentForm group={groupQuery.data} />;
}

export function ContentEditPage({ groupId, contentId }: { groupId: number; contentId: number }) {
  const groupQuery = useResourceItem<StudyGroup>(`/study-groups/${groupId}`);
  const contentQuery = useResourceItem<Content>(`/contents/${contentId}`);
  const backHref = `/study-groups/${groupId}/contents`;
  const error = groupQuery.error ?? contentQuery.error;

  if (groupQuery.loading || contentQuery.loading || error || !groupQuery.data || !contentQuery.data) {
    return (
      <ResourceLoadState
        loading={groupQuery.loading || contentQuery.loading}
        error={error}
        backHref={backHref}
        notFoundLabel="Conteúdo não encontrado"
      />
    );
  }

  return <ContentForm group={groupQuery.data} content={contentQuery.data} />;
}
