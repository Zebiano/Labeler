// Import: Packages
import { bold } from 'yoctocolors'

// Import: Libs
import * as inquirer from './inquirer.js'
import * as config from './store.js'
import * as github from './github.js'
import * as echo from './echo.js'
import type { Label } from './github.js'

/* --- Types --- */
// The flags Meow parses off the command line
export interface Flags {
  help?: boolean | undefined
  config?: boolean | undefined
  bulkUpdate?: boolean | undefined
  deleteAllLabels?: boolean | undefined
  newLabel?: boolean | undefined
  uploadLabels?: boolean | undefined
  force?: boolean | undefined
  emptyLabelsFile?: boolean | undefined
  resetLabelsFile?: boolean | undefined
  path?: boolean | undefined
  token?: string | undefined
  owner?: string | undefined
  repository?: string | undefined
  host?: string | undefined
}

// The part of Meow's result these helpers need
export interface Cli {
  flags: Flags
}

// The values stored in the config
export interface Config {
  token?: string | undefined
  owner?: string | undefined
  repository?: string | undefined
  host?: string | undefined
}

// A value that can come either from a flag or from the config
export type ConfigKey = 'token' | 'owner' | 'repository' | 'host'

// The values every repository operation requires
export interface Target {
  token: string
  owner: string
  repository: string
}

/* --- Functions --- */
// Echo the owner and repository
export function echoOwnerRepository(owner: string | null, repository: string | null): void {
  echo.owner(String(owner))
  echo.repository(String(repository))
  console.log()
}

// Returns flag from arguments, or from config
// Meow omits string flags that were not passed, so an absent key means "fall back to the config"
export function assignFlag(cli: Cli, flag: 'host'): string
export function assignFlag(cli: Cli, flag: ConfigKey): string | null
export function assignFlag(cli: Cli, flag: ConfigKey): string | null {
  if (Object.hasOwn(cli.flags, flag)) return cli.flags[flag] ?? null
  else if (config.has('config', flag)) return config.get('config', flag) as string
  else {
    if (flag == 'host') return github.defaultHost
    else return null
  }
}

// Echos the path for labels.json
export function labelsPath(): void {
  echo.info("Path for 'labels.json'")
  echo.info(config.path('labels') as string)
  console.log()
}

// Censor config
// Masks the whole token except its last four characters, whatever its length. A fixed-width
// mask leaked most of a long token and none of a short one
export function censorConfig(values: Config): Config {
  if (!values.token) return { ...values }
  const visible = values.token.length > 8 ? values.token.slice(-4) : ''
  return { ...values, token: '*'.repeat(values.token.length - visible.length) + visible }
}

// Check required flags. Every branch exits, so the returned values are always set
export function checkRequiredFlags(token: string | null, owner: string | null, repository: string | null): Target {
  if (!token && !owner && !repository) {
    echo.error('Missing arguments.')
    echo.tip('Use -h for help.', true)
  } else if (!token) {
    echo.error('You need to specify a token!')
    echo.tip('Use the -t flag.', true)
  } else if (!owner) {
    echo.error('You need to specify an owner!')
    echo.tip('Use the -o flag.', true)
  } else if (!repository) {
    echo.error('You need to specify a repository!')
    echo.tip('Use the -r flag.', true)
  }
  return { token, owner, repository }
}

// Check flags
export function checkFlags(cli: Cli): void {
  // Bulk update only exists for GitHub Enterprise. The resolved host is what matters, not
  // the flag, because a host can equally come from the config
  if (cli.flags.bulkUpdate && assignFlag(cli, 'host') == github.defaultHost) {
    echo.error('Bulk update requires a GitHub Enterprise host.')
    echo.tip('Specify one with -H, or store one with -c.', true)
  }

  // Check for usage of flags that shouldn't be used together
  if (((cli.flags.repository || cli.flags.token || cli.flags.owner || cli.flags.host || cli.flags.bulkUpdate || cli.flags.uploadLabels || cli.flags.deleteAllLabels) && (cli.flags.newLabel || cli.flags.config))
    || (cli.flags.config && cli.flags.newLabel)
    || (cli.flags.emptyLabelsFile && (cli.flags.repository || cli.flags.token || cli.flags.owner || cli.flags.host || cli.flags.bulkUpdate || cli.flags.uploadLabels || cli.flags.deleteAllLabels || cli.flags.config || cli.flags.resetLabelsFile))
    || (cli.flags.bulkUpdate && cli.flags.repository)) {
    echo.error('Wrong usage.')
    echo.tip('Use -h for help.', true)
  }
}

// Reports what was brought over from a previous installation. The import itself runs when
// the store module is first loaded, so there is nothing to decide here
export function echoMigration(): void {
  const imported = config.importedFromLegacy()
  if (!imported.config && !imported.labels) return

  echo.info(`Imported ${imported.config} config value(s) and ${imported.labels} label(s) from your previous installation.`)

  // Clear up after ourselves, now that the data is safely in the new store
  const removed = config.removeLegacy()
  if (removed.length) echo.info(`Removed ${removed.length} old file(s) from ${config.legacyDir()}\n`)
  else echo.tip(`The old files are in ${config.legacyDir()} and can be deleted.\n`)
}

// Deletes labels.json and creates it again with default values
export async function resetLabelsFile(cli: Cli): Promise<void> {
  // Ask if the user is sure
  if (!cli.flags.force) {
    const answer = await inquirer.confirmResetLabels()
    if (!answer.resetLabels) {
      console.log()
      echo.abort("Reset 'labels.json'.", true)
    }
  }

  // Reset labels
  echo.info("Resetting 'labels.json'...")
  config.resetLabels()
  echo.success('Done!\n')
}

// Empties all labels from labels.json
export async function emptyLabelsFile(cli: Cli): Promise<void> {
  // Ask if the user is sure
  if (!cli.flags.force) {
    const answer = await inquirer.confirmEmptyLabels()
    if (!answer.emptyLabels) {
      console.log()
      echo.abort("Delete labels from 'labels.json'.", true)
    }
  }

  // Empty labels.json
  echo.info("Emptying 'labels.json'...")
  config.set('labels', { 'labels': [] })
  if (cli.flags.newLabel) echo.success('Done.\n')
  else echo.success('Done.\n', true)
}

// Upload all labels from labels.json
export async function uploadLabels(token: string | null, owner: string | null, host: string, repository: string | null, cli: Cli, exit: boolean): Promise<void> {
  // Check required Flags
  const target = checkRequiredFlags(token, owner, repository)

  // Variables
  const labels = config.getAll('labels') as Label[]

  // Ask if the user is sure
  if (!cli.flags.force) {
    const answer = await inquirer.confirmUploadLabels(target.repository)
    if (!answer.uploadLabels) {
      if (cli.flags.bulkUpdate) return
      console.log()
      echo.abort(`Upload labels to ${target.repository}.`, true)
    }
  }
  echo.info(bold(`Uploading labels to ${target.repository}...`))

  // Run promises (aka upload all labels)
  await Promise.all(labels.map(label => github.saveLabel(false, target.token, target.owner, host, target.repository, label)))

  // Done
  echo.success('Done!\n')
  if (exit) echo.success('Finished!', exit)
}

// Deletes all labels from a repository
export async function deleteAllLabels(token: string | null, owner: string | null, host: string, repository: string | null, cli: Cli, exit: boolean): Promise<void> {
  // Check required Flags
  const target = checkRequiredFlags(token, owner, repository)

  // Ask if the user is sure
  if (!cli.flags.force) {
    const answer = await inquirer.confirmDeleteAllLabels(target.repository)
    if (!answer.deleteAllLabels) {
      if (cli.flags.bulkUpdate) return
      console.log()
      echo.abort(`Delete labels from ${target.repository}.`, true)
    }
  }
  echo.info(bold(`Deleting labels from ${target.repository}...`))

  // Get all labels from repository
  const allLabels = await github.getLabels(true, target.token, target.owner, host, target.repository)

  // Run promises (aka delete all labels)
  await Promise.all((allLabels ?? []).map(label => github.deleteLabel(false, target.token, label)))

  // Done
  if (cli.flags.uploadLabels) echo.success('Done!\n')
  else if (exit) {
    console.log()
    echo.success('Finished!', exit)
  }
}

// Gets array of repository names in "owner" organization
export async function getRepositories(token: string | null, owner: string | null, host: string): Promise<string[]> {
  // Variables
  const repos: string[] = []
  const perPage = 100

  // Check required Flags (repository not needed here but need to send so check won't fail)
  const target = checkRequiredFlags(token, owner, 'sample')

  // Get the 'link' header from a request to list all repositories for the given org
  const link = await github.headRepoList(true, target.token, target.owner, host, 1)
  if (!link) echo.error('Unexpected status or response on HEAD request for GHE repository list.', true)

  // By passing in 1 as the per_page value, the "last" page link will have a page number equal to the number of repos
  // To compute the actual number of necessary requests, divide the number of repos by the requested per_page limit (max 100)
  const numberOfRepos = getPageCountFromLinkHeader(link)
  const pageCount = Math.ceil(numberOfRepos / perPage)
  echo.info(bold(`Fetching list of ${numberOfRepos} repository name(s) across ${pageCount} page(s), in organization ${target.owner}...`))

  // Push every repo into repos array
  for (let i = 1; i <= pageCount; i++) {
    const res = await github.getReposByPage(true, target.token, target.owner, host, i, perPage)
    for (const repo of res ?? []) {
      // Get the url for each repo object and extract just the name at the end of the url
      repos.push(repo.html_url.substring(repo.html_url.lastIndexOf('/') + 1))
    }
  }
  return repos
}

// Gets the total number of repositories by parsing the "last" rel of the "link" response header
// GitHubApi has a per_page limit of 100, default 30
export function getPageCountFromLinkHeader(header: string): number {
  if (!header || header.length === 0) echo.error('Header input must not be null or of zero length.', true)

  // Split parts by comma
  const parts = header.split(',')

  // Parse each part into a named link
  for (const part of parts) {
    const section = part.split(';')
    if (section.length !== 2) echo.error('Section could not be properly split on ";".', true)

    const url = section[0]?.replace(/<(.*)>/, '$1').trim() ?? ''
    const name = section[1]?.replace(/rel="(.*)"/, '$1').trim() ?? ''
    if (name === 'last') {
      const page = url.match(/.*&page=(\d+).*/)?.[1]
      if (!page) echo.error('Repository page count could not be found for given GHE org.', true)
      return Number(page)
    }
  }

  // Log error and exit if the last page link cannot be found
  echo.error('Repository page count could not be found for given GHE org.', true)
}

// Opens the interactive config CLI
export async function cliConfig(): Promise<void> {
  // Clear
  console.clear()

  // Display current config
  echo.info("Current config:")
  console.log(censorConfig(config.getAll('config') as Config))
  console.log()

  // Get config input from user
  const answer = await inquirer.config()

  // Check input
  // inquirer.config() answers true when "Exit Config" is chosen
  if (answer === true) process.exit()
  else if (answer) {
    if (Object.hasOwn(answer, 'token')) {
      // Token
      if (answer.token) config.set('config', answer)
      else config.remove('config', 'token')
    } else if (Object.hasOwn(answer, 'owner')) {
      // Owner
      if (answer.owner) config.set('config', answer)
      else config.remove('config', 'owner')
    } else if (Object.hasOwn(answer, 'repository')) {
      // Repository
      if (answer.repository) config.set('config', answer)
      else config.remove('config', 'repository')
    } else if (Object.hasOwn(answer, 'host')) {
      // Host
      if (answer.host) config.set('config', answer)
      else config.remove('config', 'host')
    } else {
      // Exit
      process.exit()
    }
  }

  // Call this function again until user exits
  await cliConfig()
}

// Opens the interactive "create new label" CLI
export async function cliNewLabel(cli: Cli): Promise<void> {
  // Variables
  const labels = config.getAll('labels') as Label[]

  // Get config input from user
  const answer = await inquirer.newLabel() as Label

  // Check for dupe
  const dupe = labels.some(label => label.name == answer.name)

  // Save if not dupe
  if (!dupe) {
    labels.push(answer)
    config.set('labels', { 'labels': labels })
    echo.success('Saved label! Use Ctrl+C to exit.\n')
  } else echo.error(`Label '${answer.name}' already exists! Please choose another name.\n`)

  // Call this function again until user exits
  await cliNewLabel(cli)
}
