import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import { type Pagination, toPaginated } from "../../shared/domain.js";
import { assertFound } from "../../shared/guards.js";
import type { StudyGroupLookup } from "../../shared/ownership.js";
import { mergeReorderedIds } from "../../shared/reorder.js";
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
  findActiveIds(userId: number, studyGroupId: number): Promise<number[]>;
  findNextPosition(userId: number, studyGroupId: number): Promise<number>;
  reorder(
    userId: number,
    studyGroupId: number,
    ids: number[],
  ): Promise<void>;
  normalizePositions(userId: number, studyGroupId: number): Promise<void>;
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
    const current = await this.findById(userId, id);
    await this.ensureStudyGroup(userId, data.studyGroupId);

    if (current.studyGroupId === data.studyGroupId) {
      return this.updateValidated(userId, id, data);
    }

    const position = await this.repository.findNextPosition(
      userId,
      data.studyGroupId,
    );
    const updated = await this.repository.update(id, userId, {
      ...data,
      position,
    } as UpdateContentData & { position: number });
    await this.repository.normalizePositions(userId, current.studyGroupId);
    return updated;
  }

  override async remove(userId: number, id: number) {
    const current = await this.findById(userId, id);
    const removed = await this.repository.softDelete(id, userId);
    await this.repository.normalizePositions(userId, current.studyGroupId);
    return removed;
  }

  async reorder(userId: number, studyGroupId: number, ids: number[]) {
    await this.ensureStudyGroup(userId, studyGroupId);
    const currentIds = await this.repository.findActiveIds(userId, studyGroupId);
    const orderedIds = mergeReorderedIds(
      currentIds,
      ids,
      "Lista de conteúdos inválida",
    );
    await this.repository.reorder(userId, studyGroupId, orderedIds);
  }

  private async ensureStudyGroup(userId: number, studyGroupId: number) {
    assertFound(
      await this.studyGroups.findById(studyGroupId, userId),
      "Grupo de estudo não encontrado",
    );
  }
}

export const contentService = new ContentService();
