import { useEffect, useRef, useState } from 'react'
import type { SedRequest, SedResponse } from '../lib/sed/worker'

export type SedEvaluation = { kind: 'result'; result: SedResponse['result'] } | { kind: 'timeout' }

const EVALUATION_TIMEOUT_MS = 2_000
const WORKER_URL = new URL('../lib/sed/worker.ts', import.meta.url)

/**
 * Evaluates sed scripts off the main thread. A pathological pattern (e.g.
 * `(a+)+$` against a long line) can backtrack inside one RegExp.exec for
 * effectively forever — running in a worker means the worst case is a
 * terminated worker and a timeout error, never a frozen tab.
 */
export function useSedEvaluation(
  script: string,
  input: string,
  quiet: boolean,
  extendedRegex: boolean,
): SedEvaluation {
  const [evaluation, setEvaluation] = useState<SedEvaluation>({
    kind: 'result',
    result: { ok: true, output: '' },
  })
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)
  const timerRef = useRef<number | undefined>(undefined)

  // Latest-wins: responses for superseded requests are ignored, and a
  // response cancels its pending timeout so the watchdog can never
  // clobber a healthy result that arrived in time.
  const handleMessage = useRef((event: MessageEvent<SedResponse>) => {
    if (event.data.id !== requestId.current) return
    window.clearTimeout(timerRef.current)
    setEvaluation({ kind: 'result', result: event.data.result })
  })

  useEffect(() => {
    const worker = new Worker(WORKER_URL, { type: 'module' })
    worker.onmessage = handleMessage.current
    workerRef.current = worker
    return () => {
      window.clearTimeout(timerRef.current)
      worker.terminate()
    }
  }, [])

  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return
    const id = ++requestId.current
    const request: SedRequest = {
      id,
      script,
      input,
      options: { quiet, extendedRegex },
    }
    worker.postMessage(request)

    timerRef.current = window.setTimeout(() => {
      if (requestId.current !== id) return
      worker.terminate()
      const replacement = new Worker(WORKER_URL, { type: 'module' })
      replacement.onmessage = handleMessage.current
      workerRef.current = replacement
      setEvaluation({ kind: 'timeout' })
    }, EVALUATION_TIMEOUT_MS)

    return () => window.clearTimeout(timerRef.current)
  }, [script, input, quiet, extendedRegex])

  return evaluation
}
