import { z } from "zod";
import { paginationSchema } from "./pagination.schemas.js";

export const REVIEW_INTERVALS = [1, 3, 7, 15, 30, 60] as const;
export type ReviewInterval = (typeof REVIEW_INTERVALS)[number];

const intervalDaysSchema = z
  .number()
  .int()
  .refine(
    (value): value is ReviewInterval =>
      REVIEW_INTERVALS.includes(value as ReviewInterval),
    { message: "Intervalo deve ser 1, 3, 7, 15, 30 ou 60 dias" },
  );

const dateSchema = z.coerce.date({ message: "Data inválida" });

export const createReviewSchema = z
  .object({
    noteId: z.coerce.number().int().positive(),
    nextReviewAt: dateSchema.optional(),
    intervalDays: intervalDaysSchema.optional(),
  })
  .strict();

export const updateReviewSchema = z
  .object({
    nextReviewAt: dateSchema.optional(),
    intervalDays: intervalDaysSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export const reviewQuerySchema = paginationSchema
  .extend({
    due: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  })
  .strict();

export type CreateReviewData = z.infer<typeof createReviewSchema>;
export type UpdateReviewData = z.infer<typeof updateReviewSchema>;
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
