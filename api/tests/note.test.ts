import assert from "node:assert/strict";
import { test } from "node:test";
import { NoteService } from "../src/modules/note/service.js";
import type { CreateNoteData, UpdateNoteData } from "../src/modules/note/schemas.js";
import { ValidationError } from "../src/shared/errors.js";

type NoteRepository = NonNullable<ConstructorParameters<typeof NoteService>[0]>;
type NoteRecord = NonNullable<Awaited<ReturnType<NoteRepository["findById"]>>>;
type ContentLookup = NonNullable<ConstructorParameters<typeof NoteService>[1]>;

const now = new Date("2026-01-01T00:00:00.000Z");

function makeNote(data: CreateNoteData | UpdateNoteData): NoteRecord {
  return {
    id: 1,
    title: data.title,
    fileName: data.fileName,
    markdownContent: data.markdownContent,
    mimeType: data.mimeType,
    sizeBytes: data.sizeBytes,
    contentId: data.contentId,
    userId: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function createService() {
  let persisted: CreateNoteData | UpdateNoteData | undefined;

  const repository: NoteRepository = {
    async findById() {
      return null;
    },
    async findMany() {
      return { data: [], total: 0 };
    },
    async create(_userId, data) {
      persisted = data;
      return makeNote(data);
    },
    async update(_id, _userId, data) {
      persisted = data;
      return makeNote(data);
    },
    async softDelete() {
      return makeNote({
        title: "Nota",
        fileName: "nota.md",
        markdownContent: "# Nota",
        mimeType: "text/markdown",
        sizeBytes: 6,
        contentId: 1,
      });
    },
    async findByFileName() {
      return null;
    },
    async reactivate(_id, _userId, data) {
      persisted = data;
      return makeNote(data);
    },
  };

  const contents: ContentLookup = {
    async findById(id, userId) {
      return id === 1 && userId === 1 ? { id, title: "Conteúdo" } : null;
    },
  };

  return { service: new NoteService(repository, contents), persisted: () => persisted };
}

test("note service calculates sizeBytes from markdown content", async () => {
  const { service, persisted } = createService();

  await service.create(1, {
    title: "Nota",
    fileName: "nota.md",
    markdownContent: "# SZ",
    mimeType: "text/markdown",
    sizeBytes: 999,
    contentId: 1,
  });

  assert.equal(persisted()?.sizeBytes, 4);
});

test("note service rejects content larger than 2 MB", async () => {
  const { service } = createService();

  await assert.rejects(
    service.create(1, {
      title: "Nota grande",
      fileName: "grande.md",
      markdownContent: "x".repeat(2 * 1024 * 1024 + 1),
      mimeType: "text/markdown",
      sizeBytes: 0,
      contentId: 1,
    }),
    ValidationError,
  );
});
