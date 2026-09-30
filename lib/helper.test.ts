// Import: Packages
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, mock, test } from 'node:test'

// Import: Libs
import { capture } from '../test/helpers/capture.js'
import { cli } from '../test/helpers/cli.js'
import { json, stubFetch } from '../test/helpers/fetch.js'
import type { Cli } from '../labeler.js'
import type { FetchStub } from '../test/helpers/fetch.js'
import type { Label } from './github.js'

/* --- Types --- */
/** One answer, as inquirer hands it back */
type Answer = Record<string, unknown>

/* --- Variables --- */
const enterprise = 'github.yourhost.com'
const labels: Label[] = [{ name: 'Bug', color: 'FC271E' }, { name: 'Idea', color: 'D2DAE1' }]

let fetching: FetchStub | undefined

/** The answers a test gives, in the order the prompts are opened */
let answers: Answer[] = []

/* The inquirer package is replaced rather than lib/inquirer.ts, so that the prompts the CLI
   builds are exercised too. Running out of answers ends a prompt the way Ctrl+C does. The
   modules under test are loaded afterwards, so that they pick the replacement up */
mock.module('inquirer', {
  defaultExport: {
    prompt: (): Promise<Answer> => {
      const answer = answers.shift()
      if (answer) return Promise.resolve(answer)

      const cancelled = new Error('User force closed the prompt')
      cancelled.name = 'ExitPromptError'
      return Promise.reject(cancelled)
    },
    Separator: class { readonly separator = true }
  }
})

const helper = await import('./helper.js')
const store = await import('./store.js')

/* --- Helpers --- */
/**
 * Empties the config store.
 */
function clearConfig(): void {
  for (const key of Object.keys(store.getAll('config'))) store.remove('config', key)
}

/**
 * Runs the new label CLI, which only ever ends when the user cancels a prompt.
 * @param command The parsed command line
 */
async function enterLabels(command: Cli): Promise<void> {
  await helper.cliNewLabel(command).catch((error: unknown) => {
    if (!(error instanceof Error) || error.name != 'ExitPromptError') throw error
  })
}

describe('helper', () => {
  beforeEach(() => {
    clearConfig()
    store.set('labels', { labels })
    answers = []
  })

  afterEach(() => {
    fetching?.restore()
    fetching = undefined
  })

  describe('assignFlag', () => {
    test('a flag wins over the config', () => {
      store.set('config', { owner: 'stored' })
      assert.equal(helper.assignFlag(cli({ owner: 'flag' }), 'owner'), 'flag')
    })

    test('the config is used when the flag is absent', () => {
      store.set('config', { owner: 'stored' })
      assert.equal(helper.assignFlag(cli(), 'owner'), 'stored')
    })

    test('a missing value is null, except the host, which defaults', () => {
      assert.equal(helper.assignFlag(cli(), 'owner'), null)
      assert.equal(helper.assignFlag(cli(), 'token'), null)
      assert.equal(helper.assignFlag(cli(), 'host'), 'api.github.com')
    })
  })

  describe('censorConfig', () => {
    test('a long token keeps only its last four characters', () => {
      assert.deepEqual(helper.censorConfig({ token: 'ghp_1234567890abcd', owner: 'Zebiano' }), {
        token: '**************abcd',
        owner: 'Zebiano'
      })
    })

    test('a short token is hidden completely', () => {
      assert.deepEqual(helper.censorConfig({ token: '12345678' }), { token: '********' })
    })

    test('a config without a token is left as it is', () => {
      assert.deepEqual(helper.censorConfig({ owner: 'Zebiano' }), { owner: 'Zebiano' })
    })
  })

  describe('checkRequiredFlags', () => {
    test('all three present are handed back', () => {
      assert.deepEqual(helper.checkRequiredFlags('t', 'o', 'r'), { token: 't', owner: 'o', repository: 'r' })
    })

    test('each missing value is named', async () => {
      const cases: [string | null, string | null, string | null, string][] = [
        [null, null, null, 'Error: Missing arguments.'],
        [null, 'o', 'r', 'Error: You need to specify a token!'],
        ['t', null, 'r', 'Error: You need to specify an owner!'],
        ['t', 'o', null, 'Error: You need to specify a repository!']
      ]

      for (const [token, owner, repository, message] of cases) {
        const run = await capture(() => helper.checkRequiredFlags(token, owner, repository))
        assert.equal(run.lines[0], message)
        assert.equal(run.exited, true)
        assert.equal(run.exitCode, 1)
      }
    })
  })

  describe('checkFlags', () => {
    test('workable combinations are accepted', async () => {
      const accepted: Partial<Cli['flags']>[] = [
        { deleteAllLabels: true, uploadLabels: true, repository: 'Labeler' },
        { config: true },
        { newLabel: true },
        { emptyLabelsFile: true, newLabel: true },
        { resetLabelsFile: true, newLabel: true },
        { path: true },
        { bulkUpdate: true, deleteAllLabels: true, host: enterprise }
      ]

      for (const flags of accepted) {
        const run = await capture(() => { helper.checkFlags(cli(flags)) })
        assert.deepEqual(run.lines, [], JSON.stringify(flags))
        assert.equal(run.exited, false, JSON.stringify(flags))
      }
    })

    test('combinations that cannot work are refused', async () => {
      const refused: [Partial<Cli['flags']>, string][] = [
        [{ bulkUpdate: true }, 'Error: Bulk update requires a GitHub Enterprise host.'],
        [{ bulkUpdate: true, host: enterprise, repository: 'Labeler' }, 'Error: Wrong usage.'],
        [{ newLabel: true, repository: 'Labeler' }, 'Error: Wrong usage.'],
        [{ config: true, token: 'ghp_token' }, 'Error: Wrong usage.'],
        [{ config: true, newLabel: true }, 'Error: Wrong usage.'],
        [{ emptyLabelsFile: true, config: true }, 'Error: Wrong usage.'],
        [{ emptyLabelsFile: true, resetLabelsFile: true }, 'Error: Wrong usage.'],
        [{ emptyLabelsFile: true, uploadLabels: true }, 'Error: Wrong usage.']
      ]

      for (const [flags, message] of refused) {
        const run = await capture(() => { helper.checkFlags(cli(flags)) })
        assert.equal(run.lines[0], message, JSON.stringify(flags))
        assert.equal(run.exited, true, JSON.stringify(flags))
        assert.equal(run.exitCode, 1)
      }
    })

    test('a host stored in the config counts as an Enterprise host', async () => {
      store.set('config', { host: enterprise })
      const run = await capture(() => { helper.checkFlags(cli({ bulkUpdate: true })) })

      assert.deepEqual(run.lines, [])
      assert.equal(run.exited, false)
    })
  })

  describe('getPageCountFromLinkHeader', () => {
    test('the repository count comes from the last page link', () => {
      const header = '<https://github.yourhost.com/api/v3/orgs/Zebiano/repos?sort=full_name&page=2&per_page=1>; rel="next", '
        + '<https://github.yourhost.com/api/v3/orgs/Zebiano/repos?sort=full_name&page=150&per_page=1>; rel="last"'
      assert.equal(helper.getPageCountFromLinkHeader(header), 150)
    })

    test('a header it cannot read is an error', async () => {
      const refused: [string, string][] = [
        ['', 'Error: Header input must not be null or of zero length.'],
        ['<https://github.yourhost.com/repos>', 'Error: Section could not be properly split on ";".'],
        ['<https://github.yourhost.com/repos>; rel="next"', 'Error: Repository page count could not be found for given GHE org.'],
        ['<https://github.yourhost.com/repos>; rel="last"', 'Error: Repository page count could not be found for given GHE org.']
      ]

      for (const [header, message] of refused) {
        const run = await capture(() => helper.getPageCountFromLinkHeader(header))
        assert.equal(run.lines[0], message, JSON.stringify(header))
        assert.equal(run.exited, true)
      }
    })
  })

  describe("the 'labels.json' commands", () => {
    test('the path is printed with a heading', async () => {
      const run = await capture(() => { helper.labelsPath() })
      assert.deepEqual(run.lines, ["Info: Path for 'labels.json'", `Info: ${store.path('labels')}`, ''])
    })

    test('-fR puts the shipped labels back', async () => {
      const run = await capture(() => helper.resetLabelsFile(cli({ force: true })))

      assert.equal(store.getAll('labels').length > labels.length, true)
      assert.deepEqual(run.lines, ["Info: Resetting 'labels.json'...", 'Success: Done!\n'])
      assert.equal(run.exited, false)
    })

    test('-fe empties the file and stops there', async () => {
      const run = await capture(() => helper.emptyLabelsFile(cli({ force: true })))

      assert.deepEqual(store.getAll('labels'), [])
      assert.deepEqual(run.lines, ["Info: Emptying 'labels.json'...", 'Success: Done.\n'])
      assert.equal(run.exited, true)
    })

    test('-fen carries on to add labels', async () => {
      const run = await capture(() => helper.emptyLabelsFile(cli({ force: true, newLabel: true })))

      assert.deepEqual(store.getAll('labels'), [])
      assert.equal(run.exited, false)
    })
  })

  describe('working on a repository', () => {
    test('the owner and repository are announced', async () => {
      const run = await capture(() => { helper.echoOwnerRepository('Zebiano', 'Labeler') })
      assert.deepEqual(run.lines, ['Owner: Zebiano', 'Repository: Labeler', ''])
    })

    test('-fu uploads every stored label', async () => {
      fetching = stubFetch(() => json(201, {}))
      const run = await capture(() => helper.uploadLabels('ghp_token', 'Zebiano', 'api.github.com', 'Labeler', cli({ force: true }), false))

      assert.equal(fetching.requests.length, labels.length)
      assert.deepEqual(fetching.requests.map(request => JSON.parse(request.body ?? '').name).sort(), ['Bug', 'Idea'])
      assert.equal(run.text.includes('Uploading labels to Labeler...'), true)
      assert.equal(run.exited, false)
    })

    test('-fu on its own finishes the run', async () => {
      fetching = stubFetch(() => json(201, {}))
      const run = await capture(() => helper.uploadLabels('ghp_token', 'Zebiano', 'api.github.com', 'Labeler', cli({ force: true }), true))

      assert.equal(run.lines.at(-1), 'Success: Finished!')
      assert.equal(run.exited, true)
    })

    test('-fd deletes every label the repository has', async () => {
      const remote = [
        { name: 'Bug', color: 'FC271E', url: 'https://api.github.com/repos/Zebiano/Labeler/labels/Bug' },
        { name: 'Old', color: 'FFFFFF', url: 'https://api.github.com/repos/Zebiano/Labeler/labels/Old' }
      ]
      fetching = stubFetch(request => request.method == 'DELETE' ? new Response(null, { status: 204 }) : json(200, remote))
      const run = await capture(() => helper.deleteAllLabels('ghp_token', 'Zebiano', 'api.github.com', 'Labeler', cli({ force: true }), false))

      assert.deepEqual(fetching.requests.filter(request => request.method == 'DELETE').map(request => request.url).sort(), remote.map(label => label.url))
      assert.equal(run.text.includes('Delete: Bug'), true)
      assert.equal(run.text.includes('Delete: Old'), true)
    })

    test('-fd on its own finishes the run', async () => {
      fetching = stubFetch(() => json(200, []))
      const run = await capture(() => helper.deleteAllLabels('ghp_token', 'Zebiano', 'api.github.com', 'Labeler', cli({ force: true }), true))

      assert.equal(run.lines.at(-1), 'Success: Finished!')
      assert.equal(run.exited, true)
    })

    test('-fdu reports the deletion as done, and leaves finishing to the upload', async () => {
      fetching = stubFetch(request => request.method == 'DELETE' ? new Response(null, { status: 204 }) : json(200, []))
      const run = await capture(() => helper.deleteAllLabels('ghp_token', 'Zebiano', 'api.github.com', 'Labeler', cli({ force: true, uploadLabels: true }), true))

      assert.equal(run.lines.at(-1), 'Success: Done!\n')
      assert.equal(run.exited, false)
    })

    test('every repository in the organization is listed, a page at a time', async () => {
      const link = `<https://${enterprise}/api/v3/orgs/Zebiano/repos?sort=full_name&page=150&per_page=1>; rel="last"`
      fetching = stubFetch(request => request.method == 'HEAD'
        ? new Response(null, { status: 200, headers: { link } })
        : json(200, [{ name: `repo-${new URL(request.url).searchParams.get('page')}` }]))

      let repos: string[] = []
      const run = await capture(async () => { repos = await helper.getRepositories('ghp_token', 'Zebiano', enterprise) })

      assert.deepEqual(repos, ['repo-1', 'repo-2'])
      assert.deepEqual(fetching.requests.filter(request => request.method == 'GET').map(request => new URL(request.url).searchParams.get('page')), ['1', '2'])
      assert.equal(run.lines.at(-1), 'Info: Found 2 repositories in organization Zebiano.')
    })

    /* GitHub only sends a link header when there is more than one page, and with one repository
       per page an organization with 0 or 1 repositories has just the one */
    test('an organization with a single repository is listed from one page', async () => {
      fetching = stubFetch(request => request.method == 'HEAD' ? new Response(null, { status: 200 }) : json(200, [{ name: 'Labeler' }]))

      let repos: string[] = []
      const run = await capture(async () => { repos = await helper.getRepositories('ghp_token', 'Zebiano', enterprise) })

      assert.deepEqual(repos, ['Labeler'])
      assert.equal(fetching.requests.at(-1)?.url, `https://${enterprise}/api/v3/orgs/Zebiano/repos?sort=full_name&page=1&per_page=100`)
      assert.equal(run.lines.at(-1), 'Info: Found 1 repository in organization Zebiano.')
      assert.equal(run.exited, false)
    })

    test('an organization without repositories is an empty list, not an error', async () => {
      fetching = stubFetch(request => request.method == 'HEAD' ? new Response(null, { status: 200 }) : json(200, []))

      let repos: string[] = ['unset']
      const run = await capture(async () => { repos = await helper.getRepositories('ghp_token', 'Zebiano', enterprise) })

      assert.deepEqual(repos, [])
      assert.equal(run.lines.at(-1), 'Info: Found 0 repositories in organization Zebiano.')
      assert.equal(run.exitCode, undefined)
    })
  })

  describe('the v5 notice', () => {
    test('nothing is said when there was no import', async () => {
      const run = await capture(() => { helper.echoMigration() })
      assert.deepEqual(run.lines, [])
    })
  })

  describe('the flows that ask first', () => {
    beforeEach(() => {
      store.set('labels', { labels: [{ name: 'Bug', color: 'FC271E' }] })
    })

    describe('a confirmation', () => {
      test('carries on when it is accepted', async () => {
        answers = [{ confirmed: true }]
        await capture(() => helper.resetLabelsFile(cli()))

        assert.equal(store.getAll('labels').length > 1, true)
      })

      test('ends the run when it is declined', async () => {
        answers = [{ confirmed: false }]
        const run = await capture(() => helper.resetLabelsFile(cli()))

        assert.deepEqual(store.getAll('labels'), [{ name: 'Bug', color: 'FC271E' }])
        assert.equal(run.lines.at(-1), "Abort: Reset 'labels.json'.")
        assert.equal(run.exited, true)
        assert.equal(run.exitCode, undefined)
      })

      test('-d asks before deleting anything', async () => {
        const remote = [{ name: 'Old', color: 'FFFFFF', url: 'https://api.github.com/repos/Zebiano/Labeler/labels/Old' }]
        answers = [{ confirmed: true }]
        fetching = stubFetch(request => request.method == 'DELETE' ? new Response(null, { status: 204 }) : json(200, remote))
        const run = await capture(() => helper.deleteAllLabels('ghp_token', 'Zebiano', 'api.github.com', 'Labeler', cli(), false))

        assert.deepEqual(fetching.requests.map(request => request.method), ['GET', 'DELETE'])
        assert.equal(run.text.includes('Delete: Old'), true)
      })

      test('only skips the repository at hand during a bulk update', async () => {
        fetching = stubFetch(() => new Response(null, { status: 200 }))

        for (const flow of [helper.uploadLabels, helper.deleteAllLabels]) {
          answers = [{ confirmed: false }]
          const run = await capture(() => flow('ghp_token', 'Zebiano', enterprise, 'Labeler', cli({ bulkUpdate: true }), false))
          assert.equal(run.exited, false, flow.name)
        }
        assert.deepEqual(fetching.requests, [])
      })
    })

    describe('the config CLI', () => {
      test('shows the config, stores what is entered and removes what is emptied', async () => {
        answers = [
          { choice: 'owner' }, { value: 'Zebiano' },
          { choice: 'token' }, { value: 'ghp_token' },
          { choice: 'token' }, { value: '' },
          { choice: 'exit' }
        ]
        const run = await capture(() => helper.cliConfig())

        assert.deepEqual(store.getAll('config'), { owner: 'Zebiano' })
        assert.equal(run.lines[0], 'Info: Current config:')
        assert.equal(run.exited, true)
      })

      test('the token is masked while it is on screen', async () => {
        store.set('config', { token: 'ghp_1234567890abcd' })
        answers = [{ choice: 'exit' }]
        const run = await capture(() => helper.cliConfig())

        assert.equal(run.text.includes('**************abcd'), true)
        assert.equal(run.text.includes('ghp_1234567890abcd'), false)
      })

      test('backing out of a setting changes nothing', async () => {
        answers = [{ choice: 'repository' }, { confirmed: false }, { choice: 'exit' }]
        const run = await capture(() => helper.cliConfig())

        assert.deepEqual(store.getAll('config'), {})
        assert.equal(run.exited, true)
      })
    })

    describe('the new label CLI', () => {
      test('labels are added to the file one at a time', async () => {
        answers = [{ name: 'Idea', description: '', color: 'D2DAE1' }]
        const run = await capture(() => enterLabels(cli({ force: true })))

        assert.deepEqual(store.getAll('labels'), [{ name: 'Bug', color: 'FC271E' }, { name: 'Idea', description: '', color: 'D2DAE1' }])
        assert.equal(run.text.includes('Success: Saved label!'), true)
      })

      test('a name that is taken is refused, and the run ends as failed', async () => {
        answers = [{ name: 'Bug', description: '', color: 'FFFFFF' }]
        const run = await capture(() => enterLabels(cli({ force: true })))

        assert.deepEqual(store.getAll('labels'), [{ name: 'Bug', color: 'FC271E' }])
        assert.equal(run.text.includes("Error: Label 'Bug' already exists!"), true)
        assert.equal(run.exitCode, 1)
      })

      test('the file can be emptied first', async () => {
        answers = [{ choice: true }, { name: 'Idea', description: '', color: 'D2DAE1' }]
        await capture(() => enterLabels(cli()))

        assert.deepEqual(store.getAll('labels'), [{ name: 'Idea', description: '', color: 'D2DAE1' }])
      })

      test('-fn keeps the labels that are there', async () => {
        await capture(() => enterLabels(cli({ force: true })))

        assert.deepEqual(store.getAll('labels'), [{ name: 'Bug', color: 'FC271E' }])
      })
    })
  })
})
