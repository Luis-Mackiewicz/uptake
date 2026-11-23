import { ConflictError } from "../../shared/errors.js";
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
  countActiveLinks(
    userId: number,
    studyGroupId: number,
  ): Promise<{ contents: number; exams: number; cycles: number }>;
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

  override async remove(userId: number, id: number) {
    await this.findById(userId, id);
    const links = await this.repository.countActiveLinks(userId, id);

    if (links.contents > 0) {
      throw new ConflictError(
        "Não é possível excluir o grupo: existem conteúdos vinculados",
      );
    }

    if (links.exams > 0) {
      throw new ConflictError(
        "Não é possível excluir o grupo: existem provas vinculadas",
      );
    }

    if (links.cycles > 0) {
      throw new ConflictError(
        "Não é possível excluir o grupo: existem ciclos vinculados",
      );
    }

    return this.repository.softDelete(id, userId);
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

    return this.updateValidated(userId, id, data);
  }
}

export const studyGroupService = new StudyGroupService();
