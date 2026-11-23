import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { AuthService } from "../src/modules/auth/service.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../src/shared/errors.js";

type AuthRepository = NonNullable<ConstructorParameters<typeof AuthService>[0]>;
type UserRecord = NonNullable<
  Awaited<ReturnType<AuthRepository["findActiveById"]>>
>;

const user: UserRecord = {
  id: 1,
  firstName: "Ana",
  lastName: "Souza",
  email: "ana@example.com",
  cpf: "52998224725",
  musicUrl: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createRepository(passwordHash: string): AuthRepository {
  let repeatedUser = false;

  return {
    async findByEmailOrCpfIncludingDeleted() {
      return repeatedUser
        ? { id: 1, deletedAt: null }
        : { id: 1, deletedAt: new Date("2025-01-01T00:00:00.000Z") };
    },
    async findActiveByEmailWithPassword() {
      return { id: 1, email: user.email, passwordHash };
    },
    async findActiveById(id) {
      return id === user.id ? user : null;
    },
    async findActiveByCpf() {
      return null;
    },
    async create() {
      return user;
    },
    async reactivate() {
      repeatedUser = true;
      return user;
    },
    async update() {
      return user;
    },
  };
}

test("register reactivates a previously deleted user", async () => {
  const service = new AuthService(createRepository("ignored"));
  const result = await service.register({
    firstName: "Ana",
    lastName: "Souza",
    email: "ana@example.com",
    cpf: "52998224725",
    password: "Senha123",
  });

  assert.equal(result.id, 1);
  await assert.rejects(
    service.register({
      firstName: "Ana",
      lastName: "Souza",
      email: "ana@example.com",
      cpf: "52998224725",
      password: "Senha123",
    }),
    ConflictError,
  );
});

test("authenticate validates the password", async () => {
  const passwordHash = await bcrypt.hash("Senha123", 10);
  const service = new AuthService(createRepository(passwordHash));

  assert.deepEqual(await service.authenticate({
    email: "ana@example.com",
    password: "Senha123",
  }), {
    id: 1,
    email: "ana@example.com",
  });
  await assert.rejects(
    service.authenticate({
      email: "ana@example.com",
      password: "senha-errada",
    }),
    UnauthorizedError,
  );
});

test("getProfile returns 404 for an unknown user", async () => {
  const service = new AuthService(createRepository("ignored"));

  await assert.rejects(service.getProfile(999), NotFoundError);
});
