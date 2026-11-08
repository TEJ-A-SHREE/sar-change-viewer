import { useMemo, useState, type MouseEvent } from 'react'
import {
  CONTINENT_LABELS,
  CONTINENT_VIEWS,
  createProjection,
  fitBounds,
  pathFor,
  projectBox,
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
import { useReducedMotion } from '../../lib/motion'

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

// Map colours. Land is a desaturated slate so the teal accent reads as "lit".
const C = {
  land: '#1b2540',
  landDim: '#0d1324',
  landLit: '#1e7a73',
  landOpen: '#0a1120', // the focused country, once its states are drawn on top
  edge: '#33426a',
  edgeLit: '#8ff4ea',
  accent: '#4fd1c5',
  stateCovered: '#15404b',
  state: '#172238',
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
  const reducedMotion = useReducedMotion()

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
  const labels = useMemo(
    () =>
      CONTINENT_LABELS.map((l) => {
        const p = projection([l.lon, l.lat]) ?? [0, 0]
        return { name: l.name, x: p[0], y: p[1] }
      }),
    [projection],
  )

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
      // A country split across continents (Russia) zooms to the part on the chosen continent.
      const pieces = countryPaths.filter(
        (p) =>
          p.f.properties.iso3 === focus.iso3 &&
          (!focus.continent || p.f.properties.continent === focus.continent),
      )
      if (pieces.length)
        return fitBounds(unionBounds(pieces.map((p) => p.bounds)), { padding: 0.25 })
    }
    if (focus.continent) {
      const box = CONTINENT_VIEWS[focus.continent]
      const b = box
        ? projectBox(projection, box)
        : unionBounds(
            countryPaths
              .filter((p) => p.f.properties.continent === focus.continent)
              .map((p) => p.bounds),
          )
      return fitBounds(b, { padding: 0.08, maxZoom: 4 })
    }
    return IDENTITY
  }, [level, focus, countryPaths, statePaths, projection])

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
  const worldView = level === 'world'

  // NISAR's orbit, drawn as a slightly inclined ring just outside the disc, with the
  // satellite circling once every 48 s. A motif on the world view, nothing more.
  const orbitRx = MAP_W * 0.51
  const orbitRy = MAP_H * 0.545
  const orbitD = `M ${MAP_W / 2 + orbitRx} ${MAP_H / 2} a ${orbitRx} ${orbitRy} 0 1 0 ${-2 * orbitRx} 0 a ${orbitRx} ${orbitRy} 0 1 0 ${2 * orbitRx} 0`

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
        <filter id="halo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <radialGradient id="ocean" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor="#0c1530" />
          <stop offset="100%" stopColor="#060a16" />
        </radialGradient>
        <radialGradient id="limb" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#8fd9ff" stopOpacity="0.18" />
        </radialGradient>
      </defs>

      {/* Orbit track: outside the zoom group so it never scales. */}
      <g
        transform={`rotate(-8 ${MAP_W / 2} ${MAP_H / 2})`}
        style={{ opacity: worldView ? 1 : 0, transition: 'opacity 600ms' }}
        aria-hidden
      >
        <path
          id="orbit"
          d={orbitD}
          fill="none"
          stroke={C.accent}
          strokeOpacity={0.3}
          strokeWidth={0.9}
          strokeDasharray="2 5"
        />
        <g>
          <circle r={3.2} fill={C.accent} filter="url(#glow)" />
          <circle r={1.4} fill="#eef1fb" />
          {!reducedMotion && (
            <animateMotion dur="48s" repeatCount="indefinite" rotate="auto">
              <mpath href="#orbit" />
            </animateMotion>
          )}
        </g>
      </g>

      <g
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
          transformOrigin: '0 0',
          transition: 'transform 1100ms cubic-bezier(0.22, 0.9, 0.3, 1)',
        }}
      >
        {/* Atmosphere: a soft teal halo just outside the limb. */}
        <path
          d={sphere}
          fill="none"
          stroke={C.accent}
          strokeOpacity={0.28}
          strokeWidth={10}
          filter="url(#halo)"
          style={{ opacity: worldView ? 1 : 0, transition: 'opacity 600ms' }}
        />
        <path d={sphere} fill="url(#ocean)" />
        <path
          d={graticule}
          fill="none"
          stroke={C.accent}
          strokeOpacity={0.07}
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
            isFocusCountry && showStates ? C.landOpen : lit ? C.landLit : dim ? C.landDim : C.land
          const stroke = lit ? C.edgeLit : covered && level !== 'world' ? C.accent : C.edge
          return (
            <path
              key={p.iso3 + p.name + p.continent}
              d={d}
              fill={fill}
              stroke={stroke}
              strokeOpacity={dim ? 0.25 : 0.9}
              strokeWidth={lit ? 1.3 : 0.6}
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
                fill={lit ? C.landLit : covered ? C.stateCovered : C.state}
                stroke={lit ? C.edgeLit : covered ? C.accent : C.edge}
                strokeWidth={lit ? 1.3 : 0.5}
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

        {/* Day/night limb shading over everything, so the disc reads as a planet. */}
        <path d={sphere} fill="url(#limb)" pointerEvents="none" />

        {/* Continent names, world view only. */}
        <g pointerEvents="none" style={{ opacity: worldView ? 1 : 0, transition: 'opacity 400ms' }}>
          {labels.map((l) => (
            <text
              key={l.name}
              x={l.x}
              y={l.y}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={10.5}
              letterSpacing={3}
              fill={hoverContinent === l.name ? '#eef1fb' : '#b4bcd6'}
              fillOpacity={hoverContinent === l.name ? 1 : 0.55}
              style={{ textTransform: 'uppercase', transition: 'fill-opacity 200ms' }}
              paintOrder="stroke"
              stroke="#04060c"
              strokeWidth={3}
              strokeOpacity={0.7}
            >
              {l.name.toUpperCase()}
            </text>
          ))}
        </g>
      </g>
    </svg>
  )
}
