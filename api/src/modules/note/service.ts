import { ConflictError } from "../../shared/errors.js";
import { type Pagination, toPaginated } from "../../shared/domain.js";
import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type { ContentLookup } from "../../shared/ownership.js";
import { mergeReorderedIds } from "../../shared/reorder.js";
import { contentLookup } from "../content/index.js";
import {
  normalizeNoteFileName,
  type CreateNoteData,
  type UpdateNoteData,
} from "./schemas.js";
import { NoteFile } from "./entities.js";
import { noteRepository, type NoteInput } from "./repository.js";

type NoteRecord = NonNullable<
  Awaited<ReturnType<typeof noteRepository.findById>>
>;

type NoteRepository = Omit<
  CrudRepository<NoteRecord, NoteInput, NoteInput>,
  "findMany"
> & {
  findMany(
    userId: number,
    pagination: Pagination,
    contentId?: number,
  ): Promise<{ data: NoteRecord[]; total: number }>;
  findByFileName(
    userId: number,
    contentId: number,
    fileName: string,
    excludeId?: number,
  ): Promise<{ id: number; deletedAt: Date | null } | null>;
  reactivate(
    id: number,
    userId: number,
    data: NoteInput,
  ): Promise<NoteRecord>;
  countActiveExamLinks(userId: number, noteId: number): Promise<number>;
  findActiveIds(userId: number, contentId: number): Promise<number[]>;
  findNextPosition(userId: number, contentId: number): Promise<number>;
  reorder(userId: number, contentId: number, ids: number[]): Promise<void>;
  normalizePositions(userId: number, contentId: number): Promise<void>;
};

export class NoteService extends CrudService<
  NoteRecord,
  NoteInput,
  NoteInput,
  NoteRepository
> {
  constructor(
    repository: NoteRepository = noteRepository,
    private readonly contents: ContentLookup = contentLookup,
  ) {
    super(repository, "Nota não encontrada");
  }

  override async findAll(
    userId: number,
    pagination: Pagination,
    contentId?: number,
  ) {
    if (contentId === undefined) return super.findAll(userId, pagination);

    await this.ensureContent(userId, contentId);
    const { data, total } = await this.repository.findMany(
      userId,
      pagination,
      contentId,
    );
    return toPaginated(data, total, pagination);
  }

  async createFromName(userId: number, data: CreateNoteData) {
    const fileName = normalizeNoteFileName(data.name);
    const input: NoteInput = {
      title: fileName,
      fileName,
      markdownContent: "",
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      contentId: data.contentId,
    };

    await this.ensureContent(userId, data.contentId);
    const existing = await this.repository.findByFileName(
      userId,
      data.contentId,
      fileName,
    );

    if (existing && existing.deletedAt === null) {
      throw new ConflictError("Já existe uma nota com esse nome neste conteúdo");
    }

    if (existing) {
      return this.repository.reactivate(existing.id, userId, input);
    }

    return super.create(userId, input);
  }

  override async update(userId: number, id: number, data: UpdateNoteData) {
    const input = this.withSize(data);
    const current = await this.findById(userId, id);
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

    if (current.contentId === data.contentId) {
      return this.updateValidated(userId, id, input);
    }

    const position = await this.repository.findNextPosition(
      userId,
      data.contentId,
    );
    const updated = await this.repository.update(id, userId, {
      ...input,
      position,
    });
    await this.repository.normalizePositions(userId, current.contentId);
    return updated;
  }

  override async remove(userId: number, id: number) {
    const current = await this.findById(userId, id);
    const examLinks = await this.repository.countActiveExamLinks(userId, id);

    if (examLinks > 0) {
      throw new ConflictError(
        "Não é possível excluir a nota: existem provas vinculadas",
      );
    }

    const removed = await this.repository.softDelete(id, userId);
    await this.repository.normalizePositions(userId, current.contentId);
    return removed;
  }

  async reorder(userId: number, contentId: number, ids: number[]) {
    await this.ensureContent(userId, contentId);
    const currentIds = await this.repository.findActiveIds(userId, contentId);
    const orderedIds = mergeReorderedIds(
      currentIds,
      ids,
      "Lista de notas inválida",
    );
    await this.repository.reorder(userId, contentId, orderedIds);
  }

  private withSize(data: UpdateNoteData): NoteInput {
    return new NoteFile(data).toInput();
  }

  private async ensureContent(userId: number, contentId: number) {
    assertFound(
      await this.contents.findById(contentId, userId),
      "Conteúdo não encontrado",
    );
  }
}

export const noteService = new NoteService();
