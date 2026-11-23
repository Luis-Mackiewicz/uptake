import { ConflictError } from "../../errors/AppError.js";
import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type { ContentLookup } from "../../shared/ownership.js";
import { contentLookup } from "../content/index.js";
import type { CreateNoteData, UpdateNoteData } from "./schemas.js";
import { noteRepository } from "./repository.js";

type NoteRecord = NonNullable<
  Awaited<ReturnType<typeof noteRepository.findById>>
>;

interface NoteRepository
  extends CrudRepository<NoteRecord, CreateNoteData, UpdateNoteData> {
  findByFileName(
    userId: number,
    contentId: number,
    fileName: string,
    excludeId?: number,
  ): Promise<{ id: number; deletedAt: Date | null } | null>;
  reactivate(
    id: number,
    userId: number,
    data: CreateNoteData,
  ): Promise<NoteRecord>;
}

export class NoteService extends CrudService<
  NoteRecord,
  CreateNoteData,
  UpdateNoteData,
  NoteRepository
> {
  constructor(
    repository: NoteRepository = noteRepository,
    private readonly contents: ContentLookup = contentLookup,
  ) {
    super(repository, "Nota não encontrada");
  }

  override async create(userId: number, data: CreateNoteData) {
    await this.ensureContent(userId, data.contentId);
    const existing = await this.repository.findByFileName(
      userId,
      data.contentId,
      data.fileName,
    );

    if (existing && existing.deletedAt === null) {
      throw new ConflictError("Já existe uma nota com esse nome neste conteúdo");
    }

    if (existing) {
      return this.repository.reactivate(existing.id, userId, data);
    }

    return super.create(userId, data);
  }

  override async update(userId: number, id: number, data: UpdateNoteData) {
    await this.findById(userId, id);
    await this.ensureContent(userId, data.contentId);
    const existing = await this.repository.findByFileName(
      userId,
      data.contentId,
      data.fileName,
      id,
    );

    if (existing) {
      throw new ConflictError("Já existe uma nota com esse nome neste conteúdo");
    }

    return this.updateValidated(userId, id, data);
  }

  private async ensureContent(userId: number, contentId: number) {
    assertFound(
      await this.contents.findById(contentId, userId),
      "Conteúdo não encontrado",
    );
  }
}

export const noteService = new NoteService();
