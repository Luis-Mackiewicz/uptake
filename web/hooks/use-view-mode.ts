"use client";

import { useCallback, useSyncExternalStore } from "react";

export type ViewMode = "table" | "cards";

const subscriptions = new Set<() => void>();
const serverViewMode: ViewMode = "table";

function readViewMode(key: string): ViewMode {
  if (typeof window === "undefined") return serverViewMode;
  const saved = window.localStorage.getItem(key);
  return saved === "cards" ? "cards" : "table";
}

function subscribe(listener: () => void) {
  subscriptions.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    subscriptions.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

function getServerSnapshot() {
  return serverViewMode;
}

export function useViewMode(key: string) {
  const getSnapshot = useCallback(() => readViewMode(key), [key]);
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setView = useCallback(
    (next: ViewMode) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, next);
      subscriptions.forEach((listener) => listener());
    },
    [key],
  );

  return [view, setView] as const;
}
