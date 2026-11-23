"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { ResourceFormPage } from "@/components/forms/resource-form-page";
import { ResourceLoadState } from "@/components/forms/resource-load-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useResourceItem } from "@/hooks/use-resource-item";
import { useResourceList } from "@/hooks/use-resource-list";
import { api } from "@/lib/api/client";
import { friendlyApiMessage } from "@/lib/api/errors";
import type {
  Content,
  CreateStudyCycleRequest,
  CyclePriority,
  StudyCycle,
  StudyGroup,
} from "@/lib/api/types";
import { CYCLE_PRIORITIES } from "@/lib/api/types";
import { notifyResourceChanged } from "@/lib/events";
import { applyApiIssues } from "@/lib/form";
import { cycleFormSchema } from "@/lib/schemas";
import type { CycleFormValues } from "@/lib/schemas";

interface CycleFormProps {
  examId: number;
  cycle?: StudyCycle | null;
}

function buildForm(cycle: StudyCycle | null, groups: StudyGroup[]): CycleFormValues {
  return {
    name: cycle?.name ?? "",
    active: cycle?.active ?? true,
    studyGroupId: cycle ? String(cycle.studyGroupId) : groups[0] ? String(groups[0].id) : "",
    priority: String(cycle?.priority ?? 2),
    contentIds: (cycle?.contentIds ?? []).map(String),
  };
}

export function CycleForm({ examId, cycle = null }: CycleFormProps) {
  const router = useRouter();
  const { notify } = useToast();
  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const contentsQuery = useResourceList<Content>("/contents", { limit: 100 });
  const groups = groupsQuery.data?.data ?? [];
  const contents = contentsQuery.data?.data ?? [];
  const backHref = `/exams/${examId}`;

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CycleFormValues>({
    resolver: zodResolver(cycleFormSchema),
    defaultValues: buildForm(cycle, groups),
  });

  const studyGroupId = useWatch({ control, name: "studyGroupId" });
  const contentIds = useWatch({ control, name: "contentIds" });
  const groupContents = contents.filter((content) => content.studyGroupId === Number(studyGroupId));

  const toggleContent = (id: number) => {
    const value = String(id);
    const current = getValues("contentIds");
    setValue(
      "contentIds",
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const onSubmit = async (values: CycleFormValues) => {
    const payload: CreateStudyCycleRequest = {
      name: values.name,
      active: values.active,
      studyGroupId: Number(values.studyGroupId),
      priority: Number(values.priority) as CyclePriority,
      contentIds: values.contentIds.map(Number),
    };

    try {
      if (cycle) await api.patch(`/exams/${examId}/cycles/${cycle.id}`, payload);
      else await api.post(`/exams/${examId}/cycles`, payload);
      notify(cycle ? "Ciclo atualizado" : "Ciclo criado", "success");
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
      title={cycle ? "Editar ciclo" : "Novo ciclo"}
      description="Defina a prioridade e a sequência de conteúdos deste ciclo."
      breadcrumbs={[
        { label: "Provas", href: "/exams" },
        { label: "Ciclos", href: backHref },
        { label: cycle ? "Editar" : "Novo" },
      ]}
      backHref={backHref}
      onSubmit={handleSubmit(onSubmit)}
      submitting={isSubmitting}
    >
      <Field label="Nome" htmlFor="cycle-name" error={errors.name?.message}>
        <Input id="cycle-name" invalid={Boolean(errors.name)} {...register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Grupo" htmlFor="cycle-group" error={errors.studyGroupId?.message}>
          <Select
            id="cycle-group"
            invalid={Boolean(errors.studyGroupId)}
            {...register("studyGroupId", {
              onChange: () => setValue("contentIds", [], { shouldDirty: true, shouldValidate: true }),
            })}
          >
            <option value="">Selecione</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridade" htmlFor="cycle-priority" error={errors.priority?.message}>
          <Select id="cycle-priority" invalid={Boolean(errors.priority)} {...register("priority")}>
            {CYCLE_PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" className="size-4 accent-lime-600" {...register("active")} />
        Ciclo ativo
      </label>
      <Field label="Conteúdos do ciclo" htmlFor="cycle-contents" error={errors.contentIds?.message} hint="A ordem da sequência segue a seleção.">
        <div id="cycle-contents" className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3">
          {groupContents.length ? groupContents.map((content) => (
            <label key={content.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-50">
              <input type="checkbox" className="size-4 accent-lime-600" checked={contentIds.includes(String(content.id))} onChange={() => toggleContent(content.id)} />
              <span>{content.title}</span>
            </label>
          )) : <p className="text-sm text-neutral-500">Selecione um grupo com conteúdos.</p>}
        </div>
      </Field>
    </ResourceFormPage>
  );
}

export function CycleEditPage({ examId, cycleId }: { examId: number; cycleId: number }) {
  const query = useResourceItem<StudyCycle>(`/exams/${examId}/cycles/${cycleId}`);
  const backHref = `/exams/${examId}`;

  if (query.loading || query.error || !query.data) {
    return (
      <ResourceLoadState
        loading={query.loading}
        error={query.error}
        backHref={backHref}
        notFoundLabel="Ciclo não encontrado"
      />
    );
  }

  return <CycleForm examId={examId} cycle={query.data} />;
}
