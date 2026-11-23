"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

type CycleForm = {
  name: string;
  active: boolean;
  studyGroupId: string;
  priority: string;
  contentIds: string[];
};

type FormErrors = Partial<Record<keyof CycleForm, string>>;

function buildForm(cycle: StudyCycle | null, groups: StudyGroup[]): CycleForm {
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
  const [form, setForm] = useState<CycleForm>(() => buildForm(cycle, groups));
  const [errors, setErrors] = useState<FormErrors>({});

  const groupContents = contents.filter(
    (content) => content.studyGroupId === Number(form.studyGroupId),
  );

  const toggleContent = (id: number) => {
    const value = String(id);
    setForm((current) => ({
      ...current,
      contentIds: current.contentIds.includes(value)
        ? current.contentIds.filter((item) => item !== value)
        : [...current.contentIds, value],
    }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Informe o nome";
    else if (form.name.trim().length > 120) nextErrors.name = "Máximo de 120 caracteres";
    if (!form.studyGroupId) nextErrors.studyGroupId = "Selecione um grupo";
    if (form.contentIds.length > 50) nextErrors.contentIds = "Máximo de 50 conteúdos";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    await onSave({
      name: form.name.trim(),
      active: form.active,
      studyGroupId: Number(form.studyGroupId),
      priority: Number(form.priority) as CyclePriority,
      contentIds: form.contentIds.map(Number),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} title={cycle ? "Editar ciclo" : "Novo ciclo"}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Nome" htmlFor="cycle-name" error={errors.name}>
          <Input id="cycle-name" value={form.name} invalid={Boolean(errors.name)} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grupo" htmlFor="cycle-group" error={errors.studyGroupId}>
            <Select
              id="cycle-group"
              value={form.studyGroupId}
              invalid={Boolean(errors.studyGroupId)}
              onChange={(event) => setForm({ ...form, studyGroupId: event.target.value, contentIds: [] })}
            >
              <option value="">Selecione</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridade" htmlFor="cycle-priority">
            <Select id="cycle-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              {CYCLE_PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="size-4 accent-lime-600"
            checked={form.active}
            onChange={(event) => setForm({ ...form, active: event.target.checked })}
          />
          Ciclo ativo
        </label>
        <Field label="Conteúdos do ciclo" htmlFor="cycle-contents" error={errors.contentIds} hint="A ordem da sequência segue a seleção.">
          <div id="cycle-contents" className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3">
            {groupContents.length ? groupContents.map((content) => (
              <label key={content.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-50">
                <input type="checkbox" className="size-4 accent-lime-600" checked={form.contentIds.includes(String(content.id))} onChange={() => toggleContent(content.id)} />
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
