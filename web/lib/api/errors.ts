import { ApiRequestError } from "@/lib/api/client";
import { GENERIC_ERROR_MESSAGE, STATUS_MESSAGES } from "@/lib/api/messages";

export function friendlyApiMessage(error: unknown, fallback = GENERIC_ERROR_MESSAGE) {
  if (!(error instanceof ApiRequestError)) return fallback;
  if (error.status >= 500) return fallback;
  if (STATUS_MESSAGES[error.status]) return STATUS_MESSAGES[error.status];
  return error.message || fallback;
}
