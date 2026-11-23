import { NotFoundError } from "../errors/AppError.js";
import { studyCycleRepository } from "../repositories/studyCycle.repository.js";
import {
  toPaginated,
  type Pagination,
} from "../schemas/pagination.schemas.js";
import type {
  CreateStudyCycleData,
  UpdateStudyCycleData,
} from "../schemas/studyCycle.schemas.js";

export class StudyCycleService {
  constructor(
    private readonly repository: typeof studyCycleRepository = studyCycleRepository,
  ) {}

  async create(userId: number, data: CreateStudyCycleData) {
    return this.repository.create(userId, data);
  }

  async findAll(userId: number, pagination: Pagination) {
    const { data, total } = await this.repository.findMany(userId, pagination);
    return toPaginated(data, total, pagination);
  }

  async findById(userId: number, id: number) {
    const studyCycle = await this.repository.findById(id, userId);

    if (!studyCycle) {
      throw new NotFoundError("Ciclo de estudos não encontrado");
    }

    return studyCycle;
  }

  async update(userId: number, id: number, data: UpdateStudyCycleData) {
    await this.findById(userId, id);
    return this.repository.update(id, data);
  }

  async remove(userId: number, id: number) {
    await this.findById(userId, id);
    return this.repository.softDelete(id);
  }
}

export const studyCycleService = new StudyCycleService();
