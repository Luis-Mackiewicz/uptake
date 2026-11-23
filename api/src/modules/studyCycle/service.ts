import { ConflictError, NotFoundError } from "../../errors/AppError.js";
import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type { StudyGroupLookup } from "../../shared/ownership.js";
import { studyGroupLookup } from "../studyGroup/index.js";
import { StudyCycle } from "./entities.js";
import {
  studyCycleRepository,
  type StudyCycleItemInput,
  type StudyCycleState,
} from "./repository.js";
import type {
  CreateStudyCycleData,
  CreateStudyCycleItemData,
  UpdateStudyCycleData,
  UpdateStudyCycleItemData,
} from "./schemas.js";

type StudyCycleRecord = NonNullable<
  Awaited<ReturnType<typeof studyCycleRepository.findById>>
>;

type StudyCycleItemRecord = NonNullable<
  Awaited<ReturnType<typeof studyCycleRepository.findItemById>>
>;

interface StudyCycleRepository
  extends CrudRepository<
    StudyCycleRecord,
    CreateStudyCycleData,
    UpdateStudyCycleData
  > {
  updateState(
    id: number,
    userId: number,
    state: StudyCycleState,
  ): Promise<StudyCycleRecord>;
  findItems(studyCycleId: number): Promise<StudyCycleItemRecord[]>;
  findItemById(
    id: number,
    studyCycleId: number,
  ): Promise<StudyCycleItemRecord | null>;
  findItemByPosition(
    studyCycleId: number,
    position: number,
    excludeId?: number,
  ): Promise<StudyCycleItemRecord | null>;
  createItem(
    studyCycleId: number,
    data: StudyCycleItemInput,
  ): Promise<StudyCycleItemRecord>;
  updateItem(
    id: number,
    data: StudyCycleItemInput,
  ): Promise<StudyCycleItemRecord>;
  deleteItem(id: number): Promise<StudyCycleItemRecord>;
  normalizeItemPositions(studyCycleId: number): Promise<void>;
}

export class StudyCycleService extends CrudService<
  StudyCycleRecord,
  CreateStudyCycleData,
  UpdateStudyCycleData,
  StudyCycleRepository
> {
  constructor(
    repository: StudyCycleRepository = studyCycleRepository,
    private readonly studyGroups: StudyGroupLookup = studyGroupLookup,
  ) {
    super(repository, "Ciclo de estudos não encontrado");
  }

  async findItems(userId: number, cycleId: number) {
    await this.findById(userId, cycleId);
    return this.repository.findItems(cycleId);
  }

  async addItem(
    userId: number,
    cycleId: number,
    data: CreateStudyCycleItemData,
  ) {
    await this.findById(userId, cycleId);
    await this.ensureStudyGroup(userId, data.studyGroupId);
    const items = await this.repository.findItems(cycleId);
    const position =
      data.position ?? (items[items.length - 1]?.position ?? 0) + 1;
    const existing = await this.repository.findItemByPosition(
      cycleId,
      position,
    );

    if (existing) {
      throw new ConflictError("Já existe um item nessa posição");
    }

    const created = await this.repository.createItem(cycleId, {
      studyGroupId: data.studyGroupId,
      position,
      minutesPerSession: data.minutesPerSession,
    });
    await this.repository.normalizeItemPositions(cycleId);
    return this.repository.findItemById(created.id, cycleId);
  }

  async updateItem(
    userId: number,
    cycleId: number,
    itemId: number,
    data: UpdateStudyCycleItemData,
  ) {
    const item = await this.findItem(userId, cycleId, itemId);
    await this.ensureStudyGroup(userId, data.studyGroupId);
    const position = data.position ?? item.position;
    const existing = await this.repository.findItemByPosition(
      cycleId,
      position,
      itemId,
    );

    if (existing) {
      throw new ConflictError("Já existe um item nessa posição");
    }

    await this.repository.updateItem(itemId, {
      studyGroupId: data.studyGroupId,
      position,
      minutesPerSession: data.minutesPerSession,
    });
    await this.repository.normalizeItemPositions(cycleId);
    return this.repository.findItemById(itemId, cycleId);
  }

  async removeItem(userId: number, cycleId: number, itemId: number) {
    const item = await this.findItem(userId, cycleId, itemId);
    await this.repository.deleteItem(itemId);
    await this.repository.normalizeItemPositions(cycleId);
    return item;
  }

  async advance(userId: number, cycleId: number) {
    const record = await this.findById(userId, cycleId);
    const items = await this.repository.findItems(cycleId);
    const cycle = new StudyCycle(record.currentRound, record.nextItemOrder);
    const next = cycle.advance(items);

    if (!next) {
      return { cycle: record, nextItem: null };
    }

    const updatedCycle = await this.repository.updateState(
      record.id,
      userId,
      next,
    );
    const nextItem = await this.repository.findItemByPosition(
      record.id,
      next.nextItemOrder,
    );

    return { cycle: updatedCycle, nextItem };
  }

  private async findItem(userId: number, cycleId: number, itemId: number) {
    await this.findById(userId, cycleId);
    const item = await this.repository.findItemById(itemId, cycleId);

    if (!item) {
      throw new NotFoundError("Item do ciclo não encontrado");
    }

    return item;
  }

  private async ensureStudyGroup(userId: number, studyGroupId: number) {
    assertFound(
      await this.studyGroups.findById(studyGroupId, userId),
      "Grupo de estudo não encontrado",
    );
  }
}

export const studyCycleService = new StudyCycleService();
