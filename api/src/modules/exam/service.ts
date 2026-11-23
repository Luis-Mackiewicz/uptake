import { NotFoundError } from "../../shared/errors.js";
import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type {
  NoteLookup,
  StudyGroupLookup,
} from "../../shared/ownership.js";
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
    private readonly notes: NoteLookup = noteLookup,
  ) {
    super(repository, "Prova não encontrada");
  }

  override async create(userId: number, data: CreateExamData) {
    await this.ensureStudyGroup(userId, data.studyGroupId);
    await this.ensureNotes(userId, data.noteIds);
    return super.create(userId, data);
  }

  override async update(userId: number, id: number, data: UpdateExamData) {
    await this.findById(userId, id);
    await this.ensureStudyGroup(userId, data.studyGroupId);
    await this.ensureNotes(userId, data.noteIds);
    return this.updateValidated(userId, id, data);
  }

  private async ensureStudyGroup(userId: number, studyGroupId?: number | null) {
    if (studyGroupId === null || studyGroupId === undefined) {
      return;
    }

    assertFound(
      await this.studyGroups.findById(studyGroupId, userId),
      "Grupo de estudo não encontrado",
    );
  }

  private async ensureNotes(userId: number, noteIds: number[]) {
    const notes = await Promise.all(
      noteIds.map((noteId) => this.notes.findById(noteId, userId)),
    );

    if (notes.some((note) => !note)) {
      throw new NotFoundError("Nota não encontrada");
    }
  }
}

export const examService = new ExamService();
