import { z } from "zod";
import { paginationSchema } from "../../schemas/pagination.schemas.js";
import {
  isReviewInterval,
  REVIEW_INTERVAL_MESSAGE,
  REVIEW_INTERVALS,
  type ReviewInterval,
} from "../../shared/domain.js";

export { REVIEW_INTERVALS, type ReviewInterval } from "../../shared/domain.js";

const intervalDaysSchema = z
  .number()
  .int()
  .refine(isReviewInterval, { message: REVIEW_INTERVAL_MESSAGE });

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
