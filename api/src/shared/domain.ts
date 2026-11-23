export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_NOTE_SIZE_BYTES = 2 * 1024 * 1024;

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

export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
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

export const REVIEW_INTERVALS = [1, 3, 7, 15, 30, 60] as const;
export type ReviewInterval = (typeof REVIEW_INTERVALS)[number];
export const REVIEW_INTERVAL_MESSAGE =
  "Intervalo deve ser 1, 3, 7, 15, 30 ou 60 dias";

export function isReviewInterval(value: number): value is ReviewInterval {
  return REVIEW_INTERVALS.includes(value as ReviewInterval);
}
