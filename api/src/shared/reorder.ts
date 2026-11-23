import { ValidationError } from "./errors.js";

export function mergeReorderedIds(
  currentIds: number[],
  requestedIds: number[],
  message: string,
) {
  if (new Set(requestedIds).size !== requestedIds.length) {
    throw new ValidationError(message);
  }

  const currentSet = new Set(currentIds);
  if (requestedIds.some((id) => !currentSet.has(id))) {
    throw new ValidationError(message);
  }

  const moving = new Set(requestedIds);
  const firstIndex = currentIds.findIndex((id) => moving.has(id));
  const remaining = currentIds.filter((id) => !moving.has(id));

  return [
    ...remaining.slice(0, firstIndex),
    ...requestedIds,
    ...remaining.slice(firstIndex),
  ];
}
