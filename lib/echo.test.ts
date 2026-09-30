// Import: Packages
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

// Import: Libs
import * as echo from './echo.js'
import { capture } from '../test/helpers/capture.js'

describe('echo', () => {
  test('every printer labels its message', async () => {
    const labels: [keyof typeof echo, string][] = [
      ['info', 'Info: '],
      ['tip', 'Tip: '],
      ['success', 'Success: '],
      ['warning', 'Warning: '],
      ['abort', 'Abort: '],
      ['error', 'Error: '],
      ['upload', 'Upload: '],
      ['remove', 'Delete: '],
      ['skip', 'Skip: '],
      ['owner', 'Owner: '],
      ['repository', 'Repository: ']
    ]

    for (const [name, label] of labels) {
      const run = await capture(() => { echo[name]('message') })
      assert.deepEqual(run.lines, [`${label}message`], `printer: ${name}`)
      assert.equal(run.exited, false)
    }
  })

  test('only error marks the run as failed', async () => {
    const failed = await capture(() => { echo.error('broke') })
    assert.equal(failed.exitCode, 1)

    const fine = await capture(() => { echo.info('all good') })
    assert.equal(fine.exitCode, undefined)
  })

  test('the exit argument ends the process', async () => {
    const run = await capture(() => { echo.info('done', true) })
    assert.equal(run.exited, true)
  })

  test('an error reported before a tip still exits 1', async () => {
    const run = await capture(() => {
      echo.error('broke')
      echo.tip('Use -h for help.', true)
    })
    assert.deepEqual(run.lines, ['Error: broke', 'Tip: Use -h for help.'])
    assert.equal(run.exited, true)
    assert.equal(run.exitCode, 1)
  })
})
