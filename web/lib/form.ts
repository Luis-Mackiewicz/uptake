import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiRequestError } from "@/lib/api/client";

export function isBlank(value: string | null | undefined) {
  return !value || value.trim().length === 0;
}

export function nullableTrimmed(value: string) {
  return isBlank(value) ? null : value.trim();
}

export function apiIssueMap(error: unknown) {
  if (!(error instanceof ApiRequestError) || !error.issues) return {};

  const result: Record<string, string> = {};
  Object.entries(error.issues).forEach(([key, messages]) => {
    if (messages[0]) result[key] = messages[0];
  });
  return result;
}

export function applyApiIssues<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: Partial<Record<string, Path<T>>> = {},
) {
  Object.entries(apiIssueMap(error)).forEach(([key, message]) => {
    const field = fieldMap[key] ?? (key as Path<T>);
    setError(field, { type: "server", message });
  });
}
