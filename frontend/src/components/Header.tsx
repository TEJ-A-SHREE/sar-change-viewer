import { Link } from 'react-router-dom'

interface Props {
  backendOnline: boolean | null
}

export function Header({ backendOnline }: Props) {
  const status =
    backendOnline === null
      ? { dot: 'bg-ink-500', text: 'Checking backend…' }
      : backendOnline
        ? { dot: 'bg-signal-500', text: 'Backend connected' }
        : { dot: 'bg-rise-500', text: 'Backend offline · showing sample data' }

  return (
    <header className="border-b border-space-700 bg-space-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">SAR Change Viewer</h1>
            <p className="text-xs text-ink-500">
              See how the ground changed between two dates, using satellite radar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-300">
          <Link
            to="/"
            className="font-mono uppercase tracking-widest text-signal-500 hover:underline"
          >
            ← Map
          </Link>
          <span className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${status.dot}`} aria-hidden />
            <span>{status.text}</span>
          </span>
        </div>
      </div>
    </header>
  )
}
