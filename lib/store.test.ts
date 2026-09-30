// Import: Packages
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import Os from 'node:os'
import Path from 'node:path'
import { after, before, beforeEach, describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { stripVTControlCharacters } from 'node:util'

// Import: Libs
import * as store from './store.js'
import { seedLegacy } from '../test/helpers/legacy.js'
import defaultLabels from './_default_labels.json' with { type: 'json' }
import type { Config, Imported } from './store.js'
import type { Label } from './github.js'

/* --- Types --- */
/** What a first run printed, and what it left in the stores */
interface FirstRun {
  /** The v5 notice, one entry per line */
  notice: string[]
  imported: Imported
  config: Config
  labels: Label[]
}

/* --- Variables --- */
const sandbox = process.env['XDG_CONFIG_HOME']

/** Loads the store in a process of its own, see firstRun */
const migrate = fileURLToPath(new URL('../test/helpers/migrate.js', import.meta.url))

/* --- Helpers --- */
/**
 * Loads the store against a config directory of its own, in a new process. A migration only
 * runs when a store is first built, and that can happen only once per process.
 * @param dir The config directory
 * @returns What it printed and imported
 */
function firstRun(dir: string): FirstRun {
  const output = execFileSync(process.execPath, [migrate], { encoding: 'utf8', env: { ...process.env, XDG_CONFIG_HOME: dir } })
  const lines = stripVTControlCharacters(output).trimEnd().split('\n')
  const result = JSON.parse(lines.pop() ?? '') as Omit<FirstRun, 'notice'>
  return { notice: lines, ...result }
}

describe('store', () => {
  beforeEach(() => {
    store.set('config', {})
    for (const key of Object.keys(store.getAll('config'))) store.remove('config', key)
    store.resetLabels()
  })

  test('values survive a round trip', () => {
    store.set('config', { owner: 'Zebiano', token: 'ghp_token' })
    assert.equal(store.get('config', 'owner'), 'Zebiano')
    assert.equal(store.has('config', 'token'), true)

    store.remove('config', 'token')
    assert.equal(store.has('config', 'token'), false)
    assert.equal(store.get('config', 'token'), undefined)
  })

  test('writing the config leaves the labels alone', () => {
    store.set('config', { owner: 'Zebiano' })

    const labels = store.getAll('labels')
    assert.equal(Array.isArray(labels), true)
    assert.equal(store.has('labels', 'owner'), false)
    assert.equal(JSON.parse(readFileSync(store.path('labels'), 'utf8'))['owner'], undefined)
  })

  test("getAll('config') hides conf's bookkeeping", () => {
    store.set('config', { owner: 'Zebiano' })
    assert.deepEqual(store.getAll('config'), { owner: 'Zebiano' })
    assert.equal(store.has('config', '__internal__'), true)
  })

  test("getAll('labels') falls back to the shipped defaults", () => {
    store.remove('labels', 'labels')
    assert.deepEqual(store.getAll('labels'), defaultLabels)
  })

  test('the labels can be replaced and reset', () => {
    store.set('labels', { labels: [{ name: 'Bug', color: 'FC271E' }] })
    assert.deepEqual(store.getAll('labels'), [{ name: 'Bug', color: 'FC271E' }])

    store.resetLabels()
    assert.deepEqual(store.getAll('labels'), defaultLabels)
  })

  test('both stores live in the config directory, in separate files', () => {
    assert.equal(Path.dirname(store.path('config')), Path.dirname(store.path('labels')))
    assert.notEqual(store.path('config'), store.path('labels'))
    assert.equal(store.path('config').startsWith(String(sandbox)), true)
  })

  test("v5's paths are the ones configstore used", () => {
    assert.equal(store.legacyDir(), Path.join(String(sandbox), 'configstore'))
    assert.deepEqual(store.legacyPaths(), {
      config: Path.join(store.legacyDir(), 'labeler.json'),
      labels: Path.join(store.legacyDir(), 'labeler_labels.json')
    })
  })

  test("v5's directory is under ~/.config when XDG_CONFIG_HOME is not set", () => {
    delete process.env['XDG_CONFIG_HOME']
    try {
      assert.equal(store.legacyDir(), Path.join(Os.homedir(), '.config', 'configstore'))
    } finally {
      process.env['XDG_CONFIG_HOME'] = sandbox
    }
  })

  test('a fresh installation imports nothing', () => {
    assert.deepEqual(store.importedFromLegacy(), { config: 0, labels: 0, removed: [] })
  })
})

describe('the v5 import', () => {
  describe('a v5 installation', () => {
    let legacy: string
    let run: FirstRun

    before(() => {
      const seeded = seedLegacy(
        { token: 'ghp_v5', owner: 'Zebiano' },
        { labels: [{ name: 'Bug', color: 'FC271E', description: 'A bug' }] }
      )
      legacy = seeded.legacy
      run = firstRun(seeded.dir)
    })

    test('is counted as it comes across', () => {
      assert.equal(run.imported.config, 2)
      assert.equal(run.imported.labels, 1)
    })

    test('keeps its config and its labels', () => {
      assert.deepEqual(run.config, { token: 'ghp_v5', owner: 'Zebiano' })
      assert.deepEqual(run.labels, [{ name: 'Bug', color: 'FC271E', description: 'A bug' }])
    })

    test('leaves its old files behind', () => {
      assert.deepEqual(run.imported.removed, [
        Path.join(legacy, 'labeler.json'),
        Path.join(legacy, 'labeler_labels.json')
      ])
      assert.equal(existsSync(Path.join(legacy, 'labeler.json')), false)
      assert.equal(existsSync(Path.join(legacy, 'labeler_labels.json')), false)
    })

    test('does not touch another tool sharing the directory', () => {
      assert.equal(readFileSync(Path.join(legacy, 'update-notifier-labeler.json'), 'utf8'), '{"another":"tool"}')
    })

    test('is reported to the user', () => {
      assert.deepEqual(run.notice, [
        '',
        'Info: Imported 2 config value(s) and 1 label(s) from your previous installation.',
        `Info: Removed 2 old file(s) from ${legacy}`
      ])
    })
  })

  describe('an installation that already imported', () => {
    let legacy: string
    let run: FirstRun

    /* conf records the import in the store itself. The v5 files are left in place to prove
       that a later run neither reads nor removes them */
    before(() => {
      const seeded = seedLegacy({ token: 'ghp_v5' }, { labels: [{ name: 'Bug', color: 'FC271E' }] })
      const stamped = Path.join(seeded.dir, 'labeler-nodejs')
      mkdirSync(stamped)
      for (const file of ['config.json', 'labels.json']) {
        writeFileSync(Path.join(stamped, file), JSON.stringify({ __internal__: { migrations: { version: '1.0.0' } } }))
      }
      legacy = seeded.legacy
      run = firstRun(seeded.dir)
    })

    test('imports nothing a second time, and says nothing', () => {
      assert.deepEqual(run.imported, { config: 0, labels: 0, removed: [] })
      assert.deepEqual(run.config, {})
      assert.deepEqual(run.notice, [])
    })

    test('leaves the old files alone', () => {
      assert.equal(existsSync(Path.join(legacy, 'labeler.json')), true)
      assert.equal(existsSync(Path.join(legacy, 'labeler_labels.json')), true)
    })
  })

  describe('a v5 directory that cannot be written to', () => {
    let legacy: string
    let run: FirstRun

    /* Nothing may be removed from it. An empty labels file comes with it, since neither is
       worth reporting as an import */
    before(() => {
      const seeded = seedLegacy({ token: 'ghp_v5' }, { labels: [] })
      legacy = seeded.legacy
      chmodSync(legacy, 0o500)
      run = firstRun(seeded.dir)
    })

    after(() => {
      chmodSync(legacy, 0o700)
    })

    test('still hands its config over', () => {
      assert.equal(run.imported.config, 1)
      assert.deepEqual(run.config, { token: 'ghp_v5' })
    })

    test('reports no labels, since there were none', () => {
      assert.equal(run.imported.labels, 0)
    })

    test('keeps the files it could not remove, and says where they are', () => {
      assert.deepEqual(run.imported.removed, [])
      assert.equal(readFileSync(Path.join(legacy, 'labeler.json'), 'utf8'), '{"token":"ghp_v5"}')
      assert.equal(run.notice.at(-1), `Tip: The old files are in ${legacy} and can be deleted.`)
    })
  })
})
