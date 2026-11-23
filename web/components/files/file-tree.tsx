"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api/client";
import { friendlyApiMessage } from "@/lib/api/errors";
import { notifyResourceChanged } from "@/lib/events";
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
import { applyApiIssues, nullableTrimmed } from "@/lib/form";
import { fileTreeSchema } from "@/lib/schemas";
import type { TreeFormValues } from "@/lib/schemas";

const emptyForm: TreeFormValues = { name: "", description: "" };

function isDeleteAction(action: FileTreeAction) {
  return action.type.startsWith("delete-");
}

function isContentAction(action: FileTreeAction) {
  return action.type === "create-content" || action.type === "rename-content";
}

function isGroupAction(action: FileTreeAction) {
  return action.type === "create-group" || action.type === "rename-group";
}

function isCreateNoteAction(action: FileTreeAction) {
  return action.type === "create-note";
}

function actionTitle(action: FileTreeAction) {
  switch (action.type) {
    case "create-group":
      return "Novo grupo";
    case "create-content":
      return "Novo conteúdo";
    case "create-note":
      return "Nova nota";
    case "rename-group":
      return "Editar grupo";
    case "rename-content":
      return "Editar conteúdo";
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
  return action.type.includes("content") ? "Título" : "Nome";
}

function TreePagination({
  label,
  page,
  totalPages,
  total,
  setPage,
}: {
  label: string;
  page: number;
  totalPages: number;
  total: number;
  setPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-1 px-3 py-1 text-[11px] text-neutral-500">
      <span className="truncate">
        {label}: {page}/{totalPages} · {total}
      </span>
      <span className="flex shrink-0 gap-1">
        <button
          type="button"
          className="rounded px-1 py-0.5 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="rounded px-1 py-0.5 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Próxima
        </button>
      </span>
    </div>
  );
}

export function FileTree({ className }: { className?: string }) {
  const { tree, loading, reload, groups, contents, notes } = useFileTree();
  const { openNote, closeTab } = useNoteTabsContext();
  const { notify } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<FileTreeAction | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TreeFormValues>({
    resolver: zodResolver(fileTreeSchema(action?.type ?? "")),
    defaultValues: emptyForm,
  });

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
    if (next.type === "create-group") {
      router.push("/study-groups/new");
      return;
    }
    if (next.type === "rename-group") {
      router.push(`/study-groups/${next.group.id}/edit`);
      return;
    }
    if (next.type === "create-content") {
      router.push(`/study-groups/${next.group.id}/contents/new`);
      return;
    }
    if (next.type === "rename-content") {
      router.push(`/study-groups/${next.group.id}/contents/${next.content.id}/edit`);
      return;
    }

    const existingName =
      next.type === "rename-note"
        ? next.note.fileName
        : next.type === "delete-group"
          ? next.group.name
          : next.type === "delete-content"
            ? next.content.title
            : next.type === "delete-note"
              ? next.note.fileName
              : "";
    setAction(next);
    reset({ name: existingName, description: "" });
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
      notifyResourceChanged();
      setAction(null);
      notify("Item removido", "success");
      if (pathname === targetHref || pathname.startsWith(`${targetHref}/`)) {
        router.push(redirectHref);
      }
    } catch (error) {
      notify(friendlyApiMessage(error, "Não foi possível remover"), "error");
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

  const onSubmit = async (values: TreeFormValues) => {
    if (!action || isDeleteAction(action)) return;
    setSaving(true);

    try {
      const name = values.name;
      const description = nullableTrimmed(values.description);
      if (action.type === "create-group") {
        const payload: CreateStudyGroupRequest = { name, description };
        const created = await api.post<StudyGroup>("/study-groups", payload);
        reload();
        router.push(`/study-groups/${created.id}/contents`);
      } else if (action.type === "rename-group") {
        await api.patch(`/study-groups/${action.group.id}`, { name, description } satisfies CreateStudyGroupRequest);
      } else if (action.type === "create-content") {
        const payload: CreateContentRequest = {
          title: name,
          description,
          studyGroupId: action.group.id,
        };
        const created = await api.post<Content>("/contents", payload);
        reload();
        router.push(`/study-groups/${action.group.id}/contents/${created.id}`);
      } else if (action.type === "rename-content") {
        await api.patch(`/contents/${action.content.id}`, {
          title: name,
          description,
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
      reset(emptyForm);
      reload();
      notifyResourceChanged();
      notify("Alterações salvas", "success");
    } catch (error) {
      applyApiIssues(error, setError, {
        title: "name",
        name: "name",
        fileName: "name",
        description: "description",
      });
      notify(friendlyApiMessage(error, "Não foi possível salvar"), "error");
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
      <TreePagination label="Grupos" {...groups} />
      <TreePagination label="Conteúdos" {...contents} />
      <TreePagination label="Notas" {...notes} />
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
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field
              label={nameLabel(action)}
              htmlFor="file-tree-name"
              error={errors.name?.message}
              hint={isCreateNoteAction(action) ? "O arquivo será criado com a extensão .md." : undefined}
            >
              <Input id="file-tree-name" invalid={Boolean(errors.name)} {...register("name")} />
            </Field>
            {isContentAction(action) || isGroupAction(action) ? (
              <Field label="Descrição" htmlFor="file-tree-description" error={errors.description?.message}>
                <Textarea
                  id="file-tree-description"
                  invalid={Boolean(errors.description)}
                  {...register("description")}
                />
              </Field>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setAction(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={saving || isSubmitting}>
                {isCreateNoteAction(action) ? "Criar" : "Salvar"}
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
