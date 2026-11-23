import { z } from "zod";
import { paginationSchema } from "../../shared/schemas.js";

export const listNotesQuerySchema = paginationSchema.extend({
  contentId: z.coerce.number().int().positive().optional(),
});

export function normalizeNoteFileName(name: string) {
  return `${name.trim().replace(/\.md$/i, "")}.md`;
}

export const createNoteSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nome é obrigatório")
      .max(251, "Nome deve ter no máximo 251 caracteres")
      .regex(/^[^/\\]+$/, "Nome não pode conter barras")
      .refine((value) => value.replace(/\.md$/i, "").length > 0, "Nome é obrigatório"),
    mimeType: z
      .string()
      .trim()
      .max(100, "MIME type deve ter no máximo 100 caracteres")
      .default("text/markdown"),
    sizeBytes: z.coerce
      .number()
      .int()
      .nonnegative("Tamanho não pode ser negativo")
      .default(0),
    contentId: z.coerce.number().int().positive(),
  })
  .strict();

export const updateNoteSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Título é obrigatório")
      .max(200, "Título deve ter no máximo 200 caracteres"),
    fileName: z
      .string()
      .trim()
      .min(1, "Nome do arquivo é obrigatório")
      .max(255, "Nome do arquivo deve ter no máximo 255 caracteres")
      .regex(/^[^/\\]+$/, "Nome do arquivo não pode conter barras"),
    markdownContent: z.string().min(1, "Conteúdo da nota é obrigatório"),
    mimeType: z
      .string()
      .trim()
      .max(100, "MIME type deve ter no máximo 100 caracteres")
      .default("text/markdown"),
    sizeBytes: z.coerce
      .number()
      .int()
      .nonnegative("Tamanho não pode ser negativo")
      .default(0),
    contentId: z.coerce.number().int().positive(),
  })
  .strict();

export const reorderNotesSchema = z
  .object({
    contentId: z.coerce.number().int().positive(),
    ids: z.array(z.coerce.number().int().positive()).min(1),
  })
  .strict();

export type CreateNoteData = z.infer<typeof createNoteSchema>;
export type UpdateNoteData = z.infer<typeof updateNoteSchema>;
