export function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <div className="h-8 w-2/3 animate-pulse rounded bg-space-800" />
      <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-space-800" />
      <div className="h-20 w-full animate-pulse rounded-xl bg-space-800" />
      <span className="sr-only">Fetching and comparing satellite scenes…</span>
    </div>
  )
}
