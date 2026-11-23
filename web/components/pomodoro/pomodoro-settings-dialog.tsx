"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { PomodoroSettings } from "./pomodoro-provider";
import { usePomodoro } from "./pomodoro-provider";

type SettingsForm = Record<keyof PomodoroSettings, string>;
type FormErrors = Partial<Record<keyof PomodoroSettings, string>>;

const limits: Record<keyof PomodoroSettings, number> = {
  focusMinutes: 180,
  shortBreakMinutes: 60,
  longBreakMinutes: 120,
};

interface PomodoroSettingsDialogProps {
  onClose: () => void;
}

export function PomodoroSettingsDialog({ onClose }: PomodoroSettingsDialogProps) {
  const { settings, updateSettings } = usePomodoro();
  const [form, setForm] = useState<SettingsForm>({
    focusMinutes: String(settings.focusMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const nextErrors: FormErrors = {};

    (Object.keys(limits) as Array<keyof PomodoroSettings>).forEach((key) => {
      const value = Number(form[key]);
      if (!Number.isInteger(value) || value < 1 || value > limits[key]) {
        nextErrors[key] = `Use de 1 a ${limits[key]} minutos`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    updateSettings({
      focusMinutes: Number(form.focusMinutes),
      shortBreakMinutes: Number(form.shortBreakMinutes),
      longBreakMinutes: Number(form.longBreakMinutes),
    });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title="Ajustar tempos" description="Pausa longa a cada 4 focos concluídos.">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Foco (min)" htmlFor="pomodoro-focus" error={errors.focusMinutes}>
            <Input
              id="pomodoro-focus"
              type="number"
              min={1}
              max={limits.focusMinutes}
              value={form.focusMinutes}
              invalid={Boolean(errors.focusMinutes)}
              onChange={(event) => setForm({ ...form, focusMinutes: event.target.value })}
            />
          </Field>
          <Field label="Pausa curta (min)" htmlFor="pomodoro-short-break" error={errors.shortBreakMinutes}>
            <Input
              id="pomodoro-short-break"
              type="number"
              min={1}
              max={limits.shortBreakMinutes}
              value={form.shortBreakMinutes}
              invalid={Boolean(errors.shortBreakMinutes)}
              onChange={(event) => setForm({ ...form, shortBreakMinutes: event.target.value })}
            />
          </Field>
          <Field label="Pausa longa (min)" htmlFor="pomodoro-long-break" error={errors.longBreakMinutes}>
            <Input
              id="pomodoro-long-break"
              type="number"
              min={1}
              max={limits.longBreakMinutes}
              value={form.longBreakMinutes}
              invalid={Boolean(errors.longBreakMinutes)}
              onChange={(event) => setForm({ ...form, longBreakMinutes: event.target.value })}
            />
          </Field>
        </div>
        <p className="text-xs text-neutral-500">Alterar os tempos reinicia o ciclo atual.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Dialog>
  );
}
