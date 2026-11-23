import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import { type Pagination, toPaginated } from "../../shared/domain.js";
import { assertFound } from "../../shared/guards.js";
import type { StudyGroupLookup } from "../../shared/ownership.js";
import { studyGroupLookup } from "../studyGroup/index.js";
import type { CreateContentData, UpdateContentData } from "./schemas.js";
import { contentRepository } from "./repository.js";

type ContentRecord = NonNullable<
  Awaited<ReturnType<typeof contentRepository.findById>>
>;

type ContentRepository = Omit<
  CrudRepository<ContentRecord, CreateContentData, UpdateContentData>,
  "findMany"
> & {
  findMany(
    userId: number,
    pagination: Pagination,
    studyGroupId?: number,
  ): Promise<{ data: ContentRecord[]; total: number }>;
};

export class ContentService extends CrudService<
  ContentRecord,
  CreateContentData,
  UpdateContentData,
  ContentRepository
> {
  constructor(
    repository: ContentRepository = contentRepository,
    private readonly studyGroups: StudyGroupLookup = studyGroupLookup,
  ) {
    super(repository, "Conteúdo não encontrado");
  }

  override async findAll(
    userId: number,
    pagination: Pagination,
    studyGroupId?: number,
  ) {
    if (studyGroupId === undefined) return super.findAll(userId, pagination);

    await this.ensureStudyGroup(userId, studyGroupId);
    const { data, total } = await this.repository.findMany(
      userId,
      pagination,
      studyGroupId,
    );
    return toPaginated(data, total, pagination);
  }

  override async create(userId: number, data: CreateContentData) {
    await this.ensureStudyGroup(userId, data.studyGroupId);
    return super.create(userId, data);
  }

  override async update(userId: number, id: number, data: UpdateContentData) {
    await this.findById(userId, id);
    await this.ensureStudyGroup(userId, data.studyGroupId);
    return this.updateValidated(userId, id, data);
  }

  private async ensureStudyGroup(userId: number, studyGroupId: number) {
    assertFound(
      await this.studyGroups.findById(studyGroupId, userId),
      "Grupo de estudo não encontrado",
    );
  }
}

export const contentService = new ContentService();
