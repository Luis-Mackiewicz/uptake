import assert from "node:assert/strict";
import { test } from "node:test";
import { NoteFile } from "../src/modules/note/entities.js";
import { StudyCycle } from "../src/modules/studyCycle/entities.js";
import { toPaginated } from "../src/shared/domain.js";
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

test("study cycle validates state through setters", () => {
  const cycle = new StudyCycle(1, 1);

  cycle.currentRound = 2;
  cycle.nextItemOrder = 3;

  assert.equal(cycle.currentRound, 2);
  assert.equal(cycle.nextItemOrder, 3);
  assert.throws(() => {
    cycle.currentRound = 0;
  }, ValidationError);
  assert.throws(() => {
    cycle.nextItemOrder = 0;
  }, ValidationError);
});

test("note file computes and validates content size", () => {
  const note = new NoteFile({
    title: "Nota",
    fileName: "nota.md",
    markdownContent: "conteúdo",
    contentId: 1,
  });

  assert.equal(note.sizeBytes, Buffer.byteLength("conteúdo", "utf8"));
  assert.throws(() => {
    note.markdownContent = "x".repeat(2 * 1024 * 1024 + 1);
  }, ValidationError);
  assert.throws(
    () =>
      new NoteFile({
        title: "Nota",
        fileName: "nota.md",
        markdownContent: "conteúdo",
        contentId: 0,
      }),
    ValidationError,
  );
});

test("toPaginated returns page metadata", () => {
  assert.deepEqual(toPaginated(["a", "b"], 5, { page: 2, limit: 2, skip: 2 }), {
    data: ["a", "b"],
    page: 2,
    limit: 2,
    total: 5,
    totalPages: 3,
  });
});
