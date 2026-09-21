// Import: Packages
import Inquirer from 'inquirer'

// Import: Libs
import { defaultApiVersion, enterpriseApiVersion } from './github.js'

/* --- Types --- */
// A single answered entry of the interactive config CLI
export interface ConfigAnswer {
  token?: string
  owner?: string
  repository?: string
  host?: string
  apiVersion?: string
  enterpriseApiVersion?: string
}

// The answers that make up a new label
export interface NewLabelAnswer {
  name: string
  description: string
  color: string
}

/* --- Helpers --- */
// yoctocolors has no truecolor support, so build the swatch escape sequence by hand.
// The transformer runs on every keystroke, so an incomplete hex is left uncoloured
function bgHex(hex: string, text: string): string {
  if (!/^[A-Fa-f0-9]{6}$/.test(hex)) return text
  if (process.env["NO_COLOR"] || !process.stdout.isTTY) return text
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `\u001B[48;2;${r};${g};${b}m${text}\u001B[49m`
}

/* --- Input --- */
// Personal Access Token
const inputToken = {
  type: 'password',
  name: 'token',
  message: "Enter Personal GitHub Access Token (e.g. 'ghp_...' or 'github_pat_...'):"
} as const

// Owner
const inputOwner = {
  type: 'input',
  name: 'owner',
  message: "Enter GitHub owner (e.g. 'Zebiano'):"
} as const

// Repository
const inputRepository = {
  type: 'input',
  name: 'repository',
  message: "Enter GitHub repository (e.g. 'Labeler'):"
} as const

// Host
const inputHost = {
  type: 'input',
  name: 'host',
  message: "Enter GitHub Enterprise Host (e.g. 'github.yourhost.com'):"
} as const

// API version for github.com
const inputApiVersion = {
  type: 'input',
  name: 'apiVersion',
  message: `Enter API version for github.com (e.g. '${defaultApiVersion}'):`
} as const

// API version for GitHub Enterprise
const inputEnterpriseApiVersion = {
  type: 'input',
  name: 'enterpriseApiVersion',
  message: `Enter API version for GitHub Enterprise (e.g. '${enterpriseApiVersion}'):`
} as const

// Label name
const inputLabelName = {
  type: 'input',
  name: 'name',
  message: "Enter Label name (e.g. 'Bug :beetle:'):",
  validate: (value: string) => {
    if (value.length) return true
    else return 'Please enter a valid Label name. For example "Bug".'
  }
} as const

// Label description
const inputLabelDescription = {
  type: 'input',
  name: 'description',
  message: "Enter Label description (optional, e.g. 'This is a bug'):"
} as const

// Color
const inputLabelColor = {
  type: 'input',
  name: 'color',
  message: "Enter Label Color (e.g. 'FC271E'):",
  validate: (value: string) => {
    if (value.length && /^([A-Fa-f0-9]{6})$/.test(value)) return true
    else return 'Please enter a valid Hex color. For example "D2DAE1".'
  },
  transformer: (color: string) => { return `${bgHex(color, '  ')} ${color}` }
} as const

/* --- List --- */
// List for config
const listConfig = {
  type: 'select',
  name: 'choice',
  message: 'Which of the following do you want to update?',
  choices: [
    {
      name: 'Personal Access Token',
      value: 'token'
    },
    {
      name: 'Owner',
      value: 'owner'
    },
    {
      name: 'Repository',
      value: 'repository'
    },
    {
      name: 'GitHub Enterprise Host',
      value: 'host'
    },
    {
      name: 'API version (github.com)',
      value: 'apiVersion'
    },
    {
      name: 'API version (GitHub Enterprise)',
      value: 'enterpriseApiVersion'
    },
    new Inquirer.Separator(),
    {
      name: 'Exit Config',
      value: 'exit'
    }
  ]
} as const

// List for new label
const listFresh = {
  type: 'select',
  name: 'choice',
  message: "Would you like to start a fresh new 'labels.json' file?",
  choices: [
    {
      name: 'Yes, I want to start fresh!',
      value: true
    },
    {
      name: 'No, I want to keep the currently stored labels and add my own ones to the list.',
      value: false
    }
  ]
} as const

/* --- Confirm --- */
// Confirm Repository
const confirmRepo = {
  type: 'confirm',
  name: 'updateRepo',
  message: 'It is NOT recommended to store repositories in the config as it is prone to mistakenly editing the wrong repository. Do you want to proceed?',
  default: false
} as const

// Confirm emptying labels.json
const confirmLabelsEmpty = {
  type: 'confirm',
  name: 'emptyLabels',
  message: "Are you sure you want to delete all labels from 'labels.json'?",
  default: false
} as const

// Confirm resetting labels.json
const confirmLabelsReset = {
  type: 'confirm',
  name: 'resetLabels',
  message: "Are you sure you want to reset 'labels.json' to the default labels?",
  default: false
} as const

/* --- Functions --- */
// Confirm deletion of all labels
export function confirmDeleteAllLabels(repository: string): Promise<{ deleteAllLabels: boolean }> {
  return Inquirer.prompt({
    type: 'confirm',
    name: 'deleteAllLabels',
    message: `Are you sure you want to delete ALL labels from the ${repository} repository?`,
    default: false
  })
}

// Confirm upload of all labels
export function confirmUploadLabels(repository: string): Promise<{ uploadLabels: boolean }> {
  return Inquirer.prompt({
    type: 'confirm',
    name: 'uploadLabels',
    message: `Are you sure you want to upload all labels from 'labels.json' to the ${repository} repository?`,
    default: false
  })
}

// Confirm deletion of all labels in labels.json
export function confirmEmptyLabels(): Promise<{ emptyLabels: boolean }> { return Inquirer.prompt(confirmLabelsEmpty) }

// Confirm reset of labels.json
export function confirmResetLabels(): Promise<{ resetLabels: boolean }> { return Inquirer.prompt(confirmLabelsReset) }

// Ask for Token, Owner, Host, Repository
export async function config(): Promise<ConfigAnswer | true | undefined> {
  const answerConfig = await Inquirer.prompt(listConfig)
  if (answerConfig.choice == 'token') return await Inquirer.prompt(inputToken)
  else if (answerConfig.choice == 'owner') return await Inquirer.prompt(inputOwner)
  else if (answerConfig.choice == 'host') return await Inquirer.prompt(inputHost)
  else if (answerConfig.choice == 'apiVersion') return await Inquirer.prompt(inputApiVersion)
  else if (answerConfig.choice == 'enterpriseApiVersion') return await Inquirer.prompt(inputEnterpriseApiVersion)
  else if (answerConfig.choice == 'repository') {
    console.clear()
    const answerConfirm = await Inquirer.prompt(confirmRepo)
    if (answerConfirm.updateRepo) return await Inquirer.prompt(inputRepository)
  } else if (answerConfig.choice == 'exit') return true
  return undefined
}

// Ask for new Label data
export async function newLabel(): Promise<NewLabelAnswer> {
  return await Inquirer.prompt([inputLabelName, inputLabelDescription, inputLabelColor])
}

// Ask for deletion or not of labels.json when running -n
export async function choiceFreshNewLabels(): Promise<boolean> {
  const answerFresh = await Inquirer.prompt(listFresh)
  if (answerFresh.choice) return true
  else return false
}
