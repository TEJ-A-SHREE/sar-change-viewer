/**
 * Generates deterministic SVG "satellite-looking" images as data URLs so the
 * UI can be developed without the backend. Replace nothing here when the
 * backend is ready: the API client simply stops using mocks.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Kind = 'before' | 'after' | 'change'

export function placeholderImage(kind: Kind, seed = 1): string {
  const rand = mulberry32(seed)
  const w = 640
  const h = 480
  const cells: string[] = []
  const size = 16
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      const n = rand()
      let fill: string
      if (kind === 'change') {
        // Mostly neutral with a blob of change in the lower-right quadrant.
        const inBlob = x > w * 0.55 && y > h * 0.45 && rand() > 0.25
        fill = inBlob ? (n > 0.5 ? '#f6ad55' : '#63b3ed') : `rgba(79,209,197,${0.05 + n * 0.1})`
      } else {
        // Grey-scale backscatter. "after" darkens the same blob (water-like).
        const inBlob = kind === 'after' && x > w * 0.55 && y > h * 0.45 && rand() > 0.3
        const v = inBlob ? 20 + n * 30 : 60 + n * 150
        fill = `rgb(${v},${v},${v})`
      }
      cells.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}"/>`)
    }
  }
  const bg = kind === 'change' ? '#0b1020' : '#000'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${cells.join('')}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
