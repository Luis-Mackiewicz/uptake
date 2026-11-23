import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Nome é obrigatório")
  .max(120, "Nome deve ter no máximo 120 caracteres");

const prioritySchema = z.coerce
  .number()
  .int()
  .min(1, "Prioridade inválida")
  .max(3, "Prioridade inválida");

const contentIdsSchema = z
  .array(z.coerce.number().int().positive())
  .max(50, "Um ciclo pode ter no máximo 50 conteúdos")
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Conteúdos não podem se repetir",
  )
  .default([]);

export const createStudyCycleSchema = z
  .object({
    name: nameSchema,
    active: z.boolean().default(true),
    studyGroupId: z.coerce.number().int().positive(),
    priority: prioritySchema.default(2),
    contentIds: contentIdsSchema,
  })
  .strict();

export const updateStudyCycleSchema = z
  .object({
    name: nameSchema,
    active: z.boolean(),
    studyGroupId: z.coerce.number().int().positive(),
    priority: prioritySchema,
    contentIds: contentIdsSchema,
  })
  .strict();

export const reorderStudyCyclesSchema = z
  .object({
    priority: prioritySchema,
    ids: z
      .array(z.coerce.number().int().positive())
      .max(100, "Muitos ciclos enviados")
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Ciclos não podem se repetir",
      ),
  })
  .strict();

export const examCycleParamSchema = z
  .object({
    examId: z.coerce.number().int().positive(),
    cycleId: z.coerce.number().int().positive(),
  })
  .strict();

export const examIdParamSchema = z
  .object({ examId: z.coerce.number().int().positive() })
  .strict();

export type CreateStudyCycleData = z.infer<typeof createStudyCycleSchema>;
export type UpdateStudyCycleData = z.infer<typeof updateStudyCycleSchema>;
export type ReorderStudyCyclesData = z.infer<typeof reorderStudyCyclesSchema>;
