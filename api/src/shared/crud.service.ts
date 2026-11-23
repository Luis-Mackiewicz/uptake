import {
  calculateSkip,
  toPaginated,
  type Pagination,
  type PaginatedResult,
} from "./domain.js";
import { assertFound } from "./guards.js";
import type { OwnedRecord } from "./ownership.js";

export interface CrudRepository<T, CreateData, UpdateData> {
  findById(id: number, userId: number): Promise<T | null>;
  findMany(
    userId: number,
    pagination: Pagination,
  ): Promise<{ data: T[]; total: number }>;
  create(userId: number, data: CreateData): Promise<T>;
  update(id: number, userId: number, data: UpdateData): Promise<T>;
  softDelete(id: number, userId: number): Promise<T>;
}

export abstract class CrudService<
  T extends OwnedRecord,
  CreateData,
  UpdateData,
> {
  constructor(
    protected readonly repository: CrudRepository<T, CreateData, UpdateData>,
    protected readonly notFoundMessage: string,
  ) {}

  async create(userId: number, data: CreateData): Promise<T> {
    return this.repository.create(userId, data);
  }

  async findAll(
    userId: number,
    pagination: Pagination,
  ): Promise<PaginatedResult<T>> {
    const { data, total } = await this.repository.findMany(userId, pagination);
    return toPaginated(data, total, pagination);
  }

  async findById(userId: number, id: number): Promise<T> {
    return assertFound(
      await this.repository.findById(id, userId),
      this.notFoundMessage,
    );
  }

  async update(userId: number, id: number, data: UpdateData): Promise<T> {
    await this.findById(userId, id);
    return this.repository.update(id, userId, data);
  }

  async remove(userId: number, id: number): Promise<T> {
    await this.findById(userId, id);
    return this.repository.softDelete(id, userId);
  }
}

export function toCrudPagination(
  page: number,
  limit: number,
): Pagination {
  return { page, limit, skip: calculateSkip(page, limit) };
}
