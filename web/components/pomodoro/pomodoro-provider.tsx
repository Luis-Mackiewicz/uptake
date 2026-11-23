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
  pause: () => void;
  selectPhase: (phase: PomodoroPhase) => void;
  setPhaseDuration: (phase: PomodoroPhase, seconds: number) => void;
  skip: () => void;
  reset: () => void;
  updateSettings: (settings: PomodoroSettings) => void;
}

export const pomodoroPhaseLimits: Record<PomodoroPhase, number> = {
  focus: 180,
  shortBreak: 60,
  longBreak: 120,
};

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

function durationFor(
  phase: PomodoroPhase,
  settings: PomodoroSettings,
  customSeconds: Partial<Record<PomodoroPhase, number>> = {},
) {
  if (customSeconds[phase] !== undefined) return customSeconds[phase] ?? 0;
  if (phase === "focus") return settings.focusMinutes * 60;
  if (phase === "shortBreak") return settings.shortBreakMinutes * 60;
  return settings.longBreakMinutes * 60;
}

function nextState(
  phase: PomodoroPhase,
  focusCount: number,
  settings: PomodoroSettings,
  customSeconds: Partial<Record<PomodoroPhase, number>>,
  completedFocus: boolean,
) {
  if (phase === "focus") {
    const nextCount = completedFocus ? focusCount + 1 : focusCount;
    const nextPhase: PomodoroPhase =
      completedFocus && nextCount % longBreakEvery === 0 ? "longBreak" : "shortBreak";

    return {
      phase: nextPhase,
      focusCount: nextCount,
      remainingSeconds: durationFor(nextPhase, settings, customSeconds),
    };
  }

  return {
    phase: "focus" as const,
    focusCount: phase === "longBreak" ? 0 : focusCount,
    remainingSeconds: durationFor("focus", settings, customSeconds),
  };
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [customSeconds, setCustomSeconds] = useState<Partial<Record<PomodoroPhase, number>>>({});
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

    const next = nextState(phase, focusCount, settings, customSeconds, true);
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
  }, [customSeconds, focusCount, phase, settings, signal]);

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

  const pause = useCallback(() => {
    if (!running) return;

    const remaining =
      endsAtRef.current === null
        ? remainingSeconds
        : Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
    endsAtRef.current = null;
    completionRef.current = null;
    setRemainingSeconds(remaining);
    setRunning(false);
  }, [remainingSeconds, running]);

  const selectPhase = useCallback(
    (target: PomodoroPhase) => {
      endsAtRef.current = null;
      completionRef.current = null;
      setRunning(false);
      setPhase(target);
      setRemainingSeconds(durationFor(target, settings, customSeconds));
    },
    [customSeconds, settings],
  );

  const setPhaseDuration = useCallback(
    (target: PomodoroPhase, seconds: number) => {
      endsAtRef.current = null;
      completionRef.current = null;
      setRunning(false);
      setCustomSeconds((current) => ({ ...current, [target]: seconds }));
      if (target === phase) setRemainingSeconds(seconds);
    },
    [phase],
  );

  const skip = useCallback(() => {
    endsAtRef.current = null;
    completionRef.current = null;
    setRunning(false);

    const next = nextState(phase, focusCount, settings, customSeconds, false);
    setPhase(next.phase);
    setFocusCount(next.focusCount);
    setRemainingSeconds(next.remainingSeconds);
  }, [customSeconds, focusCount, phase, settings]);

  const reset = useCallback(() => {
    endsAtRef.current = null;
    completionRef.current = null;
    setRunning(false);
    setRemainingSeconds(durationFor(phase, settings, customSeconds));
  }, [customSeconds, phase, settings]);

  const updateSettings = useCallback((next: PomodoroSettings) => {
    endsAtRef.current = null;
    completionRef.current = null;
    setRunning(false);
    setSettings(next);
    setCustomSeconds({});
    setPhase("focus");
    setFocusCount(0);
    setRemainingSeconds(durationFor("focus", next));
  }, []);

  const value = useMemo(
    () => ({
      phase,
      running,
      remainingSeconds,
      totalSeconds: durationFor(phase, settings, customSeconds),
      focusCount,
      settings,
      start,
      pause,
      selectPhase,
      setPhaseDuration,
      skip,
      reset,
      updateSettings,
    }),
    [
      customSeconds,
      focusCount,
      pause,
      phase,
      remainingSeconds,
      reset,
      running,
      selectPhase,
      setPhaseDuration,
      settings,
      skip,
      start,
      updateSettings,
    ],
  );

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) throw new Error("usePomodoro must be used inside PomodoroProvider");
  return context;
}
