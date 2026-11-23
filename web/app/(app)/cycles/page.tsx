"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { CycleItemManager } from "@/components/cycles/cycle-item-manager";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useResourceList } from "@/hooks/use-resource-list";
import { ApiRequestError, api } from "@/lib/api/client";
import type {
  CreateStudyCycleRequest,
  MessageResponse,
  StudyCycle,
  StudyGroup,
  UpdateStudyCycleRequest,
} from "@/lib/api/types";
import { isBlank, validateLength } from "@/lib/validation";

type CycleForm = { name: string; active: boolean };
type FormErrors = { name?: string };

const emptyForm: CycleForm = { name: "", active: true };

export default function CyclesPage() {
  const { data, reload } = useResourceList<StudyCycle>("/study-cycles");
  const groupsQuery = useResourceList<StudyGroup>("/study-groups", { limit: 100 });
  const { notify } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudyCycle | null>(null);
  const [form, setForm] = useState<CycleForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<StudyCycle | null>(null);

  const cycles = data?.data ?? [];
  const groups = groupsQuery.data?.data ?? [];
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedId) ?? cycles[0] ?? null;
  const groupName = (id: number) => groups.find((group) => group.id === id)?.name ?? `#${id}`;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (cycle: StudyCycle) => {
    setEditing(cycle);
    setForm({ name: cycle.name, active: cycle.active });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (isBlank(form.name)) nextErrors.name = "Informe o nome";
    else if (!validateLength(form.name, 120)) nextErrors.name = "Máximo de 120 caracteres";
    setErrors(nextErrors);
    return !nextErrors.name;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateStudyCycleRequest | UpdateStudyCycleRequest = {
      name: form.name.trim(),
      active: form.active,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.patch<StudyCycle>(`/study-cycles/${editing.id}`, payload as UpdateStudyCycleRequest);
      } else {
        await api.post<StudyCycle>("/study-cycles", payload as CreateStudyCycleRequest);
      }
      notify(editing ? "Ciclo atualizado" : "Ciclo criado", "success");
      setDialogOpen(false);
      reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete<MessageResponse>(`/study-cycles/${deleting.id}`);
      notify("Ciclo removido", "success");
      setDeleting(null);
      if (selectedId === deleting.id) setSelectedId(null);
      reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível remover", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAdvance = async () => {
    if (!selectedCycle) return;
    setSaving(true);
    try {
      const result = await api.post<{ nextItem: { studyGroupId: number } | null }>(
        `/study-cycles/${selectedCycle.id}/advance`,
      );
      notify(result.nextItem ? `Próximo: ${groupName(result.nextItem.studyGroupId)}` : "Sem itens ativos", "info");
      reload();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível avançar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Ciclos de estudo"
        description="Defina uma sequência de grupos e avance entre eles."
        actions={<Button onClick={openCreate}>Novo ciclo</Button>}
      />

      {cycles.length ? (
        <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
          <div className="space-y-2">
            {cycles.map((cycle) => (
              <Card
                key={cycle.id}
                className={`cursor-pointer p-4 transition ${selectedCycle?.id === cycle.id ? "border-lime-500 ring-2 ring-lime-200" : ""}`}
              >
                <button type="button" className="w-full text-left" onClick={() => setSelectedId(cycle.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{cycle.name}</span>
                    <Badge tone={cycle.active ? "success" : "neutral"}>{cycle.active ? "Ativo" : "Pausado"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Rodada {cycle.currentRound} · posição {cycle.nextItemOrder}
                  </p>
                </button>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(cycle)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(cycle)}>
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {selectedCycle ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle>{selectedCycle.name}</CardTitle>
                      <p className="mt-1 text-sm text-neutral-600">Rodada atual: {selectedCycle.currentRound}</p>
                    </div>
                    <Button onClick={handleAdvance} disabled={saving}>
                      Avançar ciclo
                    </Button>
                  </div>
                </CardHeader>
              </Card>
              <CycleItemManager cycle={selectedCycle} groups={groups} onChanged={reload} />
            </div>
          ) : null}
        </div>
      ) : (
        <Card>
          <EmptyState
            title={data ? "Nenhum ciclo encontrado" : "Carregando..."}
            description="Crie um ciclo para organizar a ordem dos seus estudos."
            action={<Button onClick={openCreate}>Novo ciclo</Button>}
          />
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar ciclo" : "Novo ciclo"}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Nome" htmlFor="cycle-name" error={errors.name}>
            <Input id="cycle-name" value={form.name} invalid={Boolean(errors.name)} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              className="size-4 accent-lime-600"
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
            />
            Ciclo ativo
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Salvar
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Excluir ciclo"
        description={`O ciclo "${deleting?.name ?? ""}" será removido.`}
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
