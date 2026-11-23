import { ConflictError } from "../../errors/AppError.js";
import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import type {
  CreateStudyGroupData,
  UpdateStudyGroupData,
} from "./schemas.js";
import { studyGroupRepository } from "./repository.js";

type StudyGroupRecord = NonNullable<
  Awaited<ReturnType<typeof studyGroupRepository.findById>>
>;

interface StudyGroupRepository
  extends CrudRepository<
    StudyGroupRecord,
    CreateStudyGroupData,
    UpdateStudyGroupData
  > {
  findByName(
    userId: number,
    name: string,
    excludeId?: number,
  ): Promise<{ id: number; deletedAt: Date | null } | null>;
  reactivate(
    id: number,
    userId: number,
    data: CreateStudyGroupData,
  ): Promise<StudyGroupRecord>;
}

export class StudyGroupService extends CrudService<
  StudyGroupRecord,
  CreateStudyGroupData,
  UpdateStudyGroupData,
  StudyGroupRepository
> {
  constructor(repository: StudyGroupRepository = studyGroupRepository) {
    super(repository, "Grupo de estudo não encontrado");
  }

  override async create(userId: number, data: CreateStudyGroupData) {
    const existing = await this.repository.findByName(userId, data.name);

    if (existing && existing.deletedAt === null) {
      throw new ConflictError("Já existe um grupo de estudo com esse nome");
    }

    if (existing) {
      return this.repository.reactivate(existing.id, userId, data);
    }

    return super.create(userId, data);
  }

  override async update(
    userId: number,
    id: number,
    data: UpdateStudyGroupData,
  ) {
    await this.findById(userId, id);
    const existing = await this.repository.findByName(userId, data.name, id);

    if (existing) {
      throw new ConflictError("Já existe um grupo de estudo com esse nome");
    }

    return this.repository.update(id, userId, data);
  }
}

export const studyGroupService = new StudyGroupService();
