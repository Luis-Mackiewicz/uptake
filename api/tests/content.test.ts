import assert from "node:assert/strict";
import { test } from "node:test";
import { ContentService } from "../src/modules/content/service.js";
import {
  listContentsQuerySchema,
  type CreateContentData,
} from "../src/modules/content/schemas.js";
import { toCrudPagination } from "../src/shared/crud.service.js";

type ContentRepository = NonNullable<ConstructorParameters<typeof ContentService>[0]>;
type ContentRecord = NonNullable<Awaited<ReturnType<ContentRepository["findById"]>>>;
type StudyGroupLookup = NonNullable<ConstructorParameters<typeof ContentService>[1]>;
type ActiveLinks = Awaited<ReturnType<ContentRepository["countActiveLinks"]>>;

const now = new Date("2026-01-01T00:00:00.000Z");

function makeContent(data: CreateContentData): ContentRecord {
  return {
    id: 1,
    title: data.title,
    description: data.description ?? null,
    studyGroupId: data.studyGroupId,
    position: 1,
    userId: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function createService(
  studyGroupExists = true,
  activeLinks: ActiveLinks = { notes: 0, exams: 0, cycles: 0 },
) {
  let findManyArgs:
    | { userId: number; pagination: unknown; studyGroupId?: number }
    | undefined;
  let reorderedIds: number[] | undefined;
  let softDeleted = false;
  let normalized = 0;

  const repository: ContentRepository = {
    async findById() {
      return makeContent({ title: "Conteúdo", studyGroupId: 7 });
    },
    async findMany(userId, pagination, studyGroupId) {
      findManyArgs = { userId, pagination, studyGroupId };
      return { data: [], total: 0 };
    },
    async countActiveLinks() {
      return activeLinks;
    },
    async findActiveIds() {
      return [1, 2, 3];
    },
    async findNextPosition() {
      return 4;
    },
    async reorder(_userId, _studyGroupId, ids) {
      reorderedIds = ids;
    },
    async normalizePositions() {
      normalized += 1;
    },
    async create(_userId, data) {
      return makeContent(data);
    },
    async update(_id, _userId, data) {
      return makeContent(data);
    },
    async softDelete() {
      softDeleted = true;
      return makeContent({ title: "Conteúdo", studyGroupId: 7 });
    },
  };

  const studyGroups: StudyGroupLookup = {
    async findById(id, userId) {
      if (studyGroupExists && id === 7 && userId === 1) {
        return { id, name: "Grupo" };
      }
      return null;
    },
  };

  return {
    service: new ContentService(repository, studyGroups),
    findManyArgs: () => findManyArgs,
    reorderedIds: () => reorderedIds,
    softDeleted: () => softDeleted,
    normalized: () => normalized,
  };
}

test("content service filters contents by study group", async () => {
  const { service, findManyArgs } = createService();
  const pagination = toCrudPagination(1, 20);

  const result = await service.findAll(1, pagination, 7);

  assert.equal(result.total, 0);
  assert.deepEqual(findManyArgs(), { userId: 1, pagination, studyGroupId: 7 });
});

test("content service rejects unknown study group when filtering", async () => {
  const { service } = createService(false);

  await assert.rejects(
    service.findAll(1, toCrudPagination(1, 20), 7),
    /Grupo de estudo não encontrado/,
  );
});

test("list contents query coerces studyGroupId and rejects zero", () => {
  assert.equal(
    listContentsQuerySchema.parse({ studyGroupId: "7" }).studyGroupId,
    7,
  );
  assert.equal(listContentsQuerySchema.safeParse({ studyGroupId: 0 }).success, false);
});

test("content service merges a partial reorder with the remaining ids", async () => {
  const { service, reorderedIds } = createService();

  await service.reorder(1, 7, [3, 1]);

  assert.deepEqual(reorderedIds(), [3, 1, 2]);
});

test("content service rejects reordering ids outside the study group", async () => {
  const { service, reorderedIds } = createService();

  await assert.rejects(
    service.reorder(1, 7, [1, 99]),
    /Lista de conteúdos inválida/,
  );
});

test("content service blocks removal when notes are linked", async () => {
  const { service, softDeleted } = createService(true, {
    notes: 1,
    exams: 0,
    cycles: 0,
  });

  await assert.rejects(service.remove(1, 1), /notas vinculadas/);
  assert.equal(softDeleted(), false);
});

test("content service blocks removal when exams are linked", async () => {
  const { service, softDeleted } = createService(true, {
    notes: 0,
    exams: 1,
    cycles: 0,
  });

  await assert.rejects(service.remove(1, 1), /provas vinculadas/);
  assert.equal(softDeleted(), false);
});

test("content service blocks removal when cycles are linked", async () => {
  const { service, softDeleted } = createService(true, {
    notes: 0,
    exams: 0,
    cycles: 1,
  });

  await assert.rejects(service.remove(1, 1), /ciclos vinculados/);
  assert.equal(softDeleted(), false);
});

test("content service removes content without active links", async () => {
  const { service, softDeleted, normalized } = createService();

  await service.remove(1, 1);

  assert.equal(softDeleted(), true);
  assert.equal(normalized(), 1);
});
