"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  MoreHorizontal,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import type { FileTreeContent, FileTreeGroup, FileTreeNote } from "./file-tree-provider";
import type { FileTreeAction } from "./file-tree-types";

interface FileTreeNodeProps {
  group: FileTreeGroup;
  content?: FileTreeContent;
  note?: FileTreeNote;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  onOpenNote: (group: FileTreeGroup, note: FileTreeNote) => void;
  onAction: (action: FileTreeAction) => void;
}

export function FileTreeNode({
  group,
  content,
  note,
  expandedKeys,
  onToggle,
  onOpenNote,
  onAction,
}: FileTreeNodeProps) {
  const pathname = usePathname();
  const key = note ? `note:${note.id}` : content ? `content:${content.id}` : `group:${group.id}`;
  const expanded = expandedKeys.has(key);
  const hasChildren = !note;
  const href = note?.href ?? content?.href ?? group.href;
  const active = pathname === href || (note ? false : pathname.startsWith(`${href}/`));
  const label = note?.fileName ?? content?.title ?? group.name;
  const depth = note ? 2 : content ? 1 : 0;

  const rowClass = cn(
    "flex w-full items-center gap-1 rounded-md py-1.5 pr-1 text-left text-sm transition",
    active ? "bg-lime-100 text-lime-950" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
  );

  return (
    <div>
      <div className={rowClass} style={{ paddingLeft: `${0.25 + depth * 0.75}rem` }}>
        {hasChildren ? (
          <button
            type="button"
            aria-label={`${expanded ? "Recolher" : "Expandir"} ${label}`}
            aria-expanded={expanded}
            className="flex h-6 w-5 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
            onClick={() => onToggle(key)}
          >
            <ChevronRight size={14} className={cn("transition", expanded && "rotate-90")} aria-hidden />
          </button>
        ) : (
          <span className="flex h-6 w-5 shrink-0 items-center justify-center text-neutral-300" aria-hidden>
            <FileText size={13} />
          </span>
        )}

        {note ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2"
            onClick={() => onOpenNote(group, note)}
          >
            <span className="truncate font-mono text-xs">{note.fileName}</span>
          </button>
        ) : (
          <Link href={href} className="flex min-w-0 flex-1 items-center gap-2">
            {content ? (
              <Folder size={14} className="shrink-0 text-lime-700" aria-hidden />
            ) : expanded ? (
              <FolderOpen size={14} className="shrink-0 text-lime-700" aria-hidden />
            ) : (
              <Folder size={14} className="shrink-0 text-lime-700" aria-hidden />
            )}
            <span className="truncate">{label}</span>
          </Link>
        )}

        <DropdownMenu label={`Ações de ${label}`} trigger={<MoreHorizontal size={14} aria-hidden />} align="right">
          {group && !content && !note ? (
            <DropdownMenuItem icon={<Plus size={14} aria-hidden />} onClick={() => onAction({ type: "create-content", group })}>
              Novo conteúdo
            </DropdownMenuItem>
          ) : null}
          {content && !note ? (
            <DropdownMenuItem icon={<NotebookPen size={14} aria-hidden />} onClick={() => onAction({ type: "create-note", group, content })}>
              Nova nota
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem icon={<Pencil size={14} aria-hidden />} onClick={() => onAction(note ? { type: "rename-note", group, content: content!, note } : content ? { type: "rename-content", group, content } : { type: "rename-group", group })}>
            {content && !note ? "Editar conteúdo" : !content && !note ? "Editar grupo" : "Renomear"}
          </DropdownMenuItem>
          <DropdownMenuItem
            destructive
            icon={<Trash2 size={14} aria-hidden />}
            onClick={() => onAction(note ? { type: "delete-note", group, content: content!, note } : content ? { type: "delete-content", group, content } : { type: "delete-group", group })}
          >
            Excluir
          </DropdownMenuItem>
        </DropdownMenu>
      </div>

      {expanded && !note ? (
        <div className="space-y-0.5">
          {content
            ? content.notes.map((item) => (
                <FileTreeNode
                  key={`note-${item.id}`}
                  group={group}
                  content={content}
                  note={item}
                  expandedKeys={expandedKeys}
                  onToggle={onToggle}
                  onOpenNote={onOpenNote}
                  onAction={onAction}
                />
              ))
            : group.contents.map((item) => (
                <FileTreeNode
                  key={`content-${item.id}`}
                  group={group}
                  content={item}
                  expandedKeys={expandedKeys}
                  onToggle={onToggle}
                  onOpenNote={onOpenNote}
                  onAction={onAction}
                />
              ))}
        </div>
      ) : null}
    </div>
  );
}
