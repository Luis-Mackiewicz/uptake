"use client";

import {
  Bold,
  Code2,
  Heading1,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import type { MarkdownCommand } from "./markdown-commands";

interface NoteMarkdownToolbarProps {
  onCommand: (command: MarkdownCommand) => void;
}

const groups: Array<Array<{ command: MarkdownCommand; label: string; icon: typeof Bold }>> = [
  [
    { command: "heading", label: "Título", icon: Heading1 },
    { command: "bold", label: "Negrito", icon: Bold },
    { command: "italic", label: "Itálico", icon: Italic },
  ],
  [
    { command: "code", label: "Código inline", icon: Code2 },
    { command: "link", label: "Link", icon: Link2 },
  ],
  [
    { command: "bullet", label: "Lista", icon: List },
    { command: "ordered", label: "Lista numerada", icon: ListOrdered },
    { command: "quote", label: "Citação", icon: Quote },
  ],
];

export function NoteMarkdownToolbar({ onCommand }: NoteMarkdownToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
      {groups.map((group, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 ? <span className="mx-1 h-5 w-px bg-neutral-200" aria-hidden /> : null}
          {group.map(({ command, label, icon: Icon }) => (
            <button
              key={command}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => onCommand(command)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 transition hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
            >
              <Icon size={16} aria-hidden />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
