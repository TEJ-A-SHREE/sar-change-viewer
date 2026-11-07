import type { AnalysisRequest, AnalysisResult, ApiError } from '../types/analysis'
import { mockAnalysis } from '../mocks/mockAnalysis'

/**
 * Single place where the frontend talks to the backend.
 *
 * - In dev, Vite proxies `/api` to http://localhost:8000 (see vite.config.ts).
 * - Set VITE_USE_MOCKS=true in frontend/.env.local to work without a backend.
 * - If the backend cannot be reached, we fall back to mocks and tell the UI.
 */

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export class AnalysisError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export interface AnalyzeOutcome {
  result: AnalysisResult
  /** True when the result came from local mocks rather than the backend. */
  usedMock: boolean
}

export async function analyze(request: AnalysisRequest): Promise<AnalyzeOutcome> {
  if (USE_MOCKS) {
    await delay(600)
    return { result: mockAnalysis(request), usedMock: true }
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch {
    // Network failure (backend not running). Keep the UI usable.
    await delay(300)
    return { result: mockAnalysis(request), usedMock: true }
  }

  if (!response.ok) {
    let payload: ApiError | undefined
    try {
      payload = (await response.json()) as ApiError
    } catch {
      /* non-JSON error body */
    }
    throw new AnalysisError(
      payload?.error.code ?? `http_${response.status}`,
      payload?.error.message ?? `The server replied with status ${response.status}.`,
    )
  }

  return { result: (await response.json()) as AnalysisResult, usedMock: false }
}

export async function health(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/health`)
    return r.ok
  } catch {
    return false
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
