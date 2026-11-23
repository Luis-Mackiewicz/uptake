export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-3 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="h-10 w-72 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-neutral-200" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    </div>
  );
}
