/* --- Types --- */
/** A request the stub received */
export interface Recorded {
  url: string
  method: string
  headers: Headers
  body: string | null
}

/** A stubbed fetch, and the way back to the real one */
export interface FetchStub {
  /** Every request made while the stub was in place, in order */
  requests: Recorded[]
  restore: () => void
}

/* --- Functions --- */
/**
 * Replaces global fetch. A handler that throws makes the request fail the way a refused
 * connection does, rather than answering with a status.
 * @param handler Answers each request
 * @returns The recorded requests and a restore function
 */
export function stubFetch(handler: (request: Recorded) => Response): FetchStub {
  const requests: Recorded[] = []
  const original = globalThis.fetch

  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const request: Recorded = {
      url: String(input),
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body: typeof init?.body == 'string' ? init.body : null
    }
    requests.push(request)
    return Promise.resolve(handler(request))
  }) as typeof fetch

  return { requests, restore: () => { globalThis.fetch = original } }
}

/**
 * Builds a JSON response.
 * @param status HTTP status
 * @param body Serialised as the body
 * @param headers Extra response headers
 * @returns The response
 */
export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
}

/**
 * Builds the error fetch throws when a request never reaches the server. The reason sits on
 * 'cause', as undici puts it there.
 * @param reason What went wrong, or several reasons for a host with more than one address
 * @returns The error to throw
 */
export function networkError(reason: string | string[]): TypeError {
  const cause = Array.isArray(reason)
    ? new AggregateError(reason.map(message => new Error(message)), '')
    : new Error(reason)
  return new TypeError('fetch failed', { cause })
}
