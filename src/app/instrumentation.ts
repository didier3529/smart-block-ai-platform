// Next.js 15 instrumentation API
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export function register() {
  // Called once on server start
  console.log('[Instrumentation] register() called - server started')
}

export function onRequestStart({ url, method }: { url: string; method: string }) {
  // Called at the start of every request
  console.log(`[Instrumentation] Request started: ${method} ${url}`)
  // Example: send to Datadog, Sentry, etc.
}

export function onRequestEnd({ url, method, status }: { url: string; method: string; status: number }) {
  // Called at the end of every request
  console.log(`[Instrumentation] Request ended: ${method} ${url} (status: ${status})`)
  // Example: send to Datadog, Sentry, etc.
}

export function onError({ error, url, method }: { error: Error; url: string; method: string }) {
  // Called on unhandled errors
  console.error(`[Instrumentation] Error in ${method} ${url}:`, error)
  // Example: send to Sentry, Datadog, etc.
}

// Add more hooks as needed for custom metrics, AI agent events, blockchain fetches, etc. 