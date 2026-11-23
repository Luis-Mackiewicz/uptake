import { ConflictError, NotFoundError } from "../errors/AppError.js";
import { noteRepository } from "../repositories/note.repository.js";
import { reviewRepository } from "../repositories/review.repository.js";
import {
  toPaginated,
  type Pagination,
} from "../schemas/pagination.schemas.js";
import {
  REVIEW_INTERVALS,
  type CreateReviewData,
  type ReviewInterval,
  type ReviewQuery,
  type UpdateReviewData,
} from "../schemas/review.schemas.js";

export class ReviewService {
  constructor(
    private readonly repository: typeof reviewRepository = reviewRepository,
    private readonly notes: typeof noteRepository = noteRepository,
  ) {}

  async create(userId: number, data: CreateReviewData) {
    const note = await this.notes.findById(data.noteId, userId);

    if (!note) {
      throw new NotFoundError("Anotação não encontrada");
    }

    const input = {
      noteId: data.noteId,
      nextReviewAt: data.nextReviewAt ?? new Date(),
      intervalDays: data.intervalDays ?? 1,
    };
    const existing = await this.repository.findByNote(data.noteId, userId);

    if (existing?.deletedAt === null) {
      throw new ConflictError("Já existe uma revisão para esta anotação");
    }

    if (existing) {
      return this.repository.reactivate(existing.id, input);
    }

    return this.repository.create(userId, input);
  }

  async findAll(userId: number, query: ReviewQuery) {
    const pagination: Pagination = {
      page: query.page,
      limit: query.limit,
      skip: (query.page - 1) * query.limit,
    };
    const { data, total } = await this.repository.findMany(
      userId,
      pagination,
      query.due,
    );
    return toPaginated(data, total, pagination);
  }

  async findById(userId: number, id: number) {
    const review = await this.repository.findById(id, userId);

    if (!review) {
      throw new NotFoundError("Revisão não encontrada");
    }

    return review;
  }

  async update(userId: number, id: number, data: UpdateReviewData) {
    await this.findById(userId, id);
    return this.repository.update(id, data);
  }

  async complete(userId: number, id: number) {
    const review = await this.findById(userId, id);
    const currentIndex = REVIEW_INTERVALS.indexOf(
      review.intervalDays as ReviewInterval,
    );
    const nextIndex = Math.min(
      Math.max(currentIndex, 0) + 1,
      REVIEW_INTERVALS.length - 1,
    );
    const intervalDays = REVIEW_INTERVALS[nextIndex];
    const lastReviewedAt = new Date();
    const nextReviewAt = new Date(
      lastReviewedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000,
    );

    return this.repository.complete(id, {
      lastReviewedAt,
      nextReviewAt,
      intervalDays,
      reviewCount: review.reviewCount + 1,
    });
  }

  async remove(userId: number, id: number) {
    await this.findById(userId, id);
    return this.repository.softDelete(id);
  }
}

export const reviewService = new ReviewService();
