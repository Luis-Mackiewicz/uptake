"use client";

import { useState } from "react";
import { Pause, Pencil, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { pomodoroPhaseLimits, usePomodoro } from "./pomodoro-provider";
import type { PomodoroPhase } from "./pomodoro-provider";

const phases: { id: PomodoroPhase; label: string }[] = [
  { id: "focus", label: "Pomodoro" },
  { id: "shortBreak", label: "Break" },
  { id: "longBreak", label: "Long break" },
];

export function formatPomodoroClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function parsePomodoroClock(value: string) {
  const parts = value.trim().split(":");
  if (parts.some((part) => part.trim() === "")) return null;

  const numbers = parts.map(Number);
  if (numbers.some((part) => !Number.isInteger(part) || part < 0)) return null;
  if (numbers.length === 1) return numbers[0] * 60;
  if (numbers.slice(1).some((part) => part > 59)) return null;

  return numbers.reduce((total, part) => total * 60 + part, 0);
}

export function PomodoroWidget() {
  const {
    phase,
    running,
    remainingSeconds,
    totalSeconds,
    focusCount,
    start,
    pause,
    selectPhase,
    setPhaseDuration,
  } = usePomodoro();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const completed = focusCount % 4 === 0 && focusCount > 0 ? 4 : focusCount % 4;

  const beginEditing = () => {
    setDraft(formatPomodoroClock(remainingSeconds));
    setEditing(true);
  };

  const commitEditing = () => {
    const seconds = parsePomodoroClock(draft);
    const maxSeconds = pomodoroPhaseLimits[phase] * 60;
    if (seconds !== null && seconds >= 1 && seconds <= maxSeconds) {
      setPhaseDuration(phase, seconds);
    }
    setEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1" role="group" aria-label="Modo do timer">
        {phases.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={phase === item.id}
            onClick={() => selectPhase(item.id)}
            className={cn(
              "h-7 rounded-md px-1 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600",
              phase === item.id
                ? "bg-white text-lime-900 shadow-sm"
                : "text-neutral-600 hover:bg-white/70 hover:text-neutral-900",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-0.5">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitEditing}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitEditing();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setEditing(false);
              }
            }}
            inputMode="numeric"
            aria-label="Editar tempo"
            className="w-[8ch] border-b border-lime-600 bg-transparent text-center font-display text-4xl tracking-widest text-lime-700 tabular-nums outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={beginEditing}
            title="Editar tempo"
            className="group flex items-center gap-2 rounded-md px-2 py-0.5 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-600"
          >
            <span className="font-display text-4xl tracking-widest text-lime-700 tabular-nums">
              {formatPomodoroClock(remainingSeconds)}
            </span>
            <Pencil size={14} className="text-neutral-400 transition group-hover:text-neutral-700" aria-hidden />
          </button>
        )}
        <span className="text-[11px] text-neutral-500">{running ? "Rodando" : "Pronto"}</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-lime-500 transition-[width]"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      <Button
        className="w-full"
        onClick={running ? pause : start}
        disabled={!running && remainingSeconds <= 0}
      >
        {running ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        {running ? "Pausar" : "Start"}
      </Button>

      <div className="flex items-center justify-center gap-1.5" role="img" aria-label={`${completed} de 4 focos concluídos`}>
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            className={cn("size-2 rounded-full", index < completed ? "bg-lime-500" : "bg-neutral-200")}
          />
        ))}
      </div>
    </div>
  );
}
