import { useMemo, useState, type MouseEvent } from 'react'
import {
  createProjection,
  fitBounds,
  pathFor,
  unionBounds,
  GRATICULE,
  IDENTITY,
  MAP_H,
  MAP_W,
  type CountryFeature,
  type StateFeature,
  type ViewTransform,
  type WorldData,
  type StatesData,
} from '../../lib/geo'

export interface Focus {
  continent?: string
  iso3?: string
  stateName?: string
}

interface Props {
  world: WorldData
  states: StatesData | null
  focus: Focus
  /** Countries (iso3) and states (name) that have verified coverage. */
  coveredCountries: Set<string>
  coveredStates: Set<string>
  onHover: (label: string | null) => void
  onPickContinent: (continent: string) => void
  onPickCountry: (feature: CountryFeature) => void
  onPickState: (feature: StateFeature) => void
}

/**
 * SVG world map. All geometry is projected once; zooming is a CSS transform on
 * the inner <g>, so the browser animates it for free.
 */
export function WorldMap({
  world,
  states,
  focus,
  coveredCountries,
  coveredStates,
  onHover,
  onPickContinent,
  onPickCountry,
  onPickState,
}: Props) {
  const projection = useMemo(() => createProjection(), [])
  const path = useMemo(() => pathFor(projection), [projection])

  const countryPaths = useMemo(
    () =>
      world.features.map((f) => ({
        f,
        d: path(f) ?? '',
        bounds: path.bounds(f),
      })),
    [world, path],
  )
  const statePaths = useMemo(
    () =>
      states ? states.features.map((f) => ({ f, d: path(f) ?? '', bounds: path.bounds(f) })) : [],
    [states, path],
  )
  const graticule = useMemo(() => path(GRATICULE) ?? '', [path])
  const sphere = useMemo(() => path({ type: 'Sphere' }) ?? '', [path])

  const [hoverContinent, setHoverContinent] = useState<string | null>(null)
  const [hoverKey, setHoverKey] = useState<string | null>(null)

  const level = focus.stateName
    ? 'state'
    : focus.iso3
      ? 'country'
      : focus.continent
        ? 'continent'
        : 'world'

  // Where should the camera be?
  const view: ViewTransform = useMemo(() => {
    if (level === 'state' && focus.stateName) {
      const s = statePaths.find((p) => p.f.properties.name === focus.stateName)
      if (s) return fitBounds(s.bounds, { padding: 0.3 })
    }
    if ((level === 'country' || level === 'state') && focus.iso3) {
      const c = countryPaths.find((p) => p.f.properties.iso3 === focus.iso3)
      if (c) return fitBounds(c.bounds, { padding: 0.25 })
    }
    if (focus.continent) {
      const b = unionBounds(
        countryPaths
          .filter((p) => p.f.properties.continent === focus.continent)
          .map((p) => p.bounds),
      )
      return fitBounds(b, { padding: 0.12, maxZoom: 4 })
    }
    return IDENTITY
  }, [level, focus, countryPaths, statePaths])

  function enterCountry(f: CountryFeature) {
    setHoverContinent(f.properties.continent)
    setHoverKey(f.properties.iso3)
    onHover(level === 'world' ? f.properties.continent : f.properties.name)
  }
  function leave() {
    setHoverContinent(null)
    setHoverKey(null)
    onHover(null)
  }
  function clickCountry(e: MouseEvent, f: CountryFeature) {
    e.stopPropagation()
    if (level === 'world') onPickContinent(f.properties.continent)
    else if (level === 'continent') onPickCountry(f)
    else if (f.properties.iso3 !== focus.iso3) onPickCountry(f)
  }

  const showStates = (level === 'country' || level === 'state') && statePaths.length > 0

  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="h-full w-full select-none overflow-visible"
      role="img"
      aria-label="Interactive world map"
      onMouseLeave={leave}
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* States are viewed at high zoom, so the blur must be much smaller in map units. */}
        <filter id="glow-sm" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="ocean" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#0d1730" />
          <stop offset="100%" stopColor="#05070e" />
        </radialGradient>
      </defs>

      <g
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
          transformOrigin: '0 0',
          transition: 'transform 1100ms cubic-bezier(0.22, 0.9, 0.3, 1)',
        }}
      >
        <path
          d={sphere}
          fill="url(#ocean)"
          stroke="#4fd1c5"
          strokeOpacity={0.35}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={graticule}
          fill="none"
          stroke="#4fd1c5"
          strokeOpacity={0.08}
          vectorEffect="non-scaling-stroke"
        />

        {countryPaths.map(({ f, d }) => {
          const p = f.properties
          const inFocusContinent = !focus.continent || p.continent === focus.continent
          const isFocusCountry = p.iso3 === focus.iso3
          const covered = coveredCountries.has(p.iso3)
          const lit =
            level === 'world'
              ? hoverContinent === p.continent
              : level === 'continent'
                ? hoverKey === p.iso3
                : isFocusCountry
          // Outside the chosen continent, or (once a country is open) any other country, fades back.
          const dim = (level !== 'world' && !inFocusContinent) || (showStates && !isFocusCountry)
          const fill =
            isFocusCountry && showStates ? '#0a1222' : lit ? '#1b6f6b' : dim ? '#0a0f1c' : '#121b30'
          const stroke = lit ? '#7ff5ea' : covered && level !== 'world' ? '#4fd1c5' : '#2c3759'
          return (
            <path
              key={p.iso3 + p.name}
              d={d}
              fill={fill}
              stroke={stroke}
              strokeOpacity={dim ? 0.3 : 0.9}
              strokeWidth={lit ? 1.4 : 0.6}
              vectorEffect="non-scaling-stroke"
              filter={lit && level !== 'country' && level !== 'state' ? 'url(#glow)' : undefined}
              className={`cursor-pointer transition-[fill] duration-200 ${
                covered && level === 'continent' && !lit ? 'map-pulse' : ''
              }`}
              onMouseEnter={() => enterCountry(f)}
              onMouseMove={() => hoverKey !== p.iso3 && enterCountry(f)}
              onClick={(e) => clickCountry(e, f)}
            />
          )
        })}

        {showStates &&
          statePaths.map(({ f, d }) => {
            const name = f.properties.name
            const covered = coveredStates.has(name)
            const lit = hoverKey === `state:${name}` || focus.stateName === name
            return (
              <path
                key={name}
                d={d}
                fill={lit ? '#1b6f6b' : covered ? '#163a4a' : '#182540'}
                stroke={lit ? '#7ff5ea' : covered ? '#4fd1c5' : '#2c3759'}
                strokeWidth={lit ? 1.4 : 0.5}
                strokeOpacity={covered ? 1 : 0.6}
                vectorEffect="non-scaling-stroke"
                filter={lit ? 'url(#glow-sm)' : undefined}
                className={`transition-[fill] duration-200 ${covered ? 'cursor-pointer' : 'cursor-not-allowed'} ${
                  covered && !lit ? 'map-pulse' : ''
                }`}
                onMouseEnter={() => {
                  setHoverKey(`state:${name}`)
                  onHover(name + (covered ? '' : ' · no verified data'))
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (covered) onPickState(f)
                }}
              />
            )
          })}
      </g>
    </svg>
  )
}
