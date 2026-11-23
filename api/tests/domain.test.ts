import assert from "node:assert/strict";
import { test } from "node:test";
import { Review } from "../src/modules/review/entities.js";
import { StudyCycle } from "../src/modules/studyCycle/entities.js";
import { ValidationError } from "../src/shared/errors.js";

test("review advances through the configured intervals", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const review = new Review(1, 0);

  assert.deepEqual(review.advance(now), {
    lastReviewedAt: now,
    nextReviewAt: new Date("2026-01-04T00:00:00.000Z"),
    intervalDays: 3,
    reviewCount: 1,
  });
  assert.equal(review.advance(now).intervalDays, 7);
});

test("review rejects an invalid state", () => {
  assert.throws(() => new Review(2, 0), ValidationError);
  assert.throws(() => new Review(1, -1), ValidationError);
});

test("study cycle wraps around and increments the round", () => {
  const cycle = new StudyCycle(1, 1);
  const items = [{ position: 1 }, { position: 2 }];

  assert.deepEqual(cycle.advance(items), {
    currentRound: 1,
    nextItemOrder: 2,
  });
  assert.deepEqual(cycle.advance(items), {
    currentRound: 2,
    nextItemOrder: 1,
  });
});

test("study cycle handles an empty list and invalid state", () => {
  assert.equal(new StudyCycle(1, 1).advance([]), null);
  assert.throws(() => new StudyCycle(0, 1), ValidationError);
  assert.throws(() => new StudyCycle(1, 0), ValidationError);
});
