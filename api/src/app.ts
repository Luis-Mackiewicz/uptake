import fastify, { type FastifyInstance } from "fastify";
import authPlugin from "./plugins/auth.js";
import databasePlugin from "./plugins/database.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import { authRoutes } from "./modules/auth/routes.js";
import { contentRoutes } from "./modules/content/routes.js";
import { examRoutes } from "./modules/exam/routes.js";
import { noteRoutes } from "./modules/note/routes.js";
import { pomodoroRoutes } from "./modules/pomodoro/routes.js";
import { reviewRoutes } from "./modules/review/routes.js";
import { studyCycleRoutes } from "./modules/studyCycle/routes.js";
import { studyGroupRoutes } from "./modules/studyGroup/routes.js";

async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes);
  await app.register(studyGroupRoutes);
  await app.register(contentRoutes);
  await app.register(noteRoutes);
  await app.register(examRoutes);
  await app.register(pomodoroRoutes);
  await app.register(studyCycleRoutes);
  await app.register(reviewRoutes);
}

export default async function createApp() {
  const app = fastify({ logger: true });

  await app.register(errorHandlerPlugin);
  await app.register(databasePlugin);

  app.get("/", async () => {
    return { message: "Servidor rodando!" };
  });

  await app.register(authPlugin);
  await registerRoutes(app);

  return app;
}
