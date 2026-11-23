import { z } from "zod";

const examDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Data inválida")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const noteIdsSchema = z
  .array(z.coerce.number().int().positive())
  .max(50, "Uma prova pode ter no máximo 50 notas")
  .refine((ids) => new Set(ids).size === ids.length, "Notas não podem se repetir")
  .default([]);

export const createExamSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Título é obrigatório")
      .max(200, "Título deve ter no máximo 200 caracteres"),
    description: z
      .string()
      .trim()
      .max(500, "Descrição deve ter no máximo 500 caracteres")
      .nullable()
      .optional(),
    examDate: examDateSchema,
    location: z
      .string()
      .trim()
      .max(255, "Local deve ter no máximo 255 caracteres")
      .nullable()
      .optional(),
    studyGroupId: z.coerce.number().int().positive().nullable().optional(),
    noteIds: noteIdsSchema,
  })
  .strict();

export const updateExamSchema = createExamSchema;

export type CreateExamData = z.infer<typeof createExamSchema>;
export type UpdateExamData = z.infer<typeof updateExamSchema>;
