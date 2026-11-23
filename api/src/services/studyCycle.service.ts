import { ConflictError, NotFoundError } from "../errors/AppError.js";
import { studyGroupRepository } from "../modules/studyGroup/repository.js";
import { studyCycleRepository } from "../repositories/studyCycle.repository.js";
import {
  toPaginated,
  type Pagination,
} from "../schemas/pagination.schemas.js";
import type {
  CreateStudyCycleData,
  CreateStudyCycleItemData,
  UpdateStudyCycleData,
  UpdateStudyCycleItemData,
} from "../schemas/studyCycle.schemas.js";

export class StudyCycleService {
  constructor(
    private readonly repository: typeof studyCycleRepository = studyCycleRepository,
    private readonly studyGroups: typeof studyGroupRepository = studyGroupRepository,
  ) {}

  async create(userId: number, data: CreateStudyCycleData) {
    return this.repository.create(userId, data);
  }

  async findAll(userId: number, pagination: Pagination) {
    const { data, total } = await this.repository.findMany(userId, pagination);
    return toPaginated(data, total, pagination);
  }

  async findById(userId: number, id: number) {
    const studyCycle = await this.repository.findById(id, userId);

    if (!studyCycle) {
      throw new NotFoundError("Ciclo de estudos não encontrado");
    }

    return studyCycle;
  }

  async update(userId: number, id: number, data: UpdateStudyCycleData) {
    await this.findById(userId, id);
    return this.repository.update(id, data);
  }

  async remove(userId: number, id: number) {
    await this.findById(userId, id);
    return this.repository.softDelete(id);
  }

  async findItems(userId: number, cycleId: number) {
    await this.findById(userId, cycleId);
    return this.repository.findItems(cycleId);
  }

  async addItem(userId: number, cycleId: number, data: CreateStudyCycleItemData) {
    await this.findById(userId, cycleId);
    await this.ensureStudyGroup(userId, data.studyGroupId);
    const items = await this.repository.findItems(cycleId);
    const position =
      data.position ?? (items[items.length - 1]?.position ?? 0) + 1;
    const existing = await this.repository.findItemByPosition(cycleId, position);

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
    const cycle = await this.findById(userId, cycleId);
    const items = await this.repository.findItems(cycleId);

    if (items.length === 0) {
      return { cycle, nextItem: null };
    }

    const foundIndex = items.findIndex(
      (item) => item.position === cycle.nextItemOrder,
    );
    const nextIndex = foundIndex === -1 ? 0 : (foundIndex + 1) % items.length;
    const wraps = foundIndex !== -1 && foundIndex === items.length - 1;
    const nextPosition = items[nextIndex].position;
    const updatedCycle = await this.repository.updateState(cycle.id, {
      currentRound: wraps ? cycle.currentRound + 1 : cycle.currentRound,
      nextItemOrder: nextPosition,
    });
    const nextItem = await this.repository.findItemByPosition(
      cycle.id,
      nextPosition,
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
    const studyGroup = await this.studyGroups.findById(studyGroupId, userId);

    if (!studyGroup) {
      throw new NotFoundError("Grupo de estudo não encontrado");
    }
  }
}

export const studyCycleService = new StudyCycleService();
