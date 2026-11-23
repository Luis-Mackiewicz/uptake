import { z } from "zod";
import { paginationSchema } from "../../shared/schemas.js";

export const listContentsQuerySchema = paginationSchema.extend({
  studyGroupId: z.coerce.number().int().positive().optional(),
});

export const createContentSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Título é obrigatório")
      .max(200, "Título deve ter no máximo 200 caracteres"),
    description: z
      .string()
      .trim()
      .max(2000, "Descrição deve ter no máximo 2000 caracteres")
      .nullable()
      .optional(),
    studyGroupId: z.coerce.number().int().positive(),
  })
  .strict();

export const updateContentSchema = createContentSchema;

export type CreateContentData = z.infer<typeof createContentSchema>;
export type UpdateContentData = z.infer<typeof updateContentSchema>;
