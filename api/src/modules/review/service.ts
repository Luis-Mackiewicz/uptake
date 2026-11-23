import { ConflictError } from "../../errors/AppError.js";
import {
  calculateSkip,
  toPaginated,
  type PaginatedResult,
} from "../../shared/domain.js";
import { CrudService } from "../../shared/crud.service.js";
import { assertFound } from "../../shared/guards.js";
import type { NoteLookup } from "../../shared/ownership.js";
import { noteLookup } from "../note/index.js";
import { Review } from "./entities.js";
import {
  reviewRepository,
  type ReviewUpdateInput,
} from "./repository.js";
import type { CreateReviewData, ReviewQuery } from "./schemas.js";

type ReviewRecord = NonNullable<
  Awaited<ReturnType<typeof reviewRepository.findById>>
>;

export class ReviewService extends CrudService<
  ReviewRecord,
  CreateReviewData,
  ReviewUpdateInput
> {
  private readonly reviewsRepository: typeof reviewRepository;

  constructor(
    repository: typeof reviewRepository = reviewRepository,
    private readonly notes: NoteLookup = noteLookup,
  ) {
    super(repository, "Revisão não encontrada");
    this.reviewsRepository = repository;
  }

  override async create(userId: number, data: CreateReviewData) {
    assertFound(
      await this.notes.findById(data.noteId, userId),
      "Anotação não encontrada",
    );

    const existing = await this.reviewsRepository.findByNote(
      data.noteId,
      userId,
    );

    if (existing?.deletedAt === null) {
      throw new ConflictError("Já existe uma revisão para esta anotação");
    }

    if (existing) {
      return this.reviewsRepository.reactivate(existing.id, userId, data);
    }

    return this.reviewsRepository.create(userId, data);
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
    const { data, total } = await this.reviewsRepository.findMany(
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
    return this.reviewsRepository.update(id, userId, data);
  }

  async complete(userId: number, id: number) {
    const record = await this.findById(userId, id);
    const review = new Review(record.intervalDays, record.reviewCount);

    return this.reviewsRepository.complete(id, userId, review.advance());
  }
}

export const reviewService = new ReviewService();
