export function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-space-600 p-10 text-center">
      <p className="text-lg font-medium">Pick an area and two dates, then press Compare.</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">
        Radar satellites see through clouds and work at night, so they are good at spotting floods,
        new buildings, and cleared land. We will show you the before and after images and explain
        the difference in plain words.
      </p>
    </div>
  )
}
