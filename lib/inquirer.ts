// Import: Packages
import Inquirer from 'inquirer'

// Import: Libs
import { defaultApiVersion, enterpriseApiVersion } from './github.js'
import type { Label } from './github.js'
import type { Config } from './store.js'

/* --- Types --- */
/** A setting chosen in the config menu, with the value entered for it */
export interface ConfigAnswer {
  /** Which setting */
  key: keyof Config
  /** The new value. An empty one removes the setting */
  value: string
}

/* --- Variables --- */
/** A label colour, the way GitHub expects it */
const hexColorRegEx = /^[A-Fa-f0-9]{6}$/

/** The settings the config menu offers, in menu order, with the prompt for each */
const settings = [
  { key: 'token', menu: 'Personal Access Token', type: 'password', message: "Enter Personal GitHub Access Token (e.g. 'ghp_...' or 'github_pat_...'):" },
  { key: 'owner', menu: 'Owner', type: 'input', message: "Enter GitHub owner (e.g. 'Zebiano'):" },
  { key: 'repository', menu: 'Repository', type: 'input', message: "Enter GitHub repository (e.g. 'Labeler'):" },
  { key: 'host', menu: 'GitHub Enterprise Host', type: 'input', message: "Enter GitHub Enterprise Host (e.g. 'github.yourhost.com'):" },
  { key: 'apiVersion', menu: 'API version (github.com)', type: 'input', message: `Enter API version for github.com (e.g. '${defaultApiVersion}'):` },
  { key: 'enterpriseApiVersion', menu: 'API version (GitHub Enterprise)', type: 'input', message: `Enter API version for GitHub Enterprise (e.g. '${enterpriseApiVersion}'):` }
] as const

/* --- Helpers --- */
/**
 * Paints text on a colour, by hand, since yoctocolors has no truecolor support. This runs on
 * every keystroke, so an incomplete hex is left uncoloured.
 * @param hex Six hex digits
 * @param text Text to paint
 * @returns The text, coloured where possible
 */
function bgHex(hex: string, text: string): string {
  if (!hexColorRegEx.test(hex)) return text
  if (process.env["NO_COLOR"] || !process.stdout.isTTY) return text
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `\u001B[48;2;${r};${g};${b}m${text}\u001B[49m`
}

/**
 * Asks a yes/no question that defaults to no.
 * @param message The question
 * @returns The answer
 */
async function confirm(message: string): Promise<boolean> {
  const answer = await Inquirer.prompt({ type: 'confirm', name: 'confirmed', message, default: false })
  return answer.confirmed
}

/* --- Functions --- */
/**
 * Confirms deleting every label in a repository.
 * @param repository Repository name
 * @returns The answer
 */
export function confirmDeleteAllLabels(repository: string): Promise<boolean> {
  return confirm(`Are you sure you want to delete ALL labels from the ${repository} repository?`)
}

/**
 * Confirms uploading every stored label to a repository.
 * @param repository Repository name
 * @returns The answer
 */
export function confirmUploadLabels(repository: string): Promise<boolean> {
  return confirm(`Are you sure you want to upload all labels from 'labels.json' to the ${repository} repository?`)
}

/**
 * Confirms emptying 'labels.json'.
 * @returns The answer
 */
export function confirmEmptyLabels(): Promise<boolean> {
  return confirm("Are you sure you want to delete all labels from 'labels.json'?")
}

/**
 * Confirms resetting 'labels.json' to the defaults.
 * @returns The answer
 */
export function confirmResetLabels(): Promise<boolean> {
  return confirm("Are you sure you want to reset 'labels.json' to the default labels?")
}

/**
 * Asks which setting to change, and its new value.
 * @returns The answer, 'exit' when the user is done, or undefined when they back out of
 * storing a repository
 */
export async function config(): Promise<ConfigAnswer | 'exit' | undefined> {
  const answer = await Inquirer.prompt({
    type: 'select',
    name: 'choice',
    message: 'Which of the following do you want to update?',
    // Every entry has to fit, or 'Exit Config' scrolls off the end and the menu looks endless
    pageSize: settings.length + 2,
    choices: [
      ...settings.map(setting => ({ name: setting.menu, value: setting.key })),
      new Inquirer.Separator(),
      { name: 'Exit Config', value: 'exit' }
    ]
  })
  const setting = settings.find(setting => setting.key == answer.choice)
  if (!setting) return 'exit'

  // Storing a repository makes it easy to edit the wrong one by mistake
  if (setting.key == 'repository') {
    console.clear()
    if (!await confirm('It is NOT recommended to store repositories in the config as it is prone to mistakenly editing the wrong repository. Do you want to proceed?')) return undefined
  }

  const input = await Inquirer.prompt({ type: setting.type, name: 'value', message: setting.message })
  return { key: setting.key, value: input.value }
}

/**
 * Asks for a new label.
 * @returns Its name, description and colour
 */
export function newLabel(): Promise<Label> {
  return Inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: "Enter Label name (e.g. 'Bug :beetle:'):",
      validate: (value: string) => value.length > 0 || 'Please enter a valid Label name. For example "Bug".'
    },
    {
      type: 'input',
      name: 'description',
      message: "Enter Label description (optional, e.g. 'This is a bug'):"
    },
    {
      type: 'input',
      name: 'color',
      message: "Enter Label Color (e.g. 'FC271E'):",
      validate: (value: string) => hexColorRegEx.test(value) || 'Please enter a valid Hex color. For example "D2DAE1".',
      transformer: (color: string) => `${bgHex(color, '  ')} ${color}`
    }
  ])
}

/**
 * Asks whether -n should start from an empty 'labels.json'.
 * @returns The answer
 */
export async function choiceFreshNewLabels(): Promise<boolean> {
  const answer = await Inquirer.prompt({
    type: 'select',
    name: 'choice',
    message: "Would you like to start a fresh new 'labels.json' file?",
    choices: [
      { name: 'Yes, I want to start fresh!', value: true },
      { name: 'No, I want to keep the currently stored labels and add my own ones to the list.', value: false }
    ]
  })
  return answer.choice
}
