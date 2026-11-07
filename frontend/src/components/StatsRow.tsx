import type { AnalysisResult } from '../types/analysis'
import { formatKm2, formatPercent } from '../lib/format'

export function StatsRow({ stats }: { stats: AnalysisResult['stats'] }) {
  const items = [
    { label: 'Area looked at', value: formatKm2(stats.analysedAreaKm2) },
    {
      label: 'Changed',
      value: formatPercent(stats.changedPercent),
      sub: formatKm2(stats.changedAreaKm2),
    },
    { label: 'Became darker', value: formatKm2(stats.decreaseKm2), tone: 'text-fall-500' },
    { label: 'Became brighter', value: formatKm2(stats.increaseKm2), tone: 'text-rise-500' },
  ]
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Key numbers">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-space-700 bg-space-900 p-4">
          <dt className="text-xs uppercase tracking-wide text-ink-500">{it.label}</dt>
          <dd className={`mt-1 text-xl font-semibold ${it.tone ?? ''}`}>{it.value}</dd>
          {it.sub && <dd className="text-xs text-ink-500">{it.sub}</dd>}
        </div>
      ))}
    </dl>
  )
}
