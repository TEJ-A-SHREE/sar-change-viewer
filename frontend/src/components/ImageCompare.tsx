import { useState } from 'react'
import type { AnalysisResult } from '../types/analysis'
import { formatDate } from '../lib/format'

type View = 'before' | 'after' | 'change'

interface Props {
  images: AnalysisResult['images']
  beforeDate: string
  afterDate: string
}

export function ImageCompare({ images, beforeDate, afterDate }: Props) {
  const [view, setView] = useState<View>('change')
  const tabs: { id: View; label: string }[] = [
    { id: 'before', label: `Before · ${formatDate(beforeDate)}` },
    { id: 'after', label: `After · ${formatDate(afterDate)}` },
    { id: 'change', label: 'What changed' },
  ]
  const current = images[view]

  return (
    <section
      className="rounded-xl border border-space-700 bg-space-900 p-4"
      aria-label="Satellite images"
    >
      <div role="tablist" className="mb-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={view === t.id}
            onClick={() => setView(t.id)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              view === t.id
                ? 'bg-signal-500 text-space-950'
                : 'bg-space-800 text-ink-300 hover:bg-space-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <figure>
        <div className="overflow-hidden rounded-lg border border-space-700 bg-black">
          <img
            src={current.url}
            alt={current.caption}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
        </div>
        <figcaption className="mt-2 text-sm text-ink-300">{current.caption}</figcaption>
      </figure>

      {view === 'change' && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-300">
          {images.change.legend.map((l) => (
            <li key={l.label} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: l.color }}
                aria-hidden
              />
              {l.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
