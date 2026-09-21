// Import: Libs
import * as echo from './echo.js'
import * as store from './store.js'

// Variables
export const defaultHost = 'api.github.com'

// GitHub versions its REST API by date and asks clients to pin one, so that a change to
// their default cannot alter our behaviour. github.com serves the current version, while
// GitHub Enterprise Server only gained it in release 3.22: older appliances answer an
// unknown version with 410 Gone, so they get the version every supported release understands
export const defaultApiVersion = '2026-03-10'
export const enterpriseApiVersion = '2022-11-28'

/* --- Types --- */
// A label as it is stored in 'labels.json' and sent to GitHub
export interface Label {
  name: string
  color: string
  description?: string
}

// A label as GitHub returns it
export interface GitHubLabel extends Label {
  id: number
  node_id: string
  url: string
  default: boolean
}

// Only the field the CLI reads off a repository
export interface GitHubRepository {
  html_url: string
}

// The error body GitHub answers a rejected write with
interface GitHubErrorBody {
  errors?: { code?: string }[]
}

// Context for the shared error handlers
interface ErrorContext {
  exit: boolean
  // Shown with the 404 message. Omit to let a 404 fall through to the generic branch
  faultyUrl?: string
  // Included in the generic message so a failed label can be identified
  label?: Label
}

/* --- Helpers --- */
// GitHub Enterprise serves the API under /api/v3, github.com does not
function apiUrl(host: string, path: string): string {
  if (host != defaultHost) return `https://${host}/api/v3${path}`
  else return `https://${host}${path}`
}

// The API version for a request, taken from the host it is addressed to. Either default can
// be overridden in the config, for an instance that supports something else
function apiVersion(url: string): string {
  const enterprise = new URL(url).hostname != defaultHost
  const override = store.get('config', enterprise ? 'enterpriseApiVersion' : 'apiVersion')
  if (typeof override === 'string' && override) return override
  return enterprise ? enterpriseApiVersion : defaultApiVersion
}

// Headers sent with every request
function headers(token: string, url: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': apiVersion(url),
    'user-agent': 'labeler'
  }
}

// Handles a response that came back with a non-2xx status
function handleHttpError(response: Response, context: ErrorContext): void {
  if (context.faultyUrl && response.status === 404) {
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

// Handles a request that never produced a response, for example a DNS or TLS failure
function handleRequestError(error: unknown, context: ErrorContext): void {
  echo.error('An unexpected error occurred.')
  if (context.label) echo.error(`Label: ${JSON.stringify(context.label)}`)
  echo.error(error instanceof Error ? error.message : String(error), context.exit)
}

/* --- Functions --- */
// Get all Labels
export async function getLabels(exit: boolean, token: string, owner: string, host: string, repository: string): Promise<GitHubLabel[] | undefined> {
  // Set URL depending on the host
  const url = apiUrl(host, `/repos/${owner}/${repository}/labels?per_page=100`)

  // Get request
  try {
    const response = await fetch(url, { headers: headers(token, url) })
    if (response.ok) return await response.json() as GitHubLabel[]
    handleHttpError(response, { exit, faultyUrl: url })
  } catch (error) {
    handleRequestError(error, { exit })
  }
  return undefined
}

// Save new Label
export async function saveLabel(exit: boolean, token: string, owner: string, host: string, repository: string, label: Label): Promise<void> {
  // Set URL depending on the host
  const url = apiUrl(host, `/repos/${owner}/${repository}/labels`)

  // Post request
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers(token, url), 'content-type': 'application/json' },
      body: JSON.stringify({
        name: label.name,
        description: label.description,
        color: label.color
      })
    })
    if (response.ok) return echo.upload(label.name)

    // GitHub answers an already existing label with 422 and an 'already_exists' error code
    if (response.status === 422) {
      const body = await response.json().catch(() => undefined) as GitHubErrorBody | undefined
      if (body?.errors?.[0]?.code == 'already_exists') return echo.skip(label.name)
    }

    handleHttpError(response, { exit, faultyUrl: url, label })
  } catch (error) {
    handleRequestError(error, { exit, label })
  }
}

// Delete Label
export async function deleteLabel(exit: boolean, token: string, label: GitHubLabel): Promise<void> {
  // Delete request
  try {
    const response = await fetch(label.url, { method: 'DELETE', headers: headers(token, label.url) })
    if (response.ok) return echo.remove(label.name)
    handleHttpError(response, { exit, label })
  } catch (error) {
    handleRequestError(error, { exit, label })
  }
}

// Gets the 'link' header from a request to list all repos for an organization
export async function headRepoList(exit: boolean, token: string, owner: string, host: string, perPage: number): Promise<string | undefined> {
  // Variables
  const url = `https://${host}/api/v3/orgs/${owner}/repos?sort=full_name&per_page=${perPage}`

  // HEAD request
  try {
    const response = await fetch(url, { method: 'HEAD', headers: headers(token, url) })
    if (response.ok) return response.headers.get('link') ?? undefined
    handleHttpError(response, { exit, faultyUrl: url })
  } catch (error) {
    handleRequestError(error, { exit })
  }
  return undefined
}

// Gets the "pageNum" page of the repos list with up to "perPage" records
export async function getReposByPage(exit: boolean, token: string, owner: string, host: string, pageNum: number, perPage: number): Promise<GitHubRepository[] | undefined> {
  // Variables
  const url = `https://${host}/api/v3/orgs/${owner}/repos?sort=full_name&page=${pageNum}&per_page=${perPage}`

  // Get request
  try {
    const response = await fetch(url, { headers: headers(token, url) })
    if (response.ok) return await response.json() as GitHubRepository[]
    handleHttpError(response, { exit, faultyUrl: url })
  } catch (error) {
    handleRequestError(error, { exit })
  }
  return undefined
}
