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
