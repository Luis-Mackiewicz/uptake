import { ConflictError } from "../../errors/AppError.js";
import { CrudService } from "../../shared/crud.service.js";
import type {
  CreateStudyGroupData,
  UpdateStudyGroupData,
} from "./schemas.js";
import { studyGroupRepository } from "./repository.js";

type StudyGroupRecord = NonNullable<
  Awaited<ReturnType<typeof studyGroupRepository.findById>>
>;

export class StudyGroupService extends CrudService<
  StudyGroupRecord,
  CreateStudyGroupData,
  UpdateStudyGroupData
> {
  private readonly groupRepository: typeof studyGroupRepository;

  constructor(
    repository: typeof studyGroupRepository = studyGroupRepository,
  ) {
    super(repository, "Grupo de estudo não encontrado");
    this.groupRepository = repository;
  }

  override async create(userId: number, data: CreateStudyGroupData) {
    const existing = await this.groupRepository.findByName(userId, data.name);

    if (existing && existing.deletedAt === null) {
      throw new ConflictError("Já existe um grupo de estudo com esse nome");
    }

    if (existing) {
      return this.groupRepository.reactivate(existing.id, userId, data);
    }

    return super.create(userId, data);
  }

  override async update(
    userId: number,
    id: number,
    data: UpdateStudyGroupData,
  ) {
    await this.findById(userId, id);
    const existing = await this.groupRepository.findByName(userId, data.name, id);

    if (existing) {
      throw new ConflictError("Já existe um grupo de estudo com esse nome");
    }

    return this.groupRepository.update(id, userId, data);
  }
}

export const studyGroupService = new StudyGroupService();
