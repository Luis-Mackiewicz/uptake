import { NotFoundError } from "../errors/AppError.js";

export function assertFound<T>(
  value: T | null | undefined,
  message: string,
): T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }

  return value;
}
