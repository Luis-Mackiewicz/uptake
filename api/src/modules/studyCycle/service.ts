import { NotFoundError, ValidationError } from "../../shared/errors.js";
import { assertFound } from "../../shared/guards.js";
import type { ContentLookup } from "../../shared/ownership.js";
import { examRepository } from "../exam/repository.js";
import { contentLookup } from "../content/index.js";
import { studyGroupLookup } from "../studyGroup/index.js";
import { StudyCycle } from "./entities.js";
import { studyCycleRepository } from "./repository.js";
import type {
  CreateStudyCycleData,
  ReorderStudyCyclesData,
  UpdateStudyCycleData,
} from "./schemas.js";

export class StudyCycleService {
  constructor(
    private readonly repository = studyCycleRepository,
    private readonly studyGroups = studyGroupLookup,
    private readonly contents: ContentLookup = contentLookup,
  ) {}

  async findAllByExam(userId: number, examId: number) {
    await this.ensureExam(userId, examId);
    return this.repository.findManyByExam(examId);
  }

  async findById(userId: number, examId: number, cycleId: number) {
    await this.ensureExam(userId, examId);
    return this.ensureCycle(userId, examId, cycleId);
  }

  async create(userId: number, examId: number, data: CreateStudyCycleData) {
    await this.ensureExam(userId, examId);
    await this.ensureRelations(userId, data.studyGroupId, data.contentIds);
    const position = await this.nextPosition(examId, data.priority);
    return this.repository.create(userId, examId, {
      name: data.name,
      active: data.active,
      studyGroupId: data.studyGroupId,
      priority: data.priority,
      position,
      contentIds: data.contentIds,
    });
  }

  async update(
    userId: number,
    examId: number,
    cycleId: number,
    data: UpdateStudyCycleData,
  ) {
    const cycle = await this.findById(userId, examId, cycleId);
    await this.ensureRelations(userId, data.studyGroupId, data.contentIds);

    let position = cycle.position;
    if (cycle.priority !== data.priority) {
      position = await this.nextPosition(examId, data.priority);
    }

    const updated = await this.repository.update(cycleId, userId, examId, {
      name: data.name,
      active: data.active,
      studyGroupId: data.studyGroupId,
      priority: data.priority,
      position,
      contentIds: data.contentIds,
    });

    if (cycle.priority !== data.priority) {
      await this.repository.normalizePositions(examId, cycle.priority);
    }

    return updated;
  }

  async remove(userId: number, examId: number, cycleId: number) {
    const cycle = await this.findById(userId, examId, cycleId);
    await this.repository.softDelete(cycleId, userId, examId);
    await this.repository.normalizePositions(examId, cycle.priority);
    return cycle;
  }

  async reorder(
    userId: number,
    examId: number,
    data: ReorderStudyCyclesData,
  ) {
    await this.ensureExam(userId, examId);

    for (const id of data.ids) {
      await this.ensureCycle(userId, examId, id);
    }

    return this.repository.reorder(examId, data.priority, data.ids);
  }

  async advance(userId: number, examId: number, cycleId: number) {
    const record = await this.findById(userId, examId, cycleId);
    const contents = await this.repository.findContents(cycleId);
    const cycle = new StudyCycle(record.currentRound, record.nextItemOrder);
    const next = cycle.advance(contents);

    if (!next) {
      return { cycle: record, nextContent: null };
    }

    const updatedCycle = await this.repository.updateState(
      record.id,
      userId,
      next,
    );
    const nextContent =
      contents.find((content) => content.position === next.nextItemOrder) ?? null;

    return { cycle: updatedCycle, nextContent };
  }

  private async ensureExam(userId: number, examId: number) {
    assertFound(
      await examRepository.findById(examId, userId),
      "Prova não encontrada",
    );
  }

  private async ensureCycle(userId: number, examId: number, cycleId: number) {
    return assertFound(
      await this.repository.findById(cycleId, userId, examId),
      "Ciclo de estudos não encontrado",
    );
  }

  private async ensureRelations(
    userId: number,
    studyGroupId: number,
    contentIds: number[],
  ) {
    await this.ensureStudyGroup(userId, studyGroupId);

    const contents = await Promise.all(
      contentIds.map((contentId) => this.contents.findById(contentId, userId)),
    );

    if (contents.some((content) => !content)) {
      throw new NotFoundError("Conteúdo não encontrado");
    }

    if (contents.some((content) => content?.studyGroupId !== studyGroupId)) {
      throw new ValidationError("Conteúdo não pertence ao grupo selecionado");
    }
  }

  private async ensureStudyGroup(userId: number, studyGroupId: number) {
    assertFound(
      await this.studyGroups.findById(studyGroupId, userId),
      "Grupo de estudo não encontrado",
    );
  }

  private async nextPosition(examId: number, priority: number) {
    const cycles = await this.repository.findManyByExam(examId);
    const inPriority = cycles.filter((cycle) => cycle.priority === priority);
    return (inPriority[inPriority.length - 1]?.position ?? 0) + 1;
  }
}

export const studyCycleService = new StudyCycleService();
