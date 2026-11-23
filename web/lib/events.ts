export const RESOURCE_CHANGED_EVENT = "uptake:resource-changed";

export function notifyResourceChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RESOURCE_CHANGED_EVENT));
  }
}
