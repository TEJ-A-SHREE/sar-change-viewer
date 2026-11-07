/**
 * Integration contract between the frontend and the backend.
 *
 * Source of truth: /shared/contracts/analysis.schema.json
 * Python mirror:   /backend/app/models.py
 *
 * If you change a field here, change it in all three places and bump
 * `CONTRACT_VERSION` in all three.
 */

export const CONTRACT_VERSION = '1.0.0'

/** [minLon, minLat, maxLon, maxLat] in WGS84 degrees. */
export type BBox = [number, number, number, number]

export interface AreaOfInterest {
  /** Human-readable label, e.g. "Kerala coast, India". Optional. */
  name?: string
  bbox: BBox
}

export interface AnalysisRequest {
  area: AreaOfInterest
  /** ISO 8601 date, e.g. "2024-06-01". */
  beforeDate: string
  /** ISO 8601 date, e.g. "2024-09-01". */
  afterDate: string
  /** Which satellite mission to pull from. Only Sentinel-1 for now. */
  source?: 'sentinel-1'
}

export interface ImageAsset {
  /** Absolute or site-relative URL the browser can load directly. */
  url: string
  /** One sentence a non-technical person understands. */
  caption: string
  widthPx?: number
  heightPx?: number
}

export interface LegendEntry {
  color: string
  label: string
}

export type Confidence = 'low' | 'medium' | 'high'
export type Severity = 'info' | 'notable' | 'significant'

export interface Finding {
  title: string
  description: string
  severity: Severity
  /** Share of the analysed area this finding covers, 0-100. */
  percentOfArea?: number
}

export interface AnalysisResult {
  id: string
  contractVersion: string
  request: AnalysisRequest
  images: {
    before: ImageAsset
    after: ImageAsset
    change: ImageAsset & { legend: LegendEntry[] }
  }
  summary: {
    /** <= 12 words. Shown as the big headline. */
    headline: string
    /** 2-4 sentences in plain language. No jargon. */
    plain: string
    confidence: Confidence
  }
  findings: Finding[]
  stats: {
    analysedAreaKm2: number
    changedAreaKm2: number
    changedPercent: number
    increaseKm2: number
    decreaseKm2: number
  }
  metadata: {
    satellite: string
    polarization: string
    processingSteps: string[]
    generatedAt: string
    /** True when the backend produced synthetic data instead of real scenes. */
    synthetic: boolean
  }
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
