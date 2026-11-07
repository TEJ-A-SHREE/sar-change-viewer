import type { AnalysisResult } from '../types/analysis'

export function MethodDisclosure({ metadata }: { metadata: AnalysisResult['metadata'] }) {
  return (
    <details className="rounded-xl border border-space-700 bg-space-900 p-4 text-sm">
      <summary className="cursor-pointer font-medium text-ink-300">How was this made?</summary>
      <dl className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr]">
        <dt className="text-ink-500">Satellite</dt>
        <dd>{metadata.satellite}</dd>
        <dt className="text-ink-500">Polarisation</dt>
        <dd>{metadata.polarization}</dd>
        <dt className="text-ink-500">Steps</dt>
        <dd>
          <ol className="list-decimal space-y-1 pl-5 text-ink-300">
            {metadata.processingSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </dd>
        <dt className="text-ink-500">Generated</dt>
        <dd>{new Date(metadata.generatedAt).toLocaleString()}</dd>
      </dl>
      {metadata.synthetic && (
        <p className="mt-3 rounded-md bg-rise-500/10 px-3 py-2 text-xs text-rise-500">
          This result was generated from synthetic data, not real satellite scenes.
        </p>
      )}
    </details>
  )
}
