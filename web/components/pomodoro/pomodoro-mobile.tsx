"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { usePomodoro } from "./pomodoro-provider";
import { formatPomodoroClock, PomodoroWidget } from "./pomodoro-widget";

export function PomodoroMobile() {
  const { running, remainingSeconds } = usePomodoro();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="fixed bottom-6 left-6 z-40 h-14 rounded-full px-5 shadow-panel lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir pomodoro"
      >
        <span aria-hidden="true">{running ? "■" : "▶"}</span>
        <span className="font-display text-lg tracking-wider tabular-nums">{formatPomodoroClock(remainingSeconds)}</span>
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Pomodoro" description="Timer de foco e pausas.">
        <PomodoroWidget />
      </Dialog>
    </>
  );
}
