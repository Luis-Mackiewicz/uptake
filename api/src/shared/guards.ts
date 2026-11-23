import { NotFoundError, ValidationError } from "./errors.js";
import {
  isReviewInterval,
  REVIEW_INTERVAL_MESSAGE,
  type ReviewInterval,
} from "./domain.js";

export function assertFound<T>(
  value: T | null | undefined,
  message: string,
): T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }

  return value;
}

export function assertPositiveInteger(value: number, message: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new ValidationError(message);
  }

  return value;
}

export function assertNonNegativeInteger(
  value: number,
  message: string,
): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new ValidationError(message);
  }

  return value;
}

export function assertReviewInterval(value: number): ReviewInterval {
  if (!isReviewInterval(value)) {
    throw new ValidationError(REVIEW_INTERVAL_MESSAGE);
  }

  return value;
}
