import fastify from "fastify";
import authPlugin from "./plugins/auth.js";
import databasePlugin from "./plugins/database.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import { registerRoutes } from "./routes/index.js";

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
