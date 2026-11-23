import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

export type MarkdownCommand =
  | "heading"
  | "bold"
  | "italic"
  | "code"
  | "link"
  | "bullet"
  | "ordered"
  | "quote";

type WrapRule = { before: string; after: string; placeholder: string };

const wrapRules: Partial<Record<MarkdownCommand, WrapRule>> = {
  bold: { before: "**", after: "**", placeholder: "negrito" },
  italic: { before: "*", after: "*", placeholder: "itálico" },
  code: { before: "`", after: "`", placeholder: "código" },
  link: { before: "[", after: "](url)", placeholder: "texto" },
};

type PrefixRule = {
  test: RegExp;
  add: (index: number) => string;
};

const prefixRules: Partial<Record<MarkdownCommand, PrefixRule>> = {
  heading: { test: /^#{1,6}\s/, add: () => "# " },
  bullet: { test: /^[-*+]\s/, add: () => "- " },
  ordered: { test: /^\d+\.\s/, add: (index) => `${index + 1}. ` },
  quote: { test: /^>\s?/, add: () => "> " },
};

export function applyMarkdownCommand(view: EditorView, command: MarkdownCommand) {
  const wrapRule = wrapRules[command];
  if (wrapRule) {
    wrapSelection(view, wrapRule);
    return;
  }

  const prefixRule = prefixRules[command];
  if (prefixRule) {
    togglePrefix(view, prefixRule);
  }
}

function wrapSelection(view: EditorView, rule: WrapRule) {
  const { state } = view;
  const transaction = state.changeByRange((range) => {
    const selected = state.sliceDoc(range.from, range.to);
    const value = selected || rule.placeholder;
    const insert = `${rule.before}${value}${rule.after}`;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(
        range.from + rule.before.length,
        range.from + rule.before.length + value.length,
      ),
    };
  });

  view.dispatch(state.update(transaction, { scrollIntoView: true }));
  view.focus();
}

function togglePrefix(view: EditorView, rule: PrefixRule) {
  const { state } = view;
  const transaction = state.changeByRange((range) => {
    const firstLine = state.doc.lineAt(range.from).number;
    const lastLine = state.doc.lineAt(range.to).number;
    const changes = [];

    for (let lineNumber = firstLine; lineNumber <= lastLine; lineNumber += 1) {
      const line = state.doc.line(lineNumber);
      const match = line.text.match(rule.test);
      if (match) {
        changes.push({
          from: line.from,
          to: line.from + match[0].length,
        });
      } else {
        changes.push({
          from: line.from,
          insert: rule.add(lineNumber - firstLine),
        });
      }
    }

    return {
      changes,
      range: EditorSelection.range(range.from, range.to),
    };
  });

  view.dispatch(state.update(transaction, { scrollIntoView: true }));
  view.focus();
}
