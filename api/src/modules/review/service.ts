import { ConflictError } from "../../errors/AppError.js";
import {
  calculateSkip,
  toPaginated,
  type PaginatedResult,
  type Pagination,
} from "../../shared/domain.js";
import {
  CrudService,
  type CrudRepository,
} from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type { NoteLookup } from "../../shared/ownership.js";
import { noteLookup } from "../note/index.js";
import { Review } from "./entities.js";
import {
  reviewRepository,
  type ReviewCompleteInput,
  type ReviewUpdateInput,
} from "./repository.js";
import type { CreateReviewData, ReviewQuery } from "./schemas.js";

type ReviewRecord = NonNullable<
  Awaited<ReturnType<typeof reviewRepository.findById>>
>;

interface ReviewRepository
  extends CrudRepository<
    ReviewRecord,
    CreateReviewData,
    ReviewUpdateInput
  > {
  findByNote(
    noteId: number,
    userId: number,
  ): Promise<(ReviewRecord & { deletedAt: Date | null }) | null>;
  findMany(
    userId: number,
    pagination: Pagination,
    due?: boolean,
  ): Promise<{ data: ReviewRecord[]; total: number }>;
  reactivate(
    id: number,
    userId: number,
    data: CreateReviewData,
  ): Promise<ReviewRecord>;
  complete(
    id: number,
    userId: number,
    data: ReviewCompleteInput,
  ): Promise<ReviewRecord>;
}

export class ReviewService extends CrudService<
  ReviewRecord,
  CreateReviewData,
  ReviewUpdateInput,
  ReviewRepository
> {
  constructor(
    repository: ReviewRepository = reviewRepository,
    private readonly notes: NoteLookup = noteLookup,
  ) {
    super(repository, "Revisão não encontrada");
  }

  override async create(userId: number, data: CreateReviewData) {
    assertFound(
      await this.notes.findById(data.noteId, userId),
      "Anotação não encontrada",
    );

    const existing = await this.repository.findByNote(
      data.noteId,
      userId,
    );

    if (existing?.deletedAt === null) {
      throw new ConflictError("Já existe uma revisão para esta anotação");
    }

    if (existing) {
      return this.repository.reactivate(existing.id, userId, data);
    }

    return this.repository.create(userId, data);
  }

  async findAllDue(
    userId: number,
    query: ReviewQuery,
  ): Promise<PaginatedResult<ReviewRecord>> {
    const pagination = {
      page: query.page,
      limit: query.limit,
      skip: calculateSkip(query.page, query.limit),
    };
    const { data, total } = await this.repository.findMany(
      userId,
      pagination,
      query.due,
    );
    return toPaginated(data, total, pagination);
  }

  override async update(
    userId: number,
    id: number,
    data: ReviewUpdateInput,
  ) {
    await this.findById(userId, id);
    return this.repository.update(id, userId, data);
  }

  async complete(userId: number, id: number) {
    const record = await this.findById(userId, id);
    const review = new Review(record.intervalDays, record.reviewCount);

    return this.repository.complete(id, userId, review.advance());
  }
}

export const reviewService = new ReviewService();
