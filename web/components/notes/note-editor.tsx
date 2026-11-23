"use client";

import dynamic from "next/dynamic";

const NoteCodeMirror = dynamic(() => import("./note-code-mirror"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-neutral-400">Carregando editor...</div>,
});

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function NoteEditor({ value, onChange }: NoteEditorProps) {
  return (
    <div className="h-full min-h-0 bg-white">
      <NoteCodeMirror value={value} onChange={onChange} />
    </div>
  );
}
