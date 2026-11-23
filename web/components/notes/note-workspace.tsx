"use client";

import { useState } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/breadcrumb";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteTabBar } from "@/components/notes/note-tab-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { NoteTab } from "@/hooks/use-note-tabs";
import { cn } from "@/lib/cn";

type EditorMode = "editor" | "split" | "preview";

const modes: Array<{ value: EditorMode; label: string }> = [
  { value: "editor", label: "Editor" },
  { value: "split", label: "Dividido" },
  { value: "preview", label: "Preview" },
];

interface NoteWorkspaceProps {
  tabs: NoteTab[];
  activeId: number | null;
  breadcrumbs: BreadcrumbItem[];
  onSelect: (id: number) => void;
  onRequestClose: (id: number) => void;
  onDraftChange: (id: number, value: string) => void;
  onSave: () => void;
}

export function NoteWorkspace({
  tabs,
  activeId,
  breadcrumbs,
  onSelect,
  onRequestClose,
  onDraftChange,
  onSave,
}: NoteWorkspaceProps) {
  const [mode, setMode] = useState<EditorMode>("split");
  const active = tabs.find((tab) => tab.id === activeId) ?? null;
  const dirty = active ? active.draft !== active.savedContent : false;

  const status = !active
    ? null
    : active.status === "loading"
      ? { label: "Carregando...", tone: "neutral" as const }
      : active.status === "saving"
        ? { label: "Salvando...", tone: "lime" as const }
        : active.status === "error"
          ? { label: "Erro", tone: "danger" as const }
          : dirty
            ? { label: "Rascunho", tone: "warning" as const }
            : { label: "Salvo", tone: "success" as const };

  return (
    <Card className="flex h-full min-h-0 flex-col p-0">
      {tabs.length ? (
        <NoteTabBar
          tabs={tabs}
          activeId={activeId}
          onSelect={onSelect}
          onRequestClose={onRequestClose}
          onSave={onSave}
          canSave={dirty}
          saving={active?.status === "saving"}
        />
      ) : null}
      {active && status ? (
        <>
          <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-4 py-2">
            <div className="min-w-0 flex-1">
              <Breadcrumb items={breadcrumbs} className="mb-1" />
              <div className="flex min-w-0 items-baseline gap-2">
                <p className="truncate font-medium text-neutral-900">{active.fileName}</p>
                <p className="truncate text-xs text-neutral-500">{active.title}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-md bg-neutral-100 p-0.5" role="group" aria-label="Modo de visualização">
                {modes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={mode === item.value}
                    onClick={() => setMode(item.value)}
                    className={cn(
                      "h-7 rounded px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600",
                      mode === item.value
                        ? "bg-white text-lime-900 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-neutral-500">
                Dica: <kbd className="rounded border border-neutral-300 bg-white px-1 py-0.5 font-sans">Ctrl/⌘</kbd> +{" "}
                <kbd className="rounded border border-neutral-300 bg-white px-1 py-0.5 font-sans">S</kbd> para salvar
              </span>
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
          </div>
          {active.error ? (
            <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {active.error}
            </p>
          ) : null}
          <div
            id={`note-panel-${active.id}`}
            role="tabpanel"
            aria-labelledby={`note-tab-${active.id}`}
            className={cn("grid min-h-0 flex-1", mode === "split" ? "lg:grid-cols-2" : "grid-cols-1")}
          >
            {mode !== "preview" ? (
              <div className={cn("min-h-[280px] lg:min-h-0", mode === "split" && "lg:border-r lg:border-neutral-200")}>
                <NoteEditor value={active.draft} onChange={(value) => onDraftChange(active.id, value)} />
              </div>
            ) : null}
            {mode !== "editor" ? (
              <div className="min-h-[280px] lg:min-h-0">
                <MarkdownPreview content={active.draft} />
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <EmptyState
          className="m-4 flex-1"
          title="Nenhuma nota aberta"
          description="Selecione uma nota na lista para editá-la em uma aba. Você pode abrir várias notas ao mesmo tempo."
        />
      )}
    </Card>
  );
}
