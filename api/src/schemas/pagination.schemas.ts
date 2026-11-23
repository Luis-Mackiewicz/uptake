import { z } from "zod";
import { ValidationError } from "../errors/AppError.js";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(query: unknown): Pagination {
  const result = paginationSchema.safeParse(query ?? {});

  if (!result.success) {
    throw new ValidationError("Paginação inválida", {
      issues: result.error.flatten().fieldErrors,
    });
  }

  const { page, limit } = result.data;

  return { page, limit, skip: (page - 1) * limit };
}

export function toPaginated<T>(
  data: T[],
  total: number,
  pagination: Pagination,
): PaginatedResult<T> {
  return {
    data,
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  };
}
