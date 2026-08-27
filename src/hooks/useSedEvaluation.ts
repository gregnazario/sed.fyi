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
  /** True while a request is out and its answer hasn't come back. */
  const awaitingResponse = useRef(false)

  const handleMessage = useRef((event: MessageEvent<SedResponse>) => {
    if (event.data.id !== requestId.current) return
    awaitingResponse.current = false
    window.clearTimeout(timerRef.current)
    setEvaluation({ kind: 'result', result: event.data.result })
  })

  const spawnWorker = useRef(() => {
    const worker = new Worker(WORKER_URL, { type: 'module' })
    worker.onmessage = handleMessage.current
    workerRef.current = worker
  })

  useEffect(() => {
    spawnWorker.current()
    return () => {
      window.clearTimeout(timerRef.current)
      // Terminate whatever worker is CURRENT: the watchdog may have swapped
      // in a replacement after a timeout, and a stuck evaluation on that
      // replacement must not outlive the component.
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const id = ++requestId.current
    // A stuck RegExp.exec blocks the worker's message queue — posting onto
    // it would leave this request unserved until the watchdog fired. If the
    // previous request was never answered, retire that worker first so this
    // evaluation starts on a clean one.
    if (awaitingResponse.current) {
      workerRef.current?.terminate()
      spawnWorker.current()
    }
    awaitingResponse.current = true
    const request: SedRequest = {
      id,
      script,
      input,
      options: { quiet, extendedRegex },
    }
    workerRef.current?.postMessage(request)

    timerRef.current = window.setTimeout(() => {
      if (requestId.current !== id) return
      awaitingResponse.current = false
      workerRef.current?.terminate()
      spawnWorker.current()
      setEvaluation({ kind: 'timeout' })
    }, EVALUATION_TIMEOUT_MS)

    return () => window.clearTimeout(timerRef.current)
  }, [script, input, quiet, extendedRegex])

  return evaluation
}
