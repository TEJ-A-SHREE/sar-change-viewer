import { useState, type FormEvent } from 'react'
import type { AnalysisRequest, BBox } from '../types/analysis'
import { PRESET_REGIONS } from '../lib/regions'

interface Props {
  busy: boolean
  /** Preset id (lib/regions.ts) to start with, e.g. from ?region=kerala. */
  initialRegionId?: string
  onSubmit: (request: AnalysisRequest) => void
}

const inputClass =
  'w-full rounded-md border border-space-600 bg-space-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-signal-500 focus:outline-none'
const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-ink-500'

export function QueryForm({ busy, initialRegionId, onSubmit }: Props) {
  const initialIndex = Math.max(
    0,
    PRESET_REGIONS.findIndex((r) => r.id === initialRegionId),
  )
  const [presetIndex, setPresetIndex] = useState(initialIndex)
  const [bbox, setBbox] = useState<BBox>(PRESET_REGIONS[initialIndex].bbox)
  const [beforeDate, setBeforeDate] = useState('2024-06-01')
  const [afterDate, setAfterDate] = useState('2024-09-01')
  const [error, setError] = useState<string | null>(null)

  function choosePreset(index: number) {
    setPresetIndex(index)
    if (index >= 0) setBbox(PRESET_REGIONS[index].bbox)
  }

  function updateBbox(i: number, value: string) {
    const next = [...bbox] as BBox
    next[i] = Number(value)
    setBbox(next)
    setPresetIndex(-1)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const [minLon, minLat, maxLon, maxLat] = bbox
    if (bbox.some((n) => Number.isNaN(n))) return setError('All four coordinates must be numbers.')
    if (minLon >= maxLon || minLat >= maxLat)
      return setError('West must be less than east, and south less than north.')
    if (beforeDate >= afterDate)
      return setError('The "before" date must be earlier than the "after" date.')
    setError(null)
    onSubmit({
      area: { name: presetIndex >= 0 ? PRESET_REGIONS[presetIndex].name : undefined, bbox },
      beforeDate,
      afterDate,
      source: 'nisar',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-space-700 bg-space-900 p-4 shadow-lg"
      aria-label="Choose an area and two dates"
    >
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="preset" className={labelClass}>
            Area
          </label>
          <select
            id="preset"
            className={inputClass}
            value={presetIndex}
            onChange={(e) => choosePreset(Number(e.target.value))}
          >
            {PRESET_REGIONS.map((r, i) => (
              <option key={r.name} value={i}>
                {r.name}
              </option>
            ))}
            <option value={-1}>Custom coordinates…</option>
          </select>
        </div>
        <div>
          <label htmlFor="before" className={labelClass}>
            Before
          </label>
          <input
            id="before"
            type="date"
            className={inputClass}
            value={beforeDate}
            onChange={(e) => setBeforeDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="after" className={labelClass}>
            After
          </label>
          <input
            id="after"
            type="date"
            className={inputClass}
            value={afterDate}
            onChange={(e) => setAfterDate(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-signal-500 px-5 py-2 text-sm font-semibold text-space-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 md:w-auto"
          >
            {busy ? 'Analysing…' : 'Compare'}
          </button>
        </div>
      </div>

      <details className="mt-3 text-sm" open={presetIndex === -1}>
        <summary className="cursor-pointer text-ink-300">Bounding box (degrees)</summary>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            ['West (min lon)', 'South (min lat)', 'East (max lon)', 'North (max lat)'] as const
          ).map((label, i) => (
            <div key={label}>
              <label className={labelClass}>{label}</label>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={bbox[i]}
                onChange={(e) => updateBbox(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </details>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md border border-alert-500/40 bg-alert-500/10 px-3 py-2 text-sm text-alert-500"
        >
          {error}
        </p>
      )}
    </form>
  )
}
