import type { FastifyInstance } from "fastify";
import { env } from "../../config/env.js";
import { privatePlugin } from "../../shared/routes.js";
import { parseSchema } from "../../shared/validation.js";
import { createUserSchema, loginSchema, updateUserSchema } from "./schemas.js";
import { authService } from "./service.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const data = parseSchema(createUserSchema, request.body);
    const user = await authService.register(data);
    return reply.status(201).send(user);
  });

  app.post("/auth/login", async (request) => {
    const data = parseSchema(loginSchema, request.body);
    const user = await authService.authenticate(data);
    const token = app.jwt.sign(
      { sub: String(user.id), email: user.email },
      { expiresIn: env.jwtExpiresIn },
    );
    return { token };
  });

  await privatePlugin(app, (privateApp) => {
    privateApp.get("/auth/me", async (request) => {
      return authService.getProfile(request.userId);
    });

    privateApp.patch("/auth/me", async (request) => {
      const data = parseSchema(updateUserSchema, request.body);
      return authService.updateProfile(request.userId, data);
    });
  });
}
