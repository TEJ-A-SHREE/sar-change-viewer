import { CONTRACT_VERSION, type AnalysisRequest, type AnalysisResult } from '../types/analysis'
import { placeholderImage } from './placeholderImage'

/** Builds a realistic-looking result for any request. Used when the backend is unavailable. */
export function mockAnalysis(request: AnalysisRequest): AnalysisResult {
  const name = request.area.name ?? 'the selected area'
  return {
    id: `mock-${Date.now()}`,
    contractVersion: CONTRACT_VERSION,
    request,
    images: {
      before: {
        url: placeholderImage('before', 7),
        caption: `Radar view of ${name} on the earlier date. Brighter areas reflect more radar signal (buildings, rough ground).`,
      },
      after: {
        url: placeholderImage('after', 7),
        caption: `Radar view of ${name} on the later date. The dark patch in the lower right is new smooth surface, typically water.`,
      },
      change: {
        url: placeholderImage('change', 7),
        caption:
          'Where the two dates differ. Teal means little change; blue means the surface became darker to radar; orange means brighter.',
        legend: [
          { color: '#4fd1c5', label: 'Little or no change' },
          { color: '#63b3ed', label: 'Became darker (often flooding or calm water)' },
          { color: '#f6ad55', label: 'Became brighter (often new structures or rough terrain)' },
        ],
      },
    },
    summary: {
      headline: 'About 12% of the area looks newly flooded',
      plain: `Between the two dates, a large patch in the south-east of ${name} went from a rough, bright surface to a smooth, dark one. On radar, that pattern almost always means standing water appeared. The rest of the area stayed about the same. This is a sample result generated without real satellite data.`,
      confidence: 'medium',
    },
    findings: [
      {
        title: 'New standing water in the south-east',
        description:
          'Roughly 180 km² became much darker to radar. This matches what flooding or a filled reservoir looks like.',
        severity: 'significant',
        percentOfArea: 12,
      },
      {
        title: 'Small bright spots along the main road',
        description:
          'A handful of pixels became brighter, which can mean new buildings, parked vehicles or construction.',
        severity: 'notable',
        percentOfArea: 0.6,
      },
      {
        title: 'No change over most of the area',
        description: 'About 87% of the area looks the same on both dates.',
        severity: 'info',
        percentOfArea: 87,
      },
    ],
    stats: {
      analysedAreaKm2: 1480,
      changedAreaKm2: 189,
      changedPercent: 12.8,
      increaseKm2: 9,
      decreaseKm2: 180,
    },
    metadata: {
      satellite: 'NISAR (mock)',
      polarization: 'HH',
      processingSteps: [
        'Fetched two scenes covering the area',
        'Converted radar intensity to decibels',
        'Reduced speckle noise with a 5x5 Lee filter',
        'Computed the log-ratio between the dates',
        'Flagged pixels beyond ±3 dB as changed',
      ],
      generatedAt: new Date().toISOString(),
      synthetic: true,
    },
  }
}
