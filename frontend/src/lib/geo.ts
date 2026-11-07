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

export interface ViewTransform {
  k: number
  x: number
  y: number
}

export const IDENTITY: ViewTransform = { k: 1, x: 0, y: 0 }

/** Zoom so that `bounds` (projected px) fills the map with some padding. */
export function fitBounds(
  bounds: [[number, number], [number, number]],
  { padding = 0.18, maxZoom = 14 } = {},
): ViewTransform {
  const [[x0, y0], [x1, y1]] = bounds
  const w = Math.max(x1 - x0, 1)
  const h = Math.max(y1 - y0, 1)
  const k = Math.min(maxZoom, (1 - padding) / Math.max(w / MAP_W, h / MAP_H))
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return { k, x: MAP_W / 2 - k * cx, y: MAP_H / 2 - k * cy }
}

export function unionBounds(
  boundsList: [[number, number], [number, number]][],
): [[number, number], [number, number]] {
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
