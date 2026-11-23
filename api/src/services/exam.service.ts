import { NotFoundError } from "../errors/AppError.js";
import { examRepository } from "../repositories/exam.repository.js";
import { noteRepository } from "../repositories/note.repository.js";
import { studyGroupRepository } from "../modules/studyGroup/repository.js";
import type { CreateExamData, UpdateExamData } from "../schemas/exam.schemas.js";
import {
  toPaginated,
  type Pagination,
} from "../schemas/pagination.schemas.js";

export class ExamService {
  constructor(
    private readonly repository: typeof examRepository = examRepository,
    private readonly studyGroups: typeof studyGroupRepository = studyGroupRepository,
    private readonly notes: typeof noteRepository = noteRepository,
  ) {}

  async create(userId: number, data: CreateExamData) {
    await this.ensureStudyGroup(userId, data.studyGroupId);
    await this.ensureNotes(userId, data.noteIds);
    return this.repository.create(userId, data);
  }

  async findAll(userId: number, pagination: Pagination) {
    const { data, total } = await this.repository.findMany(userId, pagination);
    return toPaginated(data, total, pagination);
  }

  async findById(userId: number, id: number) {
    const exam = await this.repository.findById(id, userId);

    if (!exam) {
      throw new NotFoundError("Prova não encontrada");
    }

    return exam;
  }

  async update(userId: number, id: number, data: UpdateExamData) {
    await this.findById(userId, id);
    await this.ensureStudyGroup(userId, data.studyGroupId);
    await this.ensureNotes(userId, data.noteIds);
    return this.repository.update(id, data);
  }

  async remove(userId: number, id: number) {
    await this.findById(userId, id);
    return this.repository.softDelete(id);
  }

  private async ensureStudyGroup(userId: number, studyGroupId?: number | null) {
    if (studyGroupId === null || studyGroupId === undefined) {
      return;
    }

    const studyGroup = await this.studyGroups.findById(studyGroupId, userId);

    if (!studyGroup) {
      throw new NotFoundError("Grupo de estudo não encontrado");
    }
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
