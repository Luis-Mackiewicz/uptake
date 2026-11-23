"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useFileTree } from "./file-tree-provider";
import { FileTreeNode } from "./file-tree-node";
import type { FileTreeAction } from "./file-tree-types";
import { useNoteTabsContext } from "@/components/notes/note-tabs-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiRequestError, api } from "@/lib/api/client";
import type {
  Content,
  CreateContentRequest,
  CreateNoteRequest,
  CreateStudyGroupRequest,
  MessageResponse,
  Note,
  StudyGroup,
  UpdateNoteRequest,
} from "@/lib/api/types";
import { isBlank, validateLength } from "@/lib/validation";

type TreeForm = { name: string };
type FormErrors = Partial<Record<keyof TreeForm, string>>;
const emptyForm: TreeForm = { name: "" };

function isDeleteAction(action: FileTreeAction) {
  return action.type.startsWith("delete-");
}

function actionTitle(action: FileTreeAction) {
  switch (action.type) {
    case "create-group":
      return "Novo grupo";
    case "create-content":
      return "Nova pasta";
    case "create-note":
      return "Nova nota";
    case "rename-group":
      return "Renomear grupo";
    case "rename-content":
      return "Renomear pasta";
    case "rename-note":
      return "Renomear nota";
    case "delete-group":
      return "Excluir grupo";
    case "delete-content":
      return "Excluir pasta";
    case "delete-note":
      return "Excluir nota";
  }
}

function nameLabel(action: FileTreeAction) {
  return action.type.includes("note") ? "Nome" : action.type.includes("content") ? "Pasta" : "Grupo";
}

export function FileTree({ className }: { className?: string }) {
  const { tree, loading, reload } = useFileTree();
  const { openNote, closeTab } = useNoteTabsContext();
  const { notify } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<FileTreeAction | null>(null);
  const [form, setForm] = useState<TreeForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const expandedKeys = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const [groupId, , contentId] = segments.slice(1);
    const next = new Set<string>();
    if (groupId) next.add(`group:${groupId}`);
    if (contentId) next.add(`content:${contentId}`);
    collapsedKeys.forEach((key) => next.delete(key));
    return next;
  }, [pathname, collapsedKeys]);

  const toggle = (key: string) => {
    setCollapsedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openAction = (next: FileTreeAction) => {
    const existingName =
      next.type === "rename-group"
        ? next.group.name
        : next.type === "rename-content"
          ? next.content.title
          : next.type === "rename-note"
            ? next.note.fileName
            : next.type === "delete-group"
              ? next.group.name
              : next.type === "delete-content"
                ? next.content.title
                : next.type === "delete-note"
                  ? next.note.fileName
                  : "";
    setAction(next);
    setForm({ name: existingName });
    setErrors({});
  };

  const validate = () => {
    if (!action) return false;
    const nextErrors: FormErrors = {};
    if (isBlank(form.name)) nextErrors.name = "Informe o nome";
    else if (!validateLength(form.name, 255)) nextErrors.name = "Máximo de 255 caracteres";
    else if (action.type.includes("note") && (form.name.includes("/") || form.name.includes("\\"))) {
      nextErrors.name = "Não use barras no nome";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleDelete = async () => {
    if (!action || !isDeleteAction(action)) return;
    setSaving(true);
    try {
      let targetHref = "";
      let redirectHref = "/study-groups";
      if (action.type === "delete-group") {
        await api.delete<MessageResponse>(`/study-groups/${action.group.id}`);
        closeTabsForPrefix(action.group.href);
        targetHref = action.group.href;
      } else if (action.type === "delete-content") {
        await api.delete<MessageResponse>(`/contents/${action.content.id}`);
        closeTabsForPrefix(action.content.href);
        targetHref = action.content.href;
        redirectHref = action.group.href;
      } else if (action.type === "delete-note") {
        await api.delete<MessageResponse>(`/notes/${action.note.id}`);
        closeTab(action.note.id);
        targetHref = action.note.href;
        redirectHref = action.content.href;
      }
      reload();
      setAction(null);
      notify("Item removido", "success");
      if (pathname === targetHref || pathname.startsWith(`${targetHref}/`)) {
        router.push(redirectHref);
      }
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível remover", "error");
    } finally {
      setSaving(false);
    }
  };

  const closeTabsForPrefix = (prefix: string) => {
    tree.forEach((group) => {
      group.contents.forEach((content) => {
        content.notes.forEach((note) => {
          if (note.href.startsWith(prefix)) closeTab(note.id);
        });
      });
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!action || isDeleteAction(action) || !validate()) return;
    setSaving(true);

    try {
      const name = form.name.trim();
      if (action.type === "create-group") {
        const payload: CreateStudyGroupRequest = { name };
        const created = await api.post<StudyGroup>("/study-groups", payload);
        reload();
        router.push(`/study-groups/${created.id}/contents`);
      } else if (action.type === "rename-group") {
        await api.patch(`/study-groups/${action.group.id}`, { name, description: action.group.description } satisfies CreateStudyGroupRequest);
      } else if (action.type === "create-content") {
        const payload: CreateContentRequest = { title: name, studyGroupId: action.group.id };
        const created = await api.post<Content>("/contents", payload);
        reload();
        router.push(`/study-groups/${action.group.id}/contents/${created.id}`);
      } else if (action.type === "rename-content") {
        await api.patch(`/contents/${action.content.id}`, {
          title: name,
          description: action.content.description,
          studyGroupId: action.group.id,
        } satisfies CreateContentRequest);
      } else if (action.type === "create-note") {
        const payload: CreateNoteRequest = {
          name,
          contentId: action.content.id,
        };
        const created = await api.post<Note>("/notes", payload);
        reload();
        await openNote(created, action.group.id);
        router.push(`/study-groups/${action.group.id}/contents/${action.content.id}/notes/${created.id}`);
      } else if (action.type === "rename-note") {
        const fileName = name.endsWith(".md") ? name : `${name}.md`;
        const payload: UpdateNoteRequest = {
          title: name.replace(/\.md$/i, ""),
          fileName,
          contentId: action.content.id,
          markdownContent: action.note.note.markdownContent,
        };
        const updated = await api.patch<Note>(`/notes/${action.note.id}`, payload);
        await openNote(updated, action.group.id);
      }
      setAction(null);
      setForm(emptyForm);
      reload();
      notify("Alterações salvas", "success");
    } catch (error) {
      if (error instanceof ApiRequestError && error.issues) {
        const apiErrors: FormErrors = {};
        Object.entries(error.issues).forEach(([key, messages]) => {
          if (key === "title" || key === "name" || key === "fileName") apiErrors.name = messages[0];
        });
        setErrors(apiErrors);
      }
      notify(error instanceof ApiRequestError ? error.message : "Não foi possível salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const openFileNote = (group: (typeof tree)[number], note: (typeof tree)[number]["contents"][number]["notes"][number]) => {
    void openNote(note.note, group.id);
    router.push(note.href);
  };

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2 px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Arquivos</span>
        <button
          type="button"
          aria-label="Novo grupo"
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          onClick={() => openAction({ type: "create-group" })}
        >
          <Plus size={14} aria-hidden />
        </button>
      </div>
      {loading ? (
        <p className="px-3 py-2 text-xs text-neutral-500">Carregando arquivos...</p>
      ) : tree.length ? (
        <div className="space-y-0.5">
          {tree.map((group) => (
            <FileTreeNode
              key={group.id}
              group={group}
              expandedKeys={expandedKeys}
              onToggle={toggle}
              onOpenNote={openFileNote}
              onAction={openAction}
            />
          ))}
        </div>
      ) : (
        <EmptyState className="m-1 p-3" title="Sem arquivos" description="Crie um grupo para começar." />
      )}

      <Dialog
        open={Boolean(action) && !isDeleteAction(action!)}
        onClose={() => setAction(null)}
        title={action ? actionTitle(action) : ""}
      >
        {action && !isDeleteAction(action) ? (
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <Field label={nameLabel(action)} htmlFor="file-tree-name" error={errors.name}>
              <Input id="file-tree-name" value={form.name} invalid={Boolean(errors.name)} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAction(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={saving}>
                Salvar
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={Boolean(action) && isDeleteAction(action!)}
        title={action ? actionTitle(action) : ""}
        description="Este item e seus arquivos serão ocultados."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={() => void handleDelete()}
        onClose={() => setAction(null)}
      />
    </div>
  );
}
