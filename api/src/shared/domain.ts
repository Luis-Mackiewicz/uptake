export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_NOTE_SIZE_BYTES = 2 * 1024 * 1024;

export const CYCLE_PRIORITIES = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
} as const;

export type CyclePriority =
  (typeof CYCLE_PRIORITIES)[keyof typeof CYCLE_PRIORITIES];

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
