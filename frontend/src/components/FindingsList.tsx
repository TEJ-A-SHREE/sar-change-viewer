import type { Finding } from '../types/analysis'
import { formatPercent } from '../lib/format'

const severityStyle: Record<Finding['severity'], string> = {
  significant: 'border-l-alert-500',
  notable: 'border-l-rise-500',
  info: 'border-l-signal-500',
}

export function FindingsList({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) return null
  return (
    <section aria-label="Findings">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">
        What we noticed
      </h3>
      <ul className="space-y-2">
        {findings.map((f) => (
          <li
            key={f.title}
            className={`rounded-lg border border-space-700 border-l-4 bg-space-900 p-3 ${severityStyle[f.severity]}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-medium">{f.title}</p>
              {f.percentOfArea !== undefined && (
                <span className="shrink-0 text-xs text-ink-500">
                  {formatPercent(f.percentOfArea)} of area
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-300">{f.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
