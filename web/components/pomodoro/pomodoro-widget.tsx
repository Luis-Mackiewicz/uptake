"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { pomodoroPhaseLabels, usePomodoro } from "./pomodoro-provider";
import type { PomodoroPhase } from "./pomodoro-provider";
import { PomodoroSettingsDialog } from "./pomodoro-settings-dialog";

const badgeTones: Record<PomodoroPhase, "lime" | "success" | "warning"> = {
  focus: "lime",
  shortBreak: "success",
  longBreak: "warning",
};

export function formatPomodoroClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function PomodoroWidget() {
  const { phase, running, remainingSeconds, totalSeconds, focusCount, start, skip, reset } = usePomodoro();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const completed = phase === "focus" ? focusCount % 4 : focusCount % 4 === 0 ? 4 : focusCount % 4;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg tracking-wide text-neutral-900">Pomodoro</p>
          <p className="text-xs text-neutral-500">{pomodoroPhaseLabels[phase]}</p>
        </div>
        <Badge tone={badgeTones[phase]} className="shrink-0">
          {running ? "Rodando" : "Pronto"}
        </Badge>
      </div>

      <p className="font-display text-4xl tracking-widest text-lime-700 tabular-nums" aria-live="off">
        {formatPomodoroClock(remainingSeconds)}
      </p>

      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-lime-500 transition-[width]" style={{ width: `${Math.min(100, progress)}%` }} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5" role="img" aria-label={`${completed} de 4 focos concluídos`}>
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={cn("size-2 rounded-full", index < completed ? "bg-lime-500" : "bg-neutral-200")}
            />
          ))}
        </div>
        <span className="text-[11px] text-neutral-500">{focusCount % 4}/4</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <Button size="sm" onClick={start} disabled={running}>
          Iniciar
        </Button>
        <Button size="sm" variant="secondary" onClick={skip}>
          Pular
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          Zerar
        </Button>
      </div>

      <Button variant="ghost" size="sm" className="w-full" onClick={() => setSettingsOpen(true)}>
        Ajustar tempos
      </Button>

      {settingsOpen ? <PomodoroSettingsDialog onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  );
}
