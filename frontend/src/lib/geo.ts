import { geoNaturalEarth1, geoPath, geoGraticule10, type GeoProjection } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

export const MAP_W = 1000
export const MAP_H = 520

export interface CountryProps {
  name: string
  iso3: string
  continent: string
}
export interface StateProps {
  name: string
  code: string | null
}

export type CountryFeature = Feature<Geometry, CountryProps>
export type StateFeature = Feature<Geometry, StateProps>
export type WorldData = FeatureCollection<Geometry, CountryProps>
export type StatesData = FeatureCollection<Geometry, StateProps>

export type Bounds = [[number, number], [number, number]]

export function createProjection(): GeoProjection {
  return geoNaturalEarth1().fitExtent(
    [
      [12, 12],
      [MAP_W - 12, MAP_H - 12],
    ],
    { type: 'Sphere' },
  )
}

export const pathFor = (projection: GeoProjection) => geoPath(projection)

export const GRATICULE = geoGraticule10()

/**
 * Fixed lon/lat view boxes per continent: [[west, south], [east, north]].
 *
 * These are hand-set rather than derived from country extents, because
 * territories such as Alaska's Aleutians or Fiji cross the antimeridian and
 * would otherwise stretch a continent's zoom to the whole globe.
 */
export const CONTINENT_VIEWS: Record<string, Bounds> = {
  'North America': [
    [-168, 7],
    [-52, 74],
  ],
  'South America': [
    [-82, -56],
    [-34, 13],
  ],
  Europe: [
    [-25, 34],
    [45, 72],
  ],
  Africa: [
    [-18, -35],
    [52, 38],
  ],
  Asia: [
    [26, -11],
    [150, 78],
  ],
  Oceania: [
    [112, -48],
    [180, -1],
  ],
}

/** Where each continent's name sits on the world view. */
export const CONTINENT_LABELS: { name: string; lon: number; lat: number }[] = [
  { name: 'North America', lon: -103, lat: 47 },
  { name: 'South America', lon: -60, lat: -16 },
  { name: 'Europe', lon: 20, lat: 55 },
  { name: 'Africa', lon: 18, lat: 6 },
  { name: 'Asia', lon: 88, lat: 48 },
  { name: 'Oceania', lon: 137, lat: -26 },
]

/** Project a lon/lat box to pixel bounds by sampling its edges (edges curve). */
export function projectBox(projection: GeoProjection, box: Bounds, samples = 24): Bounds {
  const [[w, s], [e, n]] = box
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const pts: [number, number][] = [
      [w + (e - w) * t, s],
      [w + (e - w) * t, n],
      [w, s + (n - s) * t],
      [e, s + (n - s) * t],
    ]
    for (const p of pts) {
      const q = projection(p)
      if (!q) continue
      x0 = Math.min(x0, q[0])
      y0 = Math.min(y0, q[1])
      x1 = Math.max(x1, q[0])
      y1 = Math.max(y1, q[1])
    }
  }
  return [
    [x0, y0],
    [x1, y1],
  ]
}

export interface ViewTransform {
  k: number
  x: number
  y: number
}

export const IDENTITY: ViewTransform = { k: 1, x: 0, y: 0 }

/** Zoom so that `bounds` (projected px) fills the map with some padding. */
export function fitBounds(bounds: Bounds, { padding = 0.18, maxZoom = 14 } = {}): ViewTransform {
  const [[x0, y0], [x1, y1]] = bounds
  const w = Math.max(x1 - x0, 1)
  const h = Math.max(y1 - y0, 1)
  const k = Math.min(maxZoom, (1 - padding) / Math.max(w / MAP_W, h / MAP_H))
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return { k, x: MAP_W / 2 - k * cx, y: MAP_H / 2 - k * cy }
}

export function unionBounds(boundsList: Bounds[]): Bounds {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const [[a, b], [c, d]] of boundsList) {
    if (!Number.isFinite(a + b + c + d)) continue
    x0 = Math.min(x0, a)
    y0 = Math.min(y0, b)
    x1 = Math.max(x1, c)
    y1 = Math.max(y1, d)
  }
  return [
    [x0, y0],
    [x1, y1],
  ]
}

export async function loadJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`)
  return (await r.json()) as T
}
