import type { AnalysisResult } from '../types/analysis'

const confidenceCopy = {
  high: { label: 'High confidence', cls: 'text-signal-500 border-signal-500/40' },
  medium: { label: 'Medium confidence', cls: 'text-rise-500 border-rise-500/40' },
  low: { label: 'Low confidence', cls: 'text-alert-500 border-alert-500/40' },
}

export function SummaryCard({ summary }: { summary: AnalysisResult['summary'] }) {
  const c = confidenceCopy[summary.confidence]
  return (
    <section
      className="rounded-xl border border-space-700 bg-space-900 p-5"
      aria-label="Plain-language summary"
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-500">
        In plain words
      </p>
      <h2 className="text-2xl font-semibold leading-snug">{summary.headline}</h2>
      <p className="mt-3 text-ink-300">{summary.plain}</p>
      <span className={`mt-4 inline-block rounded-full border px-2.5 py-0.5 text-xs ${c.cls}`}>
        {c.label}
      </span>
    </section>
  )
}
