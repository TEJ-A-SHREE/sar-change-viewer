import type { AreaOfInterest } from '../types/analysis'

export interface PresetRegion extends AreaOfInterest {
  id: string
  name: string
}

/** Preset areas so a first-time user can click something and see a result. */
export const PRESET_REGIONS: PresetRegion[] = [
  { id: 'kerala', name: 'Kerala coast, India', bbox: [76.0, 9.5, 76.6, 10.2] },
  { id: 'assam', name: 'Brahmaputra floodplain, Assam', bbox: [91.5, 26.0, 92.5, 26.8] },
  { id: 'rondonia', name: 'Amazon, Rondônia', bbox: [-63.5, -10.5, -62.5, -9.7] },
  { id: 'mississippi', name: 'Mississippi delta, USA', bbox: [-90.5, 29.0, -89.5, 29.8] },
]
