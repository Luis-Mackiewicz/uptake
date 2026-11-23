"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useToast } from "@/components/ui/toast";
import { playPomodoroChime, unlockPomodoroChime } from "./use-pomodoro-chime";

export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

interface PomodoroContextValue {
  phase: PomodoroPhase;
  running: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  focusCount: number;
  settings: PomodoroSettings;
  start: () => void;
  skip: () => void;
  reset: () => void;
  updateSettings: (settings: PomodoroSettings) => void;
}

export const pomodoroPhaseLabels: Record<PomodoroPhase, string> = {
  focus: "Foco",
  shortBreak: "Pausa curta",
  longBreak: "Pausa longa",
};

const defaultSettings: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
};

const longBreakEvery = 4;
const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function durationFor(phase: PomodoroPhase, settings: PomodoroSettings) {
  if (phase === "focus") return settings.focusMinutes * 60;
  if (phase === "shortBreak") return settings.shortBreakMinutes * 60;
  return settings.longBreakMinutes * 60;
}

function nextState(
  phase: PomodoroPhase,
  focusCount: number,
  settings: PomodoroSettings,
  completedFocus: boolean,
) {
  if (phase === "focus") {
    const nextCount = completedFocus ? focusCount + 1 : focusCount;
    const nextPhase: PomodoroPhase =
      completedFocus && nextCount % longBreakEvery === 0 ? "longBreak" : "shortBreak";

    return {
      phase: nextPhase,
      focusCount: nextCount,
      remainingSeconds: durationFor(nextPhase, settings),
    };
  }

  return {
    phase: "focus" as const,
    focusCount: phase === "longBreak" ? 0 : focusCount,
    remainingSeconds: durationFor("focus", settings),
  };
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [phase, setPhase] = useState<PomodoroPhase>("focus");
  const [running, setRunning] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(durationFor("focus", defaultSettings));
  const endsAtRef = useRef<number | null>(null);
  const completionRef = useRef<string | null>(null);

  const signal = useCallback(
    (message: string) => {
      playPomodoroChime();
      notify(message, "success");
    },
    [notify],
  );

  const complete = useCallback(() => {
    if (!completionRef.current) return;

    const next = nextState(phase, focusCount, settings, true);
    const message =
      phase === "focus"
        ? next.phase === "longBreak"
          ? "4 focos concluídos — pausa longa"
          : "Foco concluído — pausa curta"
        : phase === "longBreak"
          ? "Pausa longa concluída — pronto para foco"
          : "Pausa curta concluída — pronto para foco";

    completionRef.current = null;
    endsAtRef.current = null;
    setRunning(false);
    setPhase(next.phase);
    setFocusCount(next.focusCount);
    setRemainingSeconds(next.remainingSeconds);
    signal(message);
  }, [focusCount, phase, settings, signal]);

  useEffect(() => {
    if (!running || endsAtRef.current === null) return;

    const completionKey = completionRef.current;
    const tick = () => {
      if (endsAtRef.current === null) return;

      const nextRemaining = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
      setRemainingSeconds(nextRemaining);

      if (nextRemaining === 0 && completionKey && completionRef.current === completionKey) {
        complete();
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [complete, running]);

  const start = useCallback(() => {
    if (running || remainingSeconds <= 0) return;

    unlockPomodoroChime();
    const endsAt = Date.now() + remainingSeconds * 1000;
    endsAtRef.current = endsAt;
    completionRef.current = `${phase}-${endsAt}`;
    setRunning(true);
  }, [phase, remainingSeconds, running]);

  const skip = useCallback(() => {
    endsAtRef.current = null;
    completionRef.current = null;
    setRunning(false);

    const next = nextState(phase, focusCount, settings, false);
    setPhase(next.phase);
    setFocusCount(next.focusCount);
    setRemainingSeconds(next.remainingSeconds);
  }, [focusCount, phase, settings]);

  const reset = useCallback(() => {
    endsAtRef.current = null;
    completionRef.current = null;
    setRunning(false);
    setRemainingSeconds(durationFor(phase, settings));
  }, [phase, settings]);

  const updateSettings = useCallback((next: PomodoroSettings) => {
    endsAtRef.current = null;
    completionRef.current = null;
    setRunning(false);
    setSettings(next);
    setPhase("focus");
    setFocusCount(0);
    setRemainingSeconds(durationFor("focus", next));
  }, []);

  const value = useMemo(
    () => ({
      phase,
      running,
      remainingSeconds,
      totalSeconds: durationFor(phase, settings),
      focusCount,
      settings,
      start,
      skip,
      reset,
      updateSettings,
    }),
    [focusCount, phase, remainingSeconds, reset, running, settings, skip, start, updateSettings],
  );

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) throw new Error("usePomodoro must be used inside PomodoroProvider");
  return context;
}
