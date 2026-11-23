import fp from "fastify-plugin";
import type { FastifyError } from "fastify";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError, ConflictError, NotFoundError } from "../errors/AppError.js";

function mapPrismaError(error: unknown): AppError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new ConflictError("Registro já existe");
    }

    if (error.code === "P2025") {
      return new NotFoundError("Registro não encontrado");
    }
  }

  return null;
}

export default fp(async (app) => {
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.code(404).send({ error: "Not found" });
  });

  app.setErrorHandler(async (error, _request, reply) => {
    const mapped = error instanceof AppError ? error : mapPrismaError(error);

    if (mapped) {
      return reply.code(mapped.statusCode).send({
        error: mapped.message,
        ...mapped.details,
      });
    }

    app.log.error(error);
    const fastifyError = error as FastifyError;
    const statusCode =
      fastifyError.statusCode &&
      fastifyError.statusCode >= 400 &&
      fastifyError.statusCode < 500
        ? fastifyError.statusCode
        : 500;
    const message =
      statusCode === 500 ? "Internal server error" : fastifyError.message;

    return reply.code(statusCode).send({ error: message });
  });
});
