import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { WorldMap, type Focus } from '../components/map/WorldMap'
import { HudPanel, type HudItem } from '../components/map/HudPanel'
import { COVERAGE, CONTINENTS, countriesIn, findCountry, type Continent } from '../data/coverage'
import { loadJson, type StatesData, type WorldData } from '../lib/geo'

/**
 * Game-like entry screen: hover a continent, click to open it, pick a country
 * with verified analyses, then a state, then jump into the compare tool.
 */
export function ExplorePage() {
  const navigate = useNavigate()
  const [world, setWorld] = useState<WorldData | null>(null)
  const [statesData, setStatesData] = useState<{ iso3: string; data: StatesData } | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  // The selection lives in the URL so any level can be linked to or shared,
  // e.g. /?continent=Asia&country=IND&state=Kerala
  const [params, setParams] = useSearchParams()
  const focus = useMemo<Focus>(
    () => ({
      continent: params.get('continent') ?? undefined,
      iso3: params.get('country') ?? undefined,
      stateName: params.get('state') ?? undefined,
    }),
    [params],
  )
  const setFocus = useCallback(
    (next: Focus | ((cur: Focus) => Focus)) => {
      const value = typeof next === 'function' ? next(focus) : next
      const p = new URLSearchParams()
      if (value.continent) p.set('continent', value.continent)
      if (value.iso3) p.set('country', value.iso3)
      if (value.stateName) p.set('state', value.stateName)
      setParams(p)
    },
    [focus, setParams],
  )
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    loadJson<WorldData>('/data/world.json')
      .then(setWorld)
      .catch((e) => setLoadError(String(e)))
  }, [])

  // Load state boundaries when a country is opened (ignored if none exist).
  useEffect(() => {
    const iso3 = focus.iso3
    if (!iso3) return
    loadJson<StatesData>(`/data/states/${iso3}.json`)
      .then((data) => setStatesData({ iso3, data }))
      .catch(() => undefined)
  }, [focus.iso3])
  const states = statesData && statesData.iso3 === focus.iso3 ? statesData.data : null

  const goBack = useCallback(() => {
    setFocus((f) => {
      if (f.stateName) return { continent: f.continent, iso3: f.iso3 }
      if (f.iso3) return { continent: f.continent }
      return {}
    })
  }, [setFocus])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && goBack()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goBack])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const coveredCountries = useMemo(
    () =>
      new Set(
        Object.values(COVERAGE)
          .flat()
          .map((c) => c.iso3),
      ),
    [],
  )
  const coveredStates = useMemo(
    () => new Set(focus.iso3 ? (findCountry(focus.iso3)?.states.map((s) => s.name) ?? []) : []),
    [focus.iso3],
  )

  const country = focus.iso3 ? findCountry(focus.iso3) : undefined
  const state = country?.states.find((s) => s.name === focus.stateName)

  // ---- Panel contents per level ------------------------------------------
  let panel: {
    eyebrow: string
    title: string
    items: HudItem[]
    empty: string
    footer?: ReactNode
  } | null = null

  if (focus.stateName && state && country) {
    panel = {
      eyebrow: `${focus.continent} / ${country.name}`,
      title: state.name,
      items: [
        {
          key: 'pairs',
          label: 'Verified scene pairs',
          sub: String(state.scenePairs),
          available: true,
          fact: true,
        },
        {
          key: 'latest',
          label: 'Latest usable scene',
          sub: state.latestScene,
          available: true,
          fact: true,
        },
        ...(state.note
          ? [{ key: 'note', label: 'Notes', sub: state.note, available: true, fact: true }]
          : []),
      ],
      empty: '',
      footer: (
        <button
          type="button"
          onClick={() => navigate(`/compare?region=${state.regionId}`)}
          className="rounded-md bg-signal-500 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-space-950 hover:brightness-110"
        >
          Open analysis →
        </button>
      ),
    }
  } else if (focus.iso3 && country) {
    const all = states?.features.map((f) => f.properties.name) ?? country.states.map((s) => s.name)
    const sorted = [...all].sort(
      (a, b) => Number(coveredStates.has(b)) - Number(coveredStates.has(a)) || a.localeCompare(b),
    )
    panel = {
      eyebrow: `${focus.continent} / ${country.name}`,
      title: 'States & territories',
      items: sorted.map((name) => ({
        key: name,
        label: name,
        available: coveredStates.has(name),
        onSelect: () => setFocus((f) => ({ ...f, stateName: name })),
      })),
      empty: 'No verified regions in this country yet.',
    }
  } else if (focus.continent) {
    const covered = countriesIn(focus.continent as Continent)
    const names = world
      ? world.features
          .filter((f) => f.properties.continent === focus.continent)
          .map((f) => f.properties)
      : []
    const sorted = names.sort(
      (a, b) =>
        Number(coveredCountries.has(b.iso3)) - Number(coveredCountries.has(a.iso3)) ||
        a.name.localeCompare(b.name),
    )
    panel = {
      eyebrow: 'Continent',
      title: focus.continent,
      items: sorted.map((p) => ({
        key: p.iso3 + p.name,
        label: p.name,
        sub: coveredCountries.has(p.iso3)
          ? `${covered.find((c) => c.iso3 === p.iso3)?.states.length ?? 0} verified region(s)`
          : undefined,
        available: coveredCountries.has(p.iso3),
        onSelect: () => setFocus({ continent: focus.continent, iso3: p.iso3 }),
      })),
      empty: 'No verified coverage on this continent yet.',
    }
  }

  const crumbs = [
    { label: 'World', onClick: () => setFocus({}) },
    ...(focus.continent
      ? [{ label: focus.continent, onClick: () => setFocus({ continent: focus.continent }) }]
      : []),
    ...(country
      ? [
          {
            label: country.name,
            onClick: () => setFocus({ continent: focus.continent, iso3: focus.iso3 }),
          },
        ]
      : []),
    ...(state ? [{ label: state.name, onClick: () => undefined }] : []),
  ]

  const verifiedCount = Object.values(COVERAGE)
    .flat()
    .reduce((n, c) => n + c.states.length, 0)

  return (
    <div
      className="explore-bg relative h-screen w-screen overflow-hidden"
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      onClick={() => focus.continent && !focus.iso3 && setFocus({})}
    >
      <div className="scanlines pointer-events-none absolute inset-0" aria-hidden />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5">
        <div className="pointer-events-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-signal-500/80">
            SAR Change Viewer
          </p>
          <nav
            className="mt-1 flex flex-wrap items-center gap-2 font-mono text-sm uppercase tracking-widest"
            aria-label="Breadcrumb"
          >
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex items-center gap-2">
                {i > 0 && <span className="text-ink-500">/</span>}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    c.onClick()
                  }}
                  className={
                    i === crumbs.length - 1 ? 'text-ink-100' : 'text-ink-500 hover:text-signal-500'
                  }
                >
                  {c.label}
                </button>
              </span>
            ))}
          </nav>
        </div>
        <div className="pointer-events-auto flex items-center gap-4 font-mono text-xs uppercase tracking-widest">
          <span className="hidden text-ink-500 sm:inline">
            <span className="text-signal-500">{verifiedCount}</span> verified region
            {verifiedCount === 1 ? '' : 's'}
          </span>
          <Link
            to="/compare"
            className="rounded-sm border border-signal-500/40 px-3 py-1.5 text-signal-500 hover:bg-signal-500/10"
          >
            Compare tool
          </Link>
        </div>
      </div>

      {/* Map */}
      <div
        className={`absolute inset-0 flex items-center justify-center px-4 pt-20 pb-16 transition-[padding] duration-500 ${panel ? 'lg:pr-[24rem]' : ''}`}
      >
        {loadError && <p className="text-alert-500">{loadError}</p>}
        {!world && !loadError && (
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-500">Loading map…</p>
        )}
        {world && (
          <WorldMap
            world={world}
            states={states}
            focus={focus}
            coveredCountries={coveredCountries}
            coveredStates={coveredStates}
            onHover={setHoverLabel}
            onPickContinent={(c) => setFocus({ continent: c })}
            onPickCountry={(f) => {
              if (coveredCountries.has(f.properties.iso3))
                setFocus({ continent: f.properties.continent, iso3: f.properties.iso3 })
              else setToast(`${f.properties.name}: no verified data yet`)
            }}
            onPickState={(f) => setFocus((cur) => ({ ...cur, stateName: f.properties.name }))}
          />
        )}
      </div>

      {/* Cursor label */}
      {hoverLabel && (
        <div
          className="pointer-events-none fixed z-30 -translate-y-full rounded-sm border border-signal-500/50 bg-space-950/80 px-2 py-1 font-mono text-xs uppercase tracking-widest text-signal-500 backdrop-blur"
          style={{ left: cursor.x + 14, top: cursor.y - 10 }}
        >
          {hoverLabel}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-sm border border-rise-500/50 bg-space-950/80 px-4 py-2 font-mono text-xs uppercase tracking-widest text-rise-500 backdrop-blur">
          {toast}
        </div>
      )}

      {/* Panel */}
      <div
        className={`pointer-events-none absolute top-24 right-5 z-20 transition-all duration-500 ${
          panel ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {panel && (
          <HudPanel
            eyebrow={panel.eyebrow}
            title={panel.title}
            items={panel.items}
            emptyText={panel.empty}
            footer={panel.footer}
            onBack={goBack}
          />
        )}
      </div>

      {/* Hint */}
      <p className="pointer-events-none absolute bottom-5 left-5 z-20 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-500">
        {!focus.continent && 'Hover a continent · click to open'}
        {focus.continent && !focus.iso3 && 'Pick a highlighted country · esc to go back'}
        {focus.iso3 && !focus.stateName && 'Pick a highlighted state · esc to go back'}
        {focus.stateName && 'Open the analysis · esc to go back'}
      </p>

      {/* Continent quick-select for keyboards / small screens */}
      <div className="pointer-events-auto absolute bottom-5 right-5 z-20 hidden gap-1 md:flex">
        {CONTINENTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setFocus({ continent: c })
            }}
            className={`rounded-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-widest transition ${
              focus.continent === c
                ? 'border-signal-500 text-signal-500'
                : 'border-space-600 text-ink-500 hover:border-signal-500/50 hover:text-ink-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}
