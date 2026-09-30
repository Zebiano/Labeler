// Import: Packages
import assert from 'node:assert/strict'
import { beforeEach, describe, mock, test } from 'node:test'

// Import: Libs
import { defaultApiVersion, enterpriseApiVersion } from './github.js'

/* --- Types --- */
/** A prompt as inquirer receives it, with only the fields the tests read */
interface Question {
  type?: string
  name?: string
  message?: string
  pageSize?: number
  default?: unknown
  choices?: { name?: string, value?: unknown, separator?: boolean }[]
  validate?: (value: string) => boolean | string
  transformer?: (value: string) => string
}

/* --- Variables --- */
/** The prompts that were opened, in order */
const asked: Question[][] = []

/** Answers handed back, one per prompt */
let answers: Record<string, unknown>[] = []

/* The package is replaced once, for the whole file, so that lib/inquirer.ts is loaded a single
   time. Every prompt it opens is recorded instead of being drawn */
mock.module('inquirer', {
  defaultExport: {
    prompt: (config: Question | Question[]): Promise<Record<string, unknown>> => {
      asked.push(Array.isArray(config) ? config : [config])
      return Promise.resolve(answers.shift() ?? {})
    },
    Separator: class { readonly separator = true }
  }
})

const inquirer = await import('./inquirer.js')

/* --- Helpers --- */
/**
 * Reads back a prompt that was opened.
 * @param prompt Which prompt, in the order they were opened
 * @param question Which question inside it
 * @returns The question
 */
function opened(prompt = 0, question = 0): Question {
  return asked[prompt]?.[question] ?? {}
}

describe('inquirer', () => {
  beforeEach(() => {
    asked.length = 0
    answers = []
  })

  describe('the config menu', () => {
    test('every setting is on the menu, and all of it fits on screen', async () => {
      answers = [{ choice: 'exit' }]
      await inquirer.config()

      const menu = opened()
      const names = menu.choices?.map(choice => choice.name ?? 'separator')
      assert.deepEqual(names, [
        'Personal Access Token',
        'Owner',
        'Repository',
        'GitHub Enterprise Host',
        'API version (github.com)',
        'API version (GitHub Enterprise)',
        'separator',
        'Exit Config'
      ])

      /* Inquirer scrolls anything past pageSize, and the entry that ends the menu is the last
         one, so a menu that does not fit reads as one that cannot be left */
      assert.equal(typeof menu.pageSize, 'number')
      assert.ok((menu.pageSize ?? 0) >= (menu.choices?.length ?? 0), `pageSize ${menu.pageSize} is smaller than the ${menu.choices?.length} entries`)
    })

    test('the exit entry ends the menu', async () => {
      answers = [{ choice: 'exit' }]
      assert.equal(await inquirer.config(), 'exit')
      assert.equal(asked.length, 1)
    })

    test('the token is asked for without being shown', async () => {
      answers = [{ choice: 'token' }, { value: 'ghp_token' }]
      const answer = await inquirer.config()

      assert.deepEqual(answer, { key: 'token', value: 'ghp_token' })
      assert.equal(opened(1).type, 'password')
    })

    test('the version prompts show the pinned versions as their example', async () => {
      answers = [{ choice: 'apiVersion' }, { value: '' }]
      await inquirer.config()
      assert.equal(opened(1).message?.includes(defaultApiVersion), true)

      asked.length = 0
      answers = [{ choice: 'enterpriseApiVersion' }, { value: '' }]
      await inquirer.config()
      assert.equal(opened(1).message?.includes(enterpriseApiVersion), true)
    })

    test('an empty value is handed back, which is what removes a setting', async () => {
      answers = [{ choice: 'owner' }, { value: '' }]
      assert.deepEqual(await inquirer.config(), { key: 'owner', value: '' })
    })

    test('storing a repository has to be confirmed', async () => {
      answers = [{ choice: 'repository' }, { confirmed: false }]
      assert.equal(await inquirer.config(), undefined)
      assert.equal(asked.length, 2)
      assert.equal(opened(1).type, 'confirm')

      asked.length = 0
      answers = [{ choice: 'repository' }, { confirmed: true }, { value: 'Labeler' }]
      assert.deepEqual(await inquirer.config(), { key: 'repository', value: 'Labeler' })
    })
  })

  describe('the confirmations', () => {
    test('each one names what it is about to do, and defaults to no', async () => {
      const confirmations: [() => Promise<boolean>, string][] = [
        [() => inquirer.confirmDeleteAllLabels('Labeler'), 'delete ALL labels from the Labeler repository'],
        [() => inquirer.confirmUploadLabels('Labeler'), "upload all labels from 'labels.json' to the Labeler repository"],
        [inquirer.confirmEmptyLabels, "delete all labels from 'labels.json'"],
        [inquirer.confirmResetLabels, "reset 'labels.json' to the default labels"]
      ]

      for (const [ask, message] of confirmations) {
        asked.length = 0
        answers = [{ confirmed: true }]

        assert.equal(await ask(), true)
        assert.equal(opened().type, 'confirm')
        assert.equal(opened().default, false)
        assert.equal(opened().message?.includes(message), true, message)
      }
    })
  })

  describe('a new label', () => {
    test('name, description and colour are asked for in one go', async () => {
      answers = [{ name: 'Bug', description: 'A bug', color: 'FC271E' }]
      const label = await inquirer.newLabel()

      assert.deepEqual(label, { name: 'Bug', description: 'A bug', color: 'FC271E' })
      assert.deepEqual(asked[0]?.map(question => question.name), ['name', 'description', 'color'])
    })

    test('a nameless label is refused', async () => {
      answers = [{}]
      await inquirer.newLabel()

      const validate = opened(0, 0).validate
      assert.equal(validate?.('Bug'), true)
      assert.equal(typeof validate?.(''), 'string')
    })

    test('only six hex digits are accepted as a colour', async () => {
      answers = [{}]
      await inquirer.newLabel()

      const validate = opened(0, 2).validate
      assert.equal(validate?.('FC271E'), true)
      assert.equal(validate?.('fc271e'), true)
      assert.equal(typeof validate?.('FC271'), 'string')
      assert.equal(typeof validate?.('#FC271E'), 'string')
      assert.equal(typeof validate?.('GGGGGG'), 'string')
    })

    test('the colour is previewed as a swatch once it is complete', async () => {
      answers = [{}]
      await inquirer.newLabel()
      const transformer = opened(0, 2).transformer

      // Colour needs a terminal that wants it, and yoctocolors has no truecolor support
      const isTTY = process.stdout.isTTY
      const noColor = process.env['NO_COLOR']
      process.stdout.isTTY = true
      delete process.env['NO_COLOR']

      try {
        assert.equal(transformer?.('FC271E'), '\u001B[48;2;252;39;30m  \u001B[49m FC271E')
        assert.equal(transformer?.('FC27'), '   FC27')
      } finally {
        process.stdout.isTTY = isTTY
        if (noColor != undefined) process.env['NO_COLOR'] = noColor
      }
    })

    test('a swatch is left out where colour is unwanted', async () => {
      answers = [{}]
      await inquirer.newLabel()

      const isTTY = process.stdout.isTTY
      process.stdout.isTTY = false
      try {
        assert.equal(opened(0, 2).transformer?.('FC271E'), '   FC271E')
      } finally {
        process.stdout.isTTY = isTTY
      }
    })
  })

  describe('starting a fresh labels file', () => {
    test('the choice is offered as yes or no', async () => {
      answers = [{ choice: true }]
      assert.equal(await inquirer.choiceFreshNewLabels(), true)
      assert.deepEqual(opened().choices?.map(choice => choice.value), [true, false])
    })
  })
})
