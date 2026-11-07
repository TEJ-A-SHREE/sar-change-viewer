import type { ReactNode } from 'react'

export interface HudItem {
  key: string
  label: string
  sub?: string
  available: boolean
  /** Plain fact row: no status chip, not clickable. */
  fact?: boolean
  onSelect?: () => void
}

interface Props {
  eyebrow: string
  title: string
  items: HudItem[]
  emptyText: string
  footer?: ReactNode
  onBack?: () => void
}

/** Translucent side panel that lists what is available under the current selection. */
export function HudPanel({ eyebrow, title, items, emptyText, footer, onBack }: Props) {
  return (
    <aside
      className="hud-panel pointer-events-auto flex max-h-[calc(100vh-11rem)] w-[min(92vw,22rem)] flex-col"
      aria-label={`${title} panel`}
    >
      <span className="hud-corner hud-corner-tl" />
      <span className="hud-corner hud-corner-tr" />
      <span className="hud-corner hud-corner-bl" />
      <span className="hud-corner hud-corner-br" />

      <header className="border-b border-signal-500/20 px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal-500/80">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {items.length === 0 ? (
          <p className="px-3 py-6 text-sm text-ink-500">{emptyText}</p>
        ) : (
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.key}>
                <button
                  type="button"
                  disabled={!it.available || it.fact}
                  onClick={it.onSelect}
                  className={`group flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left transition ${
                    it.fact
                      ? 'cursor-default'
                      : it.available
                        ? 'hover:bg-signal-500/10 hover:shadow-[inset_2px_0_0_#4fd1c5]'
                        : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <span>
                    <span className="block font-medium">{it.label}</span>
                    {it.sub && <span className="block text-xs text-ink-500">{it.sub}</span>}
                  </span>
                  {!it.fact && (
                    <span
                      className={`shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                        it.available
                          ? 'border-signal-500/60 text-signal-500'
                          : 'border-ink-500/40 text-ink-500'
                      }`}
                    >
                      {it.available ? 'Verified' : 'No data'}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(footer || onBack) && (
        <footer className="flex items-center justify-between gap-3 border-t border-signal-500/20 px-5 py-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="font-mono text-xs uppercase tracking-widest text-ink-300 hover:text-signal-500"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}
          {footer}
        </footer>
      )}
    </aside>
  )
}
