import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import {
  createUserSchema,
  loginSchema,
  parseSchema,
  updateUserSchema,
} from "../schemas/user.schemas.js";
import { authService } from "../services/auth.service.js";

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

  app.get("/auth/me", { preHandler: [app.authenticate] }, async (request) => {
    return authService.getProfile(Number(request.user.sub));
  });

  app.patch("/auth/me", { preHandler: [app.authenticate] }, async (request) => {
    const data = parseSchema(updateUserSchema, request.body);
    return authService.updateProfile(Number(request.user.sub), data);
  });
}
