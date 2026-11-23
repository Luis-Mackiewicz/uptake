import { z } from "zod";
import { ValidationError } from "../errors/AppError.js";

export function parseSchema<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError("Dados inválidos", {
      issues: result.error.flatten().fieldErrors,
    });
  }

  return result.data;
}
