"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cycleFormSchema } from "@/lib/schemas";
import type { CycleFormValues } from "@/lib/schemas";
import type {
  Content,
  CreateStudyCycleRequest,
  CyclePriority,
  StudyCycle,
  StudyGroup,
} from "@/lib/api/types";
import { CYCLE_PRIORITIES } from "@/lib/api/types";

interface CycleFormDialogProps {
  open: boolean;
  cycle: StudyCycle | null;
  groups: StudyGroup[];
  contents: Content[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: CreateStudyCycleRequest) => Promise<void>;
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

export function CycleFormDialog({
  open,
  cycle,
  groups,
  contents,
  saving,
  onClose,
  onSave,
}: CycleFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CycleFormValues>({
    resolver: zodResolver(cycleFormSchema),
    defaultValues: buildForm(cycle, groups),
  });

  useEffect(() => {
    if (open) reset(buildForm(cycle, groups));
  }, [open, cycle, groups, reset]);

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
    await onSave({
      name: values.name,
      active: values.active,
      studyGroupId: Number(values.studyGroupId),
      priority: Number(values.priority) as CyclePriority,
      contentIds: values.contentIds.map(Number),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title={cycle ? "Editar ciclo" : "Novo ciclo"}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
          <Field label="Prioridade" htmlFor="cycle-priority">
            <Select id="cycle-priority" {...register("priority")}>
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
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={saving}>Salvar</Button>
        </div>
      </form>
    </Dialog>
  );
}
