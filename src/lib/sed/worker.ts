/**
 * Worker wrapper around runSed: the playground evaluates off the main
 * thread, so catastrophic regex backtracking can only burn the worker
 * (which the UI terminates after a time budget) instead of the tab.
 */

import type { RunOptions, SedResult } from './index'
import { runSed } from './index'

export interface SedRequest {
  id: number
  script: string
  input: string
  options: RunOptions
}

export interface SedResponse {
  id: number
  result: SedResult
}

addEventListener('message', (event: MessageEvent<SedRequest>) => {
  const { id, script, input, options } = event.data
  const result = runSed(script, input, options)
  // Keep `self` as the receiver — a detached postMessage alias throws
  // "Illegal invocation" inside the worker, silently eating the response.
  ;(self as unknown as Worker).postMessage({ id, result })
})
