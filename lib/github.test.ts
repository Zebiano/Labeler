// Import: Packages
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'

// Import: Libs
import * as github from './github.js'
import * as store from './store.js'
import { capture } from '../test/helpers/capture.js'
import { json, networkError, stubFetch } from '../test/helpers/fetch.js'
import type { FetchStub } from '../test/helpers/fetch.js'
import type { GitHubLabel, Label } from './github.js'

/* --- Variables --- */
const token = 'ghp_token'
const owner = 'Zebiano'
const repository = 'Labeler'
const enterprise = 'github.yourhost.com'
const label: Label = { name: 'Bug', color: 'FC271E', description: 'A bug' }

let fetching: FetchStub

/* --- Helpers --- */
/**
 * Answers every request with the same response.
 * @param response What to answer with
 */
function answer(response: Response): void {
  fetching = stubFetch(() => response)
}

describe('github', () => {
  beforeEach(() => {
    for (const key of Object.keys(store.getAll('config'))) store.remove('config', key)
  })

  afterEach(() => {
    fetching.restore()
  })

  describe('requests', () => {
    test('labels are asked for a full page, pinned to the github.com version', async () => {
      answer(json(200, [{ name: 'Bug', url: 'https://api.github.com/repos/Zebiano/Labeler/labels/Bug' }]))

      let labels: GitHubLabel[] | undefined
      await capture(async () => { labels = await github.getLabels(true, token, owner, github.defaultHost, repository) })

      const request = fetching.requests[0]
      assert.equal(fetching.requests.length, 1)
      assert.equal(request?.url, 'https://api.github.com/repos/Zebiano/Labeler/labels?per_page=100')
      assert.equal(request?.method, 'GET')
      assert.equal(request?.headers.get('authorization'), `Bearer ${token}`)
      assert.equal(request?.headers.get('accept'), 'application/vnd.github+json')
      assert.equal(request?.headers.get('x-github-api-version'), github.defaultApiVersion)
      assert.equal(request?.headers.get('user-agent'), 'labeler')
      assert.equal(labels?.[0]?.name, 'Bug')
    })

    test('an Enterprise host is served under /api/v3, with the older version', async () => {
      answer(json(200, []))
      await capture(() => github.getLabels(true, token, owner, enterprise, repository))

      const request = fetching.requests[0]
      assert.equal(request?.url, `https://${enterprise}/api/v3/repos/Zebiano/Labeler/labels?per_page=100`)
      assert.equal(request?.headers.get('x-github-api-version'), github.enterpriseApiVersion)
    })

    test('a stored version overrides the pin, per host', async () => {
      store.set('config', { apiVersion: '2020-01-01', enterpriseApiVersion: '2019-01-01' })
      answer(json(200, []))

      await capture(() => github.getLabels(true, token, owner, github.defaultHost, repository))
      await capture(() => github.getLabels(true, token, owner, enterprise, repository))

      assert.equal(fetching.requests[0]?.headers.get('x-github-api-version'), '2020-01-01')
      assert.equal(fetching.requests[1]?.headers.get('x-github-api-version'), '2019-01-01')
    })

    test('a label is created with its name, description and colour', async () => {
      answer(json(201, {}))
      const run = await capture(() => github.saveLabel(true, token, owner, github.defaultHost, repository, label))

      const request = fetching.requests[0]
      assert.equal(request?.url, 'https://api.github.com/repos/Zebiano/Labeler/labels')
      assert.equal(request?.method, 'POST')
      assert.equal(request?.headers.get('content-type'), 'application/json')
      assert.deepEqual(JSON.parse(request?.body ?? ''), { name: 'Bug', description: 'A bug', color: 'FC271E' })
      assert.deepEqual(run.lines, ['Upload: Bug'])
    })

    test('a label is deleted through the url GitHub gave for it', async () => {
      const remote: GitHubLabel = { ...label, url: 'https://api.github.com/repos/Zebiano/Labeler/labels/Bug' }
      answer(new Response(null, { status: 204 }))
      const run = await capture(() => github.deleteLabel(true, token, remote))

      assert.equal(fetching.requests[0]?.url, remote.url)
      assert.equal(fetching.requests[0]?.method, 'DELETE')
      assert.deepEqual(run.lines, ['Delete: Bug'])
    })

    test('the repository list is counted with a HEAD request', async () => {
      const link = '<https://github.yourhost.com/api/v3/orgs/Zebiano/repos?page=42>; rel="last"'
      answer(new Response(null, { status: 200, headers: { link } }))

      let header: string | undefined
      await capture(async () => { header = await github.headRepoList(true, token, owner, enterprise, 1) })

      assert.equal(fetching.requests[0]?.method, 'HEAD')
      assert.equal(fetching.requests[0]?.url, `https://${enterprise}/api/v3/orgs/Zebiano/repos?sort=full_name&per_page=1`)
      assert.equal(header, link)
    })

    test('a missing link header reads as no header at all', async () => {
      answer(new Response(null, { status: 200 }))

      let header: string | undefined = 'unset'
      await capture(async () => { header = await github.headRepoList(true, token, owner, enterprise, 1) })
      assert.equal(header, undefined)
    })

    test('repositories are fetched a page at a time', async () => {
      answer(json(200, [{ name: 'Labeler' }, { name: 'Other' }]))

      let repos: { name: string }[] | undefined
      await capture(async () => { repos = await github.getReposByPage(true, token, owner, enterprise, 2, 100) })

      assert.equal(fetching.requests[0]?.url, `https://${enterprise}/api/v3/orgs/Zebiano/repos?sort=full_name&page=2&per_page=100`)
      assert.deepEqual(repos, [{ name: 'Labeler' }, { name: 'Other' }])
    })
  })

  describe('failures', () => {
    test('an existing label is skipped, not reported as an error', async () => {
      answer(json(422, { errors: [{ code: 'already_exists' }] }))
      const run = await capture(() => github.saveLabel(true, token, owner, github.defaultHost, repository, label))

      assert.deepEqual(run.lines, ['Skip: Bug'])
      assert.equal(run.exitCode, undefined)
      assert.equal(run.exited, false)
    })

    test('a 422 for any other reason is an error', async () => {
      answer(json(422, { errors: [{ code: 'invalid' }] }))
      const run = await capture(() => github.saveLabel(true, token, owner, github.defaultHost, repository, label))

      assert.equal(run.text.includes('An unexpected error occurred.'), true)
      assert.equal(run.text.includes('Request failed with status code 422'), true)
      assert.equal(run.exitCode, 1)
    })

    test('a 422 without a readable body is an error, not a skip', async () => {
      answer(new Response('<html>Unprocessable</html>', { status: 422 }))
      const run = await capture(() => github.saveLabel(true, token, owner, github.defaultHost, repository, label))

      assert.equal(run.text.includes('Skip:'), false)
      assert.equal(run.text.includes('Request failed with status code 422'), true)
      assert.equal(run.exitCode, 1)
    })

    test('a 404 names the url that did not work', async () => {
      answer(json(404, { message: 'Not Found' }))
      const run = await capture(() => github.getLabels(true, token, owner, github.defaultHost, 'Missing'))

      assert.deepEqual(run.lines, [
        'Error: 404: Not found.',
        'Error: URL seems to be faulty: https://api.github.com/repos/Zebiano/Missing/labels?per_page=100',
        'Error: Please check your arguments and try again.'
      ])
      assert.equal(run.exited, true)
      assert.equal(run.exitCode, 1)
    })

    test('a 401 blames the token', async () => {
      answer(json(401, { message: 'Bad credentials' }))
      const run = await capture(() => github.getLabels(true, token, owner, github.defaultHost, repository))

      assert.deepEqual(run.lines, [
        'Error: 401: Unauthorized.',
        'Error: Token has probably expired.',
        'Error: Please refresh it or create a new one and try again.'
      ])
      assert.equal(run.exited, true)
    })

    test('any other status is reported with the label that failed', async () => {
      answer(json(500, {}))
      const run = await capture(() => github.deleteLabel(true, token, { ...label, url: 'https://api.github.com/labels/Bug' }))

      assert.deepEqual(run.lines, [
        'Error: An unexpected error occurred.',
        `Error: Label: ${JSON.stringify({ ...label, url: 'https://api.github.com/labels/Bug' })}`,
        'Error: Request failed with status code 500'
      ])
      assert.equal(run.exited, true)
    })

    test('a request that never arrives reports why', async () => {
      fetching = stubFetch(() => { throw networkError('connect ECONNREFUSED 127.0.0.1:443') })
      const run = await capture(() => github.getLabels(true, token, owner, github.defaultHost, repository))

      assert.equal(run.text.includes('Error: connect ECONNREFUSED 127.0.0.1:443'), true)
      assert.equal(run.text.includes('fetch failed'), false)
      assert.equal(run.exitCode, 1)
    })

    test('a host with several addresses reports every reason', async () => {
      fetching = stubFetch(() => {
        throw networkError(['connect ECONNREFUSED ::1:59999', 'connect ECONNREFUSED 127.0.0.1:59999'])
      })
      const run = await capture(() => github.getLabels(true, token, owner, github.defaultHost, repository))

      assert.equal(run.text.includes('Error: connect ECONNREFUSED ::1:59999, connect ECONNREFUSED 127.0.0.1:59999'), true)
    })

    test('an error without a cause keeps its own message', async () => {
      fetching = stubFetch(() => { throw new Error('something else went wrong') })
      const run = await capture(() => github.getLabels(true, token, owner, github.defaultHost, repository))

      assert.equal(run.text.includes('Error: something else went wrong'), true)
    })

    test('something thrown that is not an error is reported as text', async () => {
      fetching = stubFetch(() => { throw 'a string' })
      const run = await capture(() => github.getLabels(true, token, owner, github.defaultHost, repository))

      assert.equal(run.text.includes('Error: a string'), true)
    })

    test('a failure that must not exit lets the run carry on', async () => {
      answer(json(500, {}))
      const run = await capture(() => github.saveLabel(false, token, owner, github.defaultHost, repository, label))

      assert.equal(run.exited, false)
      assert.equal(run.exitCode, 1)
    })
  })
})
