import assert from "node:assert/strict";
import { test } from "node:test";
import { StudyGroupService } from "../src/modules/studyGroup/service.js";

type StudyGroupRepository = NonNullable<
  ConstructorParameters<typeof StudyGroupService>[0]
>;
type StudyGroupRecord = NonNullable<
  Awaited<ReturnType<StudyGroupRepository["findById"]>>
>;
type ActiveLinks = Awaited<ReturnType<StudyGroupRepository["countActiveLinks"]>>;

const now = new Date("2026-01-01T00:00:00.000Z");

function makeGroup(name = "Grupo"): StudyGroupRecord {
  return {
    id: 7,
    name,
    description: null,
    userId: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function createService(links: ActiveLinks = { contents: 0, exams: 0, cycles: 0 }) {
  let softDeleted = false;

  const repository: StudyGroupRepository = {
    async findById(id, userId) {
      return id === 7 && userId === 1 ? makeGroup() : null;
    },
    async findMany() {
      return { data: [], total: 0 };
    },
    async create(_userId, data) {
      return makeGroup(data.name);
    },
    async update(_id, _userId, data) {
      return makeGroup(data.name);
    },
    async softDelete() {
      softDeleted = true;
      return makeGroup();
    },
    async findByName() {
      return null;
    },
    async countActiveLinks() {
      return links;
    },
    async reactivate(_id, _userId, data) {
      return makeGroup(data.name);
    },
  };

  return {
    service: new StudyGroupService(repository),
    softDeleted: () => softDeleted,
  };
}

test("study group service blocks removal when contents are linked", async () => {
  const { service, softDeleted } = createService({
    contents: 1,
    exams: 0,
    cycles: 0,
  });

  await assert.rejects(service.remove(1, 7), /conteúdos vinculados/);
  assert.equal(softDeleted(), false);
});

test("study group service blocks removal when exams are linked", async () => {
  const { service, softDeleted } = createService({
    contents: 0,
    exams: 1,
    cycles: 0,
  });

  await assert.rejects(service.remove(1, 7), /provas vinculadas/);
  assert.equal(softDeleted(), false);
});

test("study group service blocks removal when cycles are linked", async () => {
  const { service, softDeleted } = createService({
    contents: 0,
    exams: 0,
    cycles: 1,
  });

  await assert.rejects(service.remove(1, 7), /ciclos vinculados/);
  assert.equal(softDeleted(), false);
});

test("study group service removes a group without active links", async () => {
  const { service, softDeleted } = createService();

  await service.remove(1, 7);

  assert.equal(softDeleted(), true);
});
