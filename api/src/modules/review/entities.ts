import {
  REVIEW_INTERVALS,
  type ReviewInterval,
} from "../../shared/domain.js";
import {
  assertNonNegativeInteger,
  assertReviewInterval,
} from "../../shared/guards.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export class Review {
  #intervalDays: ReviewInterval;
  #reviewCount: number;

  constructor(intervalDays: number, reviewCount: number) {
    this.#intervalDays = assertReviewInterval(intervalDays);
    this.#reviewCount = assertNonNegativeInteger(
      reviewCount,
      "Contador de revisões inválido",
    );
  }

  advance(now = new Date()) {
    const currentIndex = REVIEW_INTERVALS.indexOf(this.#intervalDays);
    const nextIndex = Math.min(
      currentIndex + 1,
      REVIEW_INTERVALS.length - 1,
    );

    this.#intervalDays = REVIEW_INTERVALS[nextIndex];
    this.#reviewCount += 1;

    return {
      lastReviewedAt: now,
      nextReviewAt: new Date(now.getTime() + this.#intervalDays * DAY_IN_MS),
      intervalDays: this.#intervalDays,
      reviewCount: this.#reviewCount,
    };
  }
}
