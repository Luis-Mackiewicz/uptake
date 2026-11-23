import { z } from "zod";

export const createPomodoroSessionSchema = z
  .object({
    contentId: z.coerce.number().int().positive().nullable().optional(),
    focusMinutes: z.coerce
      .number()
      .int()
      .min(1, "Foco deve ter no mínimo 1 minuto")
      .max(180, "Foco deve ter no máximo 180 minutos")
      .default(25),
    breakMinutes: z.coerce
      .number()
      .int()
      .min(0, "Pausa não pode ser negativa")
      .max(60, "Pausa deve ter no máximo 60 minutos")
      .default(5),
  })
  .strict();

export type CreatePomodoroSessionData = z.infer<
  typeof createPomodoroSessionSchema
>;
