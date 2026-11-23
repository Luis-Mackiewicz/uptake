import { ConflictError, NotFoundError } from "../errors/AppError.js";
import { studyGroupRepository } from "../repositories/studyGroup.repository.js";
import {
  toPaginated,
  type Pagination,
} from "../schemas/pagination.schemas.js";
import type {
  CreateStudyGroupData,
  UpdateStudyGroupData,
} from "../schemas/studyGroup.schemas.js";

export class StudyGroupService {
  constructor(
    private readonly repository: typeof studyGroupRepository = studyGroupRepository,
  ) {}

  async create(userId: number, data: CreateStudyGroupData) {
    const existing = await this.repository.findByName(userId, data.name);

    if (existing && existing.deletedAt === null) {
      throw new ConflictError("Já existe um grupo de estudo com esse nome");
    }

    if (existing) {
      return this.repository.reactivate(existing.id, data);
    }

    return this.repository.create(userId, data);
  }

  async findAll(userId: number, pagination: Pagination) {
    const { data, total } = await this.repository.findMany(userId, pagination);
    return toPaginated(data, total, pagination);
  }

  async findById(userId: number, id: number) {
    const studyGroup = await this.repository.findById(id, userId);

    if (!studyGroup) {
      throw new NotFoundError("Grupo de estudo não encontrado");
    }

    return studyGroup;
  }

  async update(userId: number, id: number, data: UpdateStudyGroupData) {
    await this.findById(userId, id);
    const existing = await this.repository.findByName(userId, data.name, id);

    if (existing) {
      throw new ConflictError("Já existe um grupo de estudo com esse nome");
    }

    return this.repository.update(id, data);
  }

  async remove(userId: number, id: number) {
    await this.findById(userId, id);
    return this.repository.softDelete(id);
  }
}

export const studyGroupService = new StudyGroupService();
