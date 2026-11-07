export function formatKm2(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k km²`
  return `${value.toFixed(value < 10 ? 1 : 0)} km²`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(value < 10 ? 1 : 0)}%`
}

export function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
