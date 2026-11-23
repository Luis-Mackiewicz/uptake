"use client";

import { useState } from "react";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteTabBar } from "@/components/notes/note-tab-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
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
  onSelect: (id: number) => void;
  onRequestClose: (id: number) => void;
  onDraftChange: (id: number, value: string) => void;
  onSave: () => void;
}

export function NoteWorkspace({ tabs, activeId, onSelect, onRequestClose, onDraftChange, onSave }: NoteWorkspaceProps) {
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
    <Card className="flex min-h-[560px] flex-col p-0">
      {tabs.length ? <NoteTabBar tabs={tabs} activeId={activeId} onSelect={onSelect} onRequestClose={onRequestClose} /> : null}
      {active && status ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-900">{active.title}</p>
              <p className="truncate font-mono text-xs text-neutral-500">{active.fileName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                aria-label="Modo de visualização"
                value={mode}
                onChange={(event) => setMode(event.target.value as EditorMode)}
                className="h-8 w-28 text-xs"
              >
                {modes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
              <Badge tone={status.tone}>{status.label}</Badge>
              <Button size="sm" onClick={onSave} disabled={!dirty || active.status === "saving" || active.status === "loading"}>
                Salvar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onRequestClose(active.id)}>
                Fechar
              </Button>
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
