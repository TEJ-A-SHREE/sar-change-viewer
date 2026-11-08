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
  const verified = items.filter((i) => !i.fact && i.available).length
  const listed = items.filter((i) => !i.fact).length

  return (
    <aside
      className="hud-panel pointer-events-auto flex max-h-[calc(100vh-11rem)] w-[min(92vw,22rem)] flex-col"
      aria-label={`${title} panel`}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-500">{eyebrow}</p>
        <h2 className="mt-1 text-[1.6rem] leading-tight font-semibold tracking-tight text-balance">
          {title}
        </h2>
        {listed > 0 && (
          <p className="mt-2 font-mono text-[11px] tracking-wider text-ink-500 tabular-nums">
            <span className="text-signal-500">{verified}</span> of {listed} with verified data
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto border-t border-ink-300/10 px-2 py-2">
        {items.length === 0 ? (
          <p className="px-3 py-6 text-sm text-ink-500">{emptyText}</p>
        ) : (
          <ul className="space-y-0.5">
            {items.map((it) => (
              <li key={it.key}>
                <button
                  type="button"
                  disabled={!it.available || it.fact}
                  onClick={it.onSelect}
                  className={`group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition ${
                    it.fact
                      ? 'cursor-default'
                      : it.available
                        ? 'hover:bg-signal-500/10'
                        : 'cursor-not-allowed opacity-45'
                  }`}
                >
                  <span className="min-w-0">
                    <span
                      className={`block truncate ${it.fact ? 'text-xs text-ink-500' : 'font-medium'}`}
                    >
                      {it.label}
                    </span>
                    {it.sub && (
                      <span
                        className={`block ${it.fact ? 'mt-0.5 text-sm text-ink-100' : 'text-xs text-ink-500'}`}
                      >
                        {it.sub}
                      </span>
                    )}
                  </span>
                  {!it.fact && (
                    <span
                      className={`hud-chip shrink-0 ${
                        it.available
                          ? 'border border-signal-500/40 text-signal-500'
                          : 'border border-ink-500/30 text-ink-500'
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
        <footer className="flex items-center justify-between gap-3 border-t border-ink-300/10 px-5 py-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="font-mono text-xs tracking-widest text-ink-300 uppercase hover:text-signal-500"
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
