import { NotFoundError } from "../errors/AppError.js";
import { contentRepository } from "../repositories/content.repository.js";
import { studyGroupRepository } from "../repositories/studyGroup.repository.js";
import {
  toPaginated,
  type Pagination,
} from "../schemas/pagination.schemas.js";
import type {
  CreateContentData,
  UpdateContentData,
} from "../schemas/content.schemas.js";

export class ContentService {
  constructor(
    private readonly repository: typeof contentRepository = contentRepository,
    private readonly studyGroups: typeof studyGroupRepository = studyGroupRepository,
  ) {}

  async create(userId: number, data: CreateContentData) {
    await this.ensureStudyGroup(userId, data.studyGroupId);
    return this.repository.create(userId, data);
  }

  async findAll(userId: number, pagination: Pagination) {
    const { data, total } = await this.repository.findMany(userId, pagination);
    return toPaginated(data, total, pagination);
  }

  async findById(userId: number, id: number) {
    const content = await this.repository.findById(id, userId);

    if (!content) {
      throw new NotFoundError("Conteúdo não encontrado");
    }

    return content;
  }

  async update(userId: number, id: number, data: UpdateContentData) {
    await this.findById(userId, id);
    await this.ensureStudyGroup(userId, data.studyGroupId);
    return this.repository.update(id, data);
  }

  async remove(userId: number, id: number) {
    await this.findById(userId, id);
    return this.repository.softDelete(id);
  }

  private async ensureStudyGroup(userId: number, studyGroupId: number) {
    const studyGroup = await this.studyGroups.findById(studyGroupId, userId);

    if (!studyGroup) {
      throw new NotFoundError("Grupo de estudo não encontrado");
    }
  }
}

export const contentService = new ContentService();
