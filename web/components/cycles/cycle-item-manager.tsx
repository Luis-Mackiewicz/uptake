"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useResourceArray } from "@/hooks/use-resource-array";
import { ApiRequestError, api } from "@/lib/api/client";
import type {
  CreateCycleItemRequest,
  MessageResponse,
  StudyCycle,
  StudyCycleItem,
  StudyGroup,
} from "@/lib/api/types";
import { isValidPositiveId } from "@/lib/validation";

type ItemForm = { studyGroupId: string; position: string; minutesPerSession: string };
type FormErrors = Partial<Record<keyof ItemForm, string>>;

const emptyForm: ItemForm = { studyGroupId: "", position: "", minutesPerSession: "25" };

interface CycleItemManagerProps {
  cycle: StudyCycle;
  groups: StudyGroup[];
  onChanged: () => void;
}

export function CycleItemManager({ cycle, groups, onChanged }: CycleItemManagerProps) {
  const { data, reload } = useResourceArray<StudyCycleItem>(`/study-cycles/${cycle.id}/items`);
  const { notify } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StudyCycleItem | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<StudyCycleItem | null>(null);

  const items = data ?? [];
  const groupName = (id: number) => groups.find((group) => group.id === id)?.name ?? `#${id}`;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, studyGroupId: groups[0] ? String(groups[0].id) : "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (item: StudyCycleItem) => {
    setEditing(item);
    setForm({
      studyGroupId: String(item.studyGroupId),
      position: String(item.position),
      minutesPerSession: String(item.minutesPerSession),
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!isValidPositiveId(Number(form.studyGroupId))) nextErrors.studyGroupId = "Selecione um grupo";
    if (form.position && !isValidPositiveId(Number(form.position))) nextErrors.position = "Posição inválida";
    const minutes = Number(form.minutesPerSession);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) nextErrors.minutesPerSession = "Use de 1 a 180 minutos";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: CreateCycleItemRequest = {
      studyGroupId: Number(form.studyGroupId),
      minutesPerSession: Number(form.minutesPerSession),
      ...(form.position ? { position: Number(form.position) } : {}),
    };

    setSaving(true);
    try {
      if (editing) {
        await api.patch<StudyCycleItem>(`/study-cycles/${cycle.id}/items/${editing.id}`, payload);
      } else {
        await api.post<StudyCycleItem>(`/study-cycles/${cycle.id}/items`, payload);
      }
      notify(editing ? "Item atualizado" : "Item adicionado", "success");
      setDialogOpen(false);
      reload();
      onChanged();
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
      await api.delete<MessageResponse>(`/study-cycles/${cycle.id}/items/${deleting.id}`);
      notify("Item removido", "success");
      setDeleting(null);
      reload();
      onChanged();
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível remover", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Itens do ciclo</CardTitle>
            <p className="mt-1 text-sm text-neutral-600">Rodada {cycle.currentRound} · próxima posição {cycle.nextItemOrder}</p>
          </div>
          <Button size="sm" onClick={openCreate} disabled={!groups.length}>
            Adicionar item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posição</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><Badge tone="lime">{item.position}</Badge></TableCell>
                  <TableCell className="font-medium">{groupName(item.studyGroupId)}</TableCell>
                  <TableCell>{item.minutesPerSession} min</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(item)}>
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Nenhum item neste ciclo"
            description={groups.length ? "Adicione grupos para definir a sequência." : "Crie um grupo de estudo primeiro."}
            action={<Button onClick={openCreate} disabled={!groups.length}>Adicionar item</Button>}
          />
        )}
      </CardContent>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? "Editar item" : "Adicionar item"}>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Grupo" htmlFor="item-group" error={errors.studyGroupId}>
            <Select id="item-group" value={form.studyGroupId} invalid={Boolean(errors.studyGroupId)} onChange={(event) => setForm({ ...form, studyGroupId: event.target.value })}>
              <option value="">Selecione</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Posição" htmlFor="item-position" error={errors.position} hint="Vazio usa a última posição">
              <Input id="item-position" type="number" min={1} value={form.position} invalid={Boolean(errors.position)} onChange={(event) => setForm({ ...form, position: event.target.value })} />
            </Field>
            <Field label="Minutos por sessão" htmlFor="item-minutes" error={errors.minutesPerSession}>
              <Input id="item-minutes" type="number" min={1} max={180} value={form.minutesPerSession} invalid={Boolean(errors.minutesPerSession)} onChange={(event) => setForm({ ...form, minutesPerSession: event.target.value })} />
            </Field>
          </div>
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
        title="Remover item"
        description="As posições restantes serão normalizadas."
        confirmLabel="Remover"
        loading={saving}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}
