import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { ValidationError } from "../src/shared/errors.js";
import { parsePagination } from "../src/shared/schemas.js";
import { parseSchema } from "../src/shared/validation.js";

test("parseSchema returns parsed data", () => {
  const schema = z.object({ name: z.string().trim().min(1) });

  assert.deepEqual(parseSchema(schema, { name: "  Ana  " }), { name: "Ana" });
});

test("parseSchema exposes field errors", () => {
  const schema = z.object({ name: z.string().min(1) });

  assert.throws(
    () => parseSchema(schema, {}),
    (error: unknown) =>
      error instanceof ValidationError &&
      error.message === "Dados inválidos" &&
      error.details !== undefined,
  );
});

test("parsePagination applies defaults and validates the maximum", () => {
  assert.deepEqual(parsePagination({}), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(parsePagination({ page: "3", limit: "10" }), {
    page: 3,
    limit: 10,
    skip: 20,
  });
  assert.throws(() => parsePagination({ limit: 101 }), ValidationError);
  assert.throws(() => parsePagination({ page: 0 }), ValidationError);
});
