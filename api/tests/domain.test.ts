import assert from "node:assert/strict";
import { test } from "node:test";
import { StudyCycle } from "../src/modules/studyCycle/entities.js";
import { ValidationError } from "../src/shared/errors.js";

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
