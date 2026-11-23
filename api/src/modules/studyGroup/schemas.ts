import { z } from "zod";

const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato #RRGGBB")
  .nullable()
  .optional();

export const createStudyGroupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome é obrigatório")
      .max(100, "Nome deve ter no máximo 100 caracteres"),
    description: z
      .string()
      .trim()
      .max(500, "Descrição deve ter no máximo 500 caracteres")
      .nullable()
      .optional(),
    color: colorSchema,
  })
  .strict();

export const updateStudyGroupSchema = createStudyGroupSchema;

export type CreateStudyGroupData = z.infer<typeof createStudyGroupSchema>;
export type UpdateStudyGroupData = z.infer<typeof updateStudyGroupSchema>;
