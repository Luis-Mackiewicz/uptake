import { NotFoundError, ValidationError } from "../../shared/errors.js";
import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type {
  ContentLookup,
  NoteLookup,
  StudyGroupLookup,
} from "../../shared/ownership.js";
import { contentLookup } from "../content/index.js";
import { noteLookup } from "../note/index.js";
import { studyGroupLookup } from "../studyGroup/index.js";
import type { CreateExamData, UpdateExamData } from "./schemas.js";
import { examRepository } from "./repository.js";

type ExamRecord = NonNullable<
  Awaited<ReturnType<typeof examRepository.findById>>
>;

type ExamRepository = CrudRepository<
  ExamRecord,
  CreateExamData,
  UpdateExamData
>;

export class ExamService extends CrudService<
  ExamRecord,
  CreateExamData,
  UpdateExamData,
  ExamRepository
> {
  constructor(
    repository: ExamRepository = examRepository,
    private readonly studyGroups: StudyGroupLookup = studyGroupLookup,
    private readonly contents: ContentLookup = contentLookup,
    private readonly notes: NoteLookup = noteLookup,
  ) {
    super(repository, "Prova não encontrada");
  }

  override async create(userId: number, data: CreateExamData) {
    await this.validateRelations(userId, data);
    return super.create(userId, data);
  }

  override async update(userId: number, id: number, data: UpdateExamData) {
    await this.findById(userId, id);
    await this.validateRelations(userId, data);
    return this.updateValidated(userId, id, data);
  }

  private async validateRelations(
    userId: number,
    data: CreateExamData,
  ): Promise<void> {
    await this.ensureStudyGroup(userId, data.studyGroupId);
    const studyGroupId = data.studyGroupId ?? null;

    if (data.contentIds.length > 0 && studyGroupId === null) {
      throw new ValidationError("Selecione um grupo para vincular conteúdos");
    }

    const contents = await Promise.all(
      data.contentIds.map((contentId) => this.contents.findById(contentId, userId)),
    );

    if (contents.some((content) => !content)) {
      throw new NotFoundError("Conteúdo não encontrado");
    }

    if (
      studyGroupId !== null &&
      contents.some((content) => content?.studyGroupId !== studyGroupId)
    ) {
      throw new ValidationError("Conteúdo não pertence ao grupo selecionado");
    }

    const selectedContentIds = new Set(data.contentIds);
    const notes = await Promise.all(
      data.noteIds.map((noteId) => this.notes.findById(noteId, userId)),
    );

    if (notes.some((note) => !note)) {
      throw new NotFoundError("Nota não encontrada");
    }

    if (notes.some((note) => !selectedContentIds.has(note!.contentId))) {
      throw new ValidationError("Nota não pertence aos conteúdos selecionados");
    }
  }

  private async ensureStudyGroup(
    userId: number,
    studyGroupId?: number | null,
  ): Promise<void> {
    if (studyGroupId === null || studyGroupId === undefined) {
      return;
    }

    assertFound(
      await this.studyGroups.findById(studyGroupId, userId),
      "Grupo de estudo não encontrado",
    );
  }
}

export const examService = new ExamService();
