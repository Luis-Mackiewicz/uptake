import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Nome é obrigatório")
  .max(120, "Nome deve ter no máximo 120 caracteres");

export const createStudyCycleSchema = z
  .object({
    name: nameSchema,
    active: z.boolean().default(true),
  })
  .strict();

export const updateStudyCycleSchema = z
  .object({
    name: nameSchema,
    active: z.boolean(),
  })
  .strict();

export type CreateStudyCycleData = z.infer<typeof createStudyCycleSchema>;
export type UpdateStudyCycleData = z.infer<typeof updateStudyCycleSchema>;

const studyCycleItemBodySchema = z
  .object({
    studyGroupId: z.coerce.number().int().positive(),
    position: z.coerce.number().int().positive().optional(),
    minutesPerSession: z.coerce
      .number()
      .int()
      .min(1, "Duração deve ter no mínimo 1 minuto")
      .max(180, "Duração deve ter no máximo 180 minutos")
      .default(25),
  })
  .strict();

export const createStudyCycleItemSchema = studyCycleItemBodySchema;
export const updateStudyCycleItemSchema = studyCycleItemBodySchema;

export const studyCycleItemParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    itemId: z.coerce.number().int().positive(),
  })
  .strict();

export type CreateStudyCycleItemData = z.infer<
  typeof createStudyCycleItemSchema
>;
export type UpdateStudyCycleItemData = z.infer<
  typeof updateStudyCycleItemSchema
>;
