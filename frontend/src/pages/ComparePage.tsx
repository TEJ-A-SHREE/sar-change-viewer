import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { analyze, health, AnalysisError } from '../lib/api'
import type { AnalysisRequest, AnalysisResult } from '../types/analysis'
import { Header } from '../components/Header'
import { QueryForm } from '../components/QueryForm'
import { ImageCompare } from '../components/ImageCompare'
import { SummaryCard } from '../components/SummaryCard'
import { StatsRow } from '../components/StatsRow'
import { FindingsList } from '../components/FindingsList'
import { MethodDisclosure } from '../components/MethodDisclosure'
import { EmptyState } from '../components/EmptyState'
import { LoadingState } from '../components/LoadingState'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; result: AnalysisResult; usedMock: boolean }

export function ComparePage() {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [params] = useSearchParams()
  const initialRegionId = params.get('region') ?? undefined

  useEffect(() => {
    health().then(setBackendOnline)
  }, [])

  async function run(request: AnalysisRequest) {
    setState({ kind: 'loading' })
    try {
      const { result, usedMock } = await analyze(request)
      setState({ kind: 'ready', result, usedMock })
      if (usedMock) setBackendOnline(false)
    } catch (err) {
      const message =
        err instanceof AnalysisError ? err.message : 'Something went wrong. Please try again.'
      setState({ kind: 'error', message })
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header backendOnline={backendOnline} />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6">
        <QueryForm
          busy={state.kind === 'loading'}
          initialRegionId={initialRegionId}
          onSubmit={run}
        />

        {state.kind === 'idle' && <EmptyState />}
        {state.kind === 'loading' && <LoadingState />}
        {state.kind === 'error' && (
          <p
            role="alert"
            className="rounded-xl border border-alert-500/40 bg-alert-500/10 p-4 text-alert-500"
          >
            {state.message}
          </p>
        )}
        {state.kind === 'ready' && (
          <>
            {state.usedMock && (
              <p className="rounded-md border border-rise-500/40 bg-rise-500/10 px-3 py-2 text-sm text-rise-500">
                The backend is not running, so this is sample data. Start it with{' '}
                <code className="font-mono">make backend</code> to see real results.
              </p>
            )}
            <SummaryCard summary={state.result.summary} />
            <StatsRow stats={state.result.stats} />
            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
              <ImageCompare
                images={state.result.images}
                beforeDate={state.result.request.beforeDate}
                afterDate={state.result.request.afterDate}
              />
              <FindingsList findings={state.result.findings} />
            </div>
            <MethodDisclosure metadata={state.result.metadata} />
          </>
        )}
      </main>
      <footer className="border-t border-space-700 py-4 text-center text-xs text-ink-500">
        Built on open Sentinel-1 radar data. Not an official NASA product.
      </footer>
    </div>
  )
}
