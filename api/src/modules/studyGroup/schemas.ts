import { z } from "zod";

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
  })
  .strict();

export const updateStudyGroupSchema = createStudyGroupSchema;

export type CreateStudyGroupData = z.infer<typeof createStudyGroupSchema>;
export type UpdateStudyGroupData = z.infer<typeof updateStudyGroupSchema>;
