import fastify, { type FastifyError } from "fastify";
import { AppError } from "./errors/AppError.js";
import { prisma } from "./lib/prisma.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.routes.js";
import { contentRoutes } from "./routes/content.routes.js";
import { examRoutes } from "./routes/exam.routes.js";
import { noteRoutes } from "./routes/note.routes.js";
import { studyGroupRoutes } from "./routes/studyGroup.routes.js";

export default async function createApp() {
  const app = fastify({ logger: true });

  app.setNotFoundHandler(async (_request, reply) => {
    return reply.code(404).send({ error: "Not found" });
  });

  app.setErrorHandler(async (error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.message,
        ...error.details,
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

  app.get("/", async () => {
    return { message: "Servidor rodando!" };
  });

  await app.register(authPlugin);
  await app.register(authRoutes);
  await app.register(studyGroupRoutes);
  await app.register(contentRoutes);
  await app.register(noteRoutes);
  await app.register(examRoutes);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
}
