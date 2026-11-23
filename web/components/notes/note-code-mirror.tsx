"use client";

import { useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView } from "@codemirror/view";
import { applyMarkdownCommand, type MarkdownCommand } from "./markdown-commands";
import { NoteMarkdownToolbar } from "./note-markdown-toolbar";

const extensions = [
  markdown({ base: markdownLanguage, codeLanguages: languages }),
  EditorView.lineWrapping,
  EditorView.theme({
    "&": {
      height: "100%",
      backgroundColor: "#ffffff",
      color: "#171717",
      fontSize: "13px",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-scroller": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      lineHeight: "1.6",
    },
    ".cm-content": {
      padding: "16px 0",
      caretColor: "#65a30d",
    },
    ".cm-gutters": {
      backgroundColor: "#fafafa",
      color: "#a3a3a3",
      borderRight: "1px solid #e5e5e5",
    },
    ".cm-activeLine": {
      backgroundColor: "#f7fee7",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#ecfccb",
      color: "#3f6212",
    },
    ".cm-cursor": {
      borderLeftColor: "#65a30d",
    },
  }),
];

interface NoteCodeMirrorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NoteCodeMirror({ value, onChange }: NoteCodeMirrorProps) {
  const viewRef = useRef<EditorView | null>(null);

  const handleCommand = (command: MarkdownCommand) => {
    if (!viewRef.current) return;
    applyMarkdownCommand(viewRef.current, command);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <NoteMarkdownToolbar onCommand={handleCommand} />
      <div className="min-h-0 flex-1">
        <CodeMirror
          value={value}
          height="100%"
          className="h-full"
          theme="light"
          placeholder="# Título da nota"
          extensions={extensions}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, autocompletion: true }}
          onChange={(nextValue) => onChange(nextValue)}
          onCreateEditor={(view) => {
            viewRef.current = view;
          }}
        />
      </div>
    </div>
  );
}
