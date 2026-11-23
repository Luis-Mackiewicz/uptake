import { z } from "zod";
import { ValidationError } from "./errors.js";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  calculateSkip,
  type Pagination,
} from "./domain.js";

export type { Pagination, PaginatedResult } from "./domain.js";
export { toPaginated } from "./domain.js";

export const idParamSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export function parsePagination(query: unknown): Pagination {
  const result = paginationSchema.safeParse(query ?? {});

  if (!result.success) {
    throw new ValidationError("Paginação inválida", {
      issues: result.error.flatten().fieldErrors,
    });
  }

  const { page, limit } = result.data;

  return { page, limit, skip: calculateSkip(page, limit) };
}
