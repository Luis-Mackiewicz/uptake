import { ConflictError, NotFoundError } from "../../errors/AppError.js";
import { CrudService } from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type { StudyGroupLookup } from "../../shared/ownership.js";
import { studyGroupLookup } from "../studyGroup/index.js";
import { StudyCycle } from "./entities.js";
import { studyCycleRepository } from "./repository.js";
import type {
  CreateStudyCycleData,
  CreateStudyCycleItemData,
  UpdateStudyCycleData,
  UpdateStudyCycleItemData,
} from "./schemas.js";

type StudyCycleRecord = NonNullable<
  Awaited<ReturnType<typeof studyCycleRepository.findById>>
>;

export class StudyCycleService extends CrudService<
  StudyCycleRecord,
  CreateStudyCycleData,
  UpdateStudyCycleData
> {
  private readonly cyclesRepository: typeof studyCycleRepository;

  constructor(
    repository: typeof studyCycleRepository = studyCycleRepository,
    private readonly studyGroups: StudyGroupLookup = studyGroupLookup,
  ) {
    super(repository, "Ciclo de estudos não encontrado");
    this.cyclesRepository = repository;
  }

  async findItems(userId: number, cycleId: number) {
    await this.findById(userId, cycleId);
    return this.cyclesRepository.findItems(cycleId);
  }

  async addItem(
    userId: number,
    cycleId: number,
    data: CreateStudyCycleItemData,
  ) {
    await this.findById(userId, cycleId);
    await this.ensureStudyGroup(userId, data.studyGroupId);
    const items = await this.cyclesRepository.findItems(cycleId);
    const position =
      data.position ?? (items[items.length - 1]?.position ?? 0) + 1;
    const existing = await this.cyclesRepository.findItemByPosition(
      cycleId,
      position,
    );

    if (existing) {
      throw new ConflictError("Já existe um item nessa posição");
    }

    const created = await this.cyclesRepository.createItem(cycleId, {
      studyGroupId: data.studyGroupId,
      position,
      minutesPerSession: data.minutesPerSession,
    });
    await this.cyclesRepository.normalizeItemPositions(cycleId);
    return this.cyclesRepository.findItemById(created.id, cycleId);
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
    const existing = await this.cyclesRepository.findItemByPosition(
      cycleId,
      position,
      itemId,
    );

    if (existing) {
      throw new ConflictError("Já existe um item nessa posição");
    }

    await this.cyclesRepository.updateItem(itemId, {
      studyGroupId: data.studyGroupId,
      position,
      minutesPerSession: data.minutesPerSession,
    });
    await this.cyclesRepository.normalizeItemPositions(cycleId);
    return this.cyclesRepository.findItemById(itemId, cycleId);
  }

  async removeItem(userId: number, cycleId: number, itemId: number) {
    const item = await this.findItem(userId, cycleId, itemId);
    await this.cyclesRepository.deleteItem(itemId);
    await this.cyclesRepository.normalizeItemPositions(cycleId);
    return item;
  }

  async advance(userId: number, cycleId: number) {
    const record = await this.findById(userId, cycleId);
    const items = await this.cyclesRepository.findItems(cycleId);
    const cycle = new StudyCycle(record.currentRound, record.nextItemOrder);
    const next = cycle.advance(items);

    if (!next) {
      return { cycle: record, nextItem: null };
    }

    const updatedCycle = await this.cyclesRepository.updateState(
      record.id,
      userId,
      next,
    );
    const nextItem = await this.cyclesRepository.findItemByPosition(
      record.id,
      next.nextItemOrder,
    );

    return { cycle: updatedCycle, nextItem };
  }

  private async findItem(userId: number, cycleId: number, itemId: number) {
    await this.findById(userId, cycleId);
    const item = await this.cyclesRepository.findItemById(itemId, cycleId);

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
