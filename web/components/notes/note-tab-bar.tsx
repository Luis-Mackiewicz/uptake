"use client";

import { Tabs } from "@/components/ui/tabs";
import type { NoteTab } from "@/hooks/use-note-tabs";

interface NoteTabBarProps {
  tabs: NoteTab[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onRequestClose: (id: number) => void;
}

export function NoteTabBar({ tabs, activeId, onSelect, onRequestClose }: NoteTabBarProps) {
  return (
    <Tabs
      items={tabs.map((tab) => ({
        id: String(tab.id),
        label: tab.title,
        hint: tab.fileName,
        trailing:
          tab.draft !== tab.savedContent ? (
            <span className="text-xs text-amber-600" title="Alterações não salvas">
              ●
            </span>
          ) : undefined,
      }))}
      value={activeId === null ? null : String(activeId)}
      onChange={(id) => onSelect(Number(id))}
      onClose={(id) => onRequestClose(Number(id))}
    />
  );
}
