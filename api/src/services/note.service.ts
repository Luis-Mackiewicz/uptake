import { ConflictError, NotFoundError } from "../errors/AppError.js";
import { contentRepository } from "../repositories/content.repository.js";
import { noteRepository } from "../repositories/note.repository.js";
import type { CreateNoteData, UpdateNoteData } from "../schemas/note.schemas.js";
import {
  toPaginated,
  type Pagination,
} from "../schemas/pagination.schemas.js";

export class NoteService {
  constructor(
    private readonly repository: typeof noteRepository = noteRepository,
    private readonly contents: typeof contentRepository = contentRepository,
  ) {}

  async create(userId: number, data: CreateNoteData) {
    await this.ensureContent(userId, data.contentId);
    const existing = await this.repository.findByFileName(
      data.contentId,
      data.fileName,
    );

    if (existing && existing.deletedAt === null) {
      throw new ConflictError("Já existe uma nota com esse nome neste conteúdo");
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
    const note = await this.repository.findById(id, userId);

    if (!note) {
      throw new NotFoundError("Nota não encontrada");
    }

    return note;
  }

  async update(userId: number, id: number, data: UpdateNoteData) {
    await this.findById(userId, id);
    await this.ensureContent(userId, data.contentId);
    const existing = await this.repository.findByFileName(
      data.contentId,
      data.fileName,
      id,
    );

    if (existing) {
      throw new ConflictError("Já existe uma nota com esse nome neste conteúdo");
    }

    return this.repository.update(id, data);
  }

  async remove(userId: number, id: number) {
    await this.findById(userId, id);
    return this.repository.softDelete(id);
  }

  private async ensureContent(userId: number, contentId: number) {
    const content = await this.contents.findById(contentId, userId);

    if (!content) {
      throw new NotFoundError("Conteúdo não encontrado");
    }
  }
}

export const noteService = new NoteService();
