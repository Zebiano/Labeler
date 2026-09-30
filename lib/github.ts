// Import: Libs
import * as echo from './echo.js'
import * as store from './store.js'

// Variables
export const defaultHost = 'api.github.com'

/** REST API version pinned for github.com, so their default cannot change our behaviour */
export const defaultApiVersion = '2026-03-10'

/** REST API version pinned for GitHub Enterprise, which only gained the newer one in 3.22 */
export const enterpriseApiVersion = '2022-11-28'

/* --- Types --- */
/** A label as it is stored in 'labels.json' and sent to GitHub */
export interface Label {
  name: string
  color: string
  description?: string
}

/** A label as GitHub returns it, reduced to the fields the CLI reads */
export interface GitHubLabel extends Label {
  url: string
}

/** A repository as GitHub returns it, reduced to the field the CLI reads */
export interface GitHubRepository {
  name: string
}

/** The error body GitHub answers a rejected write with */
interface GitHubErrorBody {
  errors?: { code?: string }[]
}

/** Context for the shared error handlers */
interface ErrorContext {
  /** Whether a failure ends the process */
  exit: boolean
  /** Shown with the 404 message. Omit to let a 404 fall through to the generic branch */
  faultyUrl?: string
  /** Included in the generic message so a failed label can be identified */
  label?: Label
  /** Called instead of reporting an error when the label already exists */
  onExists?: () => void
}

/* --- Helpers --- */
/**
 * Builds a request URL. GitHub Enterprise serves the API under /api/v3, github.com does not.
 * @param host API host
 * @param path Path below the API root
 * @returns The full URL
 */
function apiUrl(host: string, path: string): string {
  if (host != defaultHost) return `https://${host}/api/v3${path}`
  else return `https://${host}${path}`
}

/**
 * Picks the API version for a request, from the host it is addressed to. Either default can be
 * overridden in the config.
 * @param url The request URL
 * @returns The version for the 'X-GitHub-Api-Version' header
 */
function apiVersion(url: string): string {
  const enterprise = new URL(url).hostname != defaultHost
  const override = store.get('config', enterprise ? 'enterpriseApiVersion' : 'apiVersion')
  if (typeof override === 'string' && override) return override
  return enterprise ? enterpriseApiVersion : defaultApiVersion
}

/**
 * Builds the headers sent with every request.
 * @param token Personal access token
 * @param url The request URL
 * @returns The headers
 */
function headers(token: string, url: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': apiVersion(url),
    'user-agent': 'labeler'
  }
}

/**
 * Checks whether a rejected write failed because the label already exists.
 * @param response The failed response
 * @returns True on a 422 carrying the 'already_exists' code
 */
async function alreadyExists(response: Response): Promise<boolean> {
  if (response.status !== 422) return false
  const body = await response.json().catch(() => undefined) as GitHubErrorBody | undefined
  return body?.errors?.[0]?.code == 'already_exists'
}

/**
 * Reports a response that came back with a non-2xx status.
 * @param response The failed response
 * @param context What to report and whether to exit
 */
async function handleHttpError(response: Response, context: ErrorContext): Promise<void> {
  if (context.onExists && await alreadyExists(response)) {
    context.onExists()
  } else if (context.faultyUrl && response.status === 404) {
    echo.error('404: Not found.')
    echo.error(`URL seems to be faulty: ${context.faultyUrl}`)
    echo.error('Please check your arguments and try again.', true)
  } else if (response.status === 401) {
    echo.error('401: Unauthorized.')
    echo.error('Token has probably expired.')
    echo.error('Please refresh it or create a new one and try again.', true)
  } else {
    echo.error('An unexpected error occurred.')
    if (context.label) echo.error(`Label: ${JSON.stringify(context.label)}`)
    echo.error(`Request failed with status code ${response.status}`, context.exit)
  }
}

/**
 * Digs out why a request failed. fetch reports every failure as 'fetch failed' and keeps the
 * reason on error.cause, which is an AggregateError when a host has several addresses.
 * @param error The thrown error
 * @returns The reason, such as 'connect ECONNREFUSED 127.0.0.1:443'
 */
function failureReason(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const cause = error.cause
  if (cause instanceof AggregateError && !cause.message) {
    return cause.errors.map((inner: unknown) => inner instanceof Error ? inner.message : String(inner)).join(', ')
  }
  if (cause instanceof Error && cause.message) return cause.message
  return error.message
}

/**
 * Reports a request that never produced a response, for example a DNS or TLS failure.
 * @param error The thrown error
 * @param context What to report and whether to exit
 */
function handleRequestError(error: unknown, context: ErrorContext): void {
  echo.error('An unexpected error occurred.')
  if (context.label) echo.error(`Label: ${JSON.stringify(context.label)}`)
  echo.error(failureReason(error), context.exit)
}

/**
 * Sends a request and hands any failure to the handlers above.
 * @param url The request URL
 * @param token Personal access token
 * @param context What to report and whether to exit on failure
 * @param read Turns a successful response into the result
 * @param method HTTP method
 * @param body Sent as JSON when given
 * @returns What 'read' made of the response, or undefined after a failure
 */
async function send<T>(url: string, token: string, context: ErrorContext, read: (response: Response) => T | Promise<T>, method = 'GET', body?: object): Promise<T | undefined> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { ...headers(token, url), 'content-type': 'application/json' } : headers(token, url),
      body: body ? JSON.stringify(body) : null
    })
    if (response.ok) return await read(response)
    await handleHttpError(response, context)
  } catch (error) {
    handleRequestError(error, context)
  }
  return undefined
}

/* --- Functions --- */
/**
 * Gets every label in a repository, up to 100.
 * @param exit Whether a failure ends the process
 * @param token Personal access token
 * @param owner Repository owner
 * @param host API host
 * @param repository Repository name
 * @returns The labels, or undefined after a failure
 */
export function getLabels(exit: boolean, token: string, owner: string, host: string, repository: string): Promise<GitHubLabel[] | undefined> {
  const url = apiUrl(host, `/repos/${owner}/${repository}/labels?per_page=100`)
  return send(url, token, { exit, faultyUrl: url }, response => response.json() as Promise<GitHubLabel[]>)
}

/**
 * Creates a label, skipping one that already exists.
 * @param exit Whether a failure ends the process
 * @param token Personal access token
 * @param owner Repository owner
 * @param host API host
 * @param repository Repository name
 * @param label The label to create
 */
export async function saveLabel(exit: boolean, token: string, owner: string, host: string, repository: string, label: Label): Promise<void> {
  const url = apiUrl(host, `/repos/${owner}/${repository}/labels`)
  const context = { exit, faultyUrl: url, label, onExists: () => echo.skip(label.name) }
  await send(url, token, context, () => echo.upload(label.name), 'POST', { name: label.name, description: label.description, color: label.color })
}

/**
 * Deletes a label.
 * @param exit Whether a failure ends the process
 * @param token Personal access token
 * @param label The label to delete, as GitHub returned it
 */
export async function deleteLabel(exit: boolean, token: string, label: GitHubLabel): Promise<void> {
  await send(label.url, token, { exit, label }, () => echo.remove(label.name), 'DELETE')
}

/**
 * Asks for the repository list of an organization without downloading it.
 * @param exit Whether a failure ends the process
 * @param token Personal access token
 * @param owner Organization name
 * @param host API host
 * @param perPage Repositories per page
 * @returns The 'link' response header, or undefined after a failure
 */
export function headRepoList(exit: boolean, token: string, owner: string, host: string, perPage: number): Promise<string | undefined> {
  const url = apiUrl(host, `/orgs/${owner}/repos?sort=full_name&per_page=${perPage}`)
  return send(url, token, { exit, faultyUrl: url }, response => response.headers.get('link') ?? undefined, 'HEAD')
}

/**
 * Gets one page of an organization's repositories.
 * @param exit Whether a failure ends the process
 * @param token Personal access token
 * @param owner Organization name
 * @param host API host
 * @param pageNum Page to fetch
 * @param perPage Repositories per page
 * @returns The page's repositories, or undefined after a failure
 */
export function getReposByPage(exit: boolean, token: string, owner: string, host: string, pageNum: number, perPage: number): Promise<GitHubRepository[] | undefined> {
  const url = apiUrl(host, `/orgs/${owner}/repos?sort=full_name&page=${pageNum}&per_page=${perPage}`)
  return send(url, token, { exit, faultyUrl: url }, response => response.json() as Promise<GitHubRepository[]>)
}
