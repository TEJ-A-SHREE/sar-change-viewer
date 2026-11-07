/**
 * Which places have VERIFIED SAR analyses ready.
 *
 * This is the single list the explore map reads. Add a state here only once
 * the data team has confirmed usable NISAR / Sentinel-1 scenes for it.
 * Continent and country names must match the `continent` / `name` properties
 * in /public/data/world.json (Natural Earth naming).
 */

import type { BBox } from '../types/analysis'

export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'Oceania' | 'South America'

export const CONTINENTS: Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
]

export interface StateCoverage {
  /** Must match `name` in /public/data/states/<ISO3>.json */
  name: string
  /** ISO 3166-2 code, matches `code` in the states file. */
  code: string
  /** Id of the matching preset in lib/regions.ts; the compare page opens with it. */
  regionId: string
  bbox: BBox
  /** Number of verified scene pairs available. */
  scenePairs: number
  /** ISO date of the most recent usable scene. */
  latestScene: string
  note?: string
}

export interface CountryCoverage {
  /** Must match `name` in world.json */
  name: string
  iso3: string
  states: StateCoverage[]
}

export const COVERAGE: Record<Continent, CountryCoverage[]> = {
  Asia: [
    {
      name: 'India',
      iso3: 'IND',
      states: [
        {
          name: 'Kerala',
          code: 'IN-KL',
          regionId: 'kerala',
          bbox: [74.8, 8.2, 77.4, 12.8],
          scenePairs: 1,
          latestScene: '2024-09-01',
          note: 'Coastal lowlands; monsoon flooding is the headline change.',
        },
      ],
    },
  ],
  Africa: [],
  Europe: [],
  'North America': [],
  Oceania: [],
  'South America': [],
}

export function countriesIn(continent: Continent): CountryCoverage[] {
  return COVERAGE[continent] ?? []
}

export function findCountry(iso3: string): CountryCoverage | undefined {
  return Object.values(COVERAGE)
    .flat()
    .find((c) => c.iso3 === iso3)
}
