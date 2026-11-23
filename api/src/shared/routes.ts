import type { FastifyInstance } from "fastify";

export async function privatePlugin(
  app: FastifyInstance,
  register: (privateApp: FastifyInstance) => void,
): Promise<void> {
  await app.register(async (privateApp) => {
    privateApp.addHook("preHandler", privateApp.authenticate);
    register(privateApp);
  });
}
