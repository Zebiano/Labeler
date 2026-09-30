// Import: Packages
import { bold } from 'yoctocolors'

// Import: Libs
import * as inquirer from './inquirer.js'
import * as store from './store.js'
import * as github from './github.js'
import * as echo from './echo.js'
import type { Config } from './store.js'

// Import: Types
// Meow's parsed result, typed from the flags declared in the entry point
import type { Cli } from '../labeler.js'

/* --- Types --- */
/** A value that can come either from a flag or from the config */
export type ConfigKey = 'token' | 'owner' | 'repository' | 'host'

/** The values every repository operation requires */
export interface Target {
  token: string
  owner: string
  repository: string
}

/* --- Functions --- */
/**
 * Prints the owner and repository being worked on.
 * @param owner Repository owner
 * @param repository Repository name
 */
export function echoOwnerRepository(owner: string | null, repository: string | null): void {
  echo.owner(String(owner))
  echo.repository(String(repository))
  console.log()
}

/**
 * Resolves a value from the flags, then the config. Meow omits string flags that were not
 * passed, so an absent key means "fall back to the config".
 * @param cli The parsed command line
 * @param flag Which value
 * @returns The value, the default host, or null
 */
export function assignFlag(cli: Cli, flag: 'host'): string
export function assignFlag(cli: Cli, flag: ConfigKey): string | null
export function assignFlag(cli: Cli, flag: ConfigKey): string | null {
  if (Object.hasOwn(cli.flags, flag)) return cli.flags[flag] ?? null
  if (store.has('config', flag)) return store.get('config', flag) as string
  return flag == 'host' ? github.defaultHost : null
}

/** Prints the path of 'labels.json' */
export function labelsPath(): void {
  echo.info("Path for 'labels.json'")
  echo.info(store.path('labels'))
  console.log()
}

/**
 * Masks the token for display, leaving only its last four characters. A fixed-width mask
 * leaked most of a long token and none of a short one.
 * @param values The stored config
 * @returns A copy, with the token masked
 */
export function censorConfig(values: Config): Config {
  if (!values.token) return { ...values }
  const visible = values.token.length > 8 ? values.token.slice(-4) : ''
  return { ...values, token: '*'.repeat(values.token.length - visible.length) + visible }
}

/**
 * Demands the values a repository operation needs, reporting whichever is missing.
 * @param token Personal access token
 * @param owner Repository owner
 * @param repository Repository name
 * @returns All three, since every missing one exits
 */
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

/**
 * Rejects flag combinations the CLI cannot honour.
 * @param cli The parsed command line
 */
export function checkFlags(cli: Cli): void {
  const flags = cli.flags

  /* Bulk update only exists for GitHub Enterprise. The resolved host is what matters, not
     the flag, because a host can equally come from the config */
  if (flags.bulkUpdate && assignFlag(cli, 'host') == github.defaultHost) {
    echo.error('Bulk update requires a GitHub Enterprise host.')
    echo.tip('Specify one with -H, or store one with -c.', true)
  }

  /* Check for usage of flags that shouldn't be used together. The remote flags act on a
     repository, which the local labels and config commands never do */
  const remote = flags.repository || flags.token || flags.owner || flags.host || flags.bulkUpdate || flags.uploadLabels || flags.deleteAllLabels
  if ((remote && (flags.newLabel || flags.config))
    || (flags.config && flags.newLabel)
    || (flags.emptyLabelsFile && (remote || flags.config || flags.resetLabelsFile))
    || (flags.bulkUpdate && flags.repository)) {
    echo.error('Wrong usage.')
    echo.tip('Use -h for help.', true)
  }
}

/**
 * Asks the user to confirm an action, unless -f was passed.
 * @param cli The parsed command line
 * @param ask Poses the question
 * @param abort Named in the abort message when the user declines
 * @param skippable Whether declining skips the action instead of ending the run
 * @returns Whether to go ahead
 */
async function confirmed(cli: Cli, ask: () => Promise<boolean>, abort: string, skippable = false): Promise<boolean> {
  if (cli.flags.force || await ask()) return true
  if (skippable) return false
  console.log()
  echo.abort(abort, true)
}

/**
 * Reports what was brought over from a previous installation. The import and the removal of the
 * old files both happen as the store module loads, so there is nothing to decide here.
 */
export function echoMigration(): void {
  const imported = store.importedFromLegacy()
  if (!imported.config && !imported.labels) return

  console.log()
  echo.info(`Imported ${imported.config} config value(s) and ${imported.labels} label(s) from your previous installation.`)
  if (imported.removed.length) echo.info(`Removed ${imported.removed.length} old file(s) from ${store.legacyDir()}`)
  else echo.tip(`The old files are in ${store.legacyDir()} and can be deleted.`)
}

/**
 * Replaces the stored labels with the shipped defaults.
 * @param cli The parsed command line
 */
export async function resetLabelsFile(cli: Cli): Promise<void> {
  await confirmed(cli, inquirer.confirmResetLabels, "Reset 'labels.json'.")

  // Reset labels
  echo.info("Resetting 'labels.json'...")
  store.resetLabels()
  echo.success('Done!\n')
}

/**
 * Removes every label from 'labels.json'.
 * @param cli The parsed command line
 */
export async function emptyLabelsFile(cli: Cli): Promise<void> {
  await confirmed(cli, inquirer.confirmEmptyLabels, "Delete labels from 'labels.json'.")

  // Empty labels.json
  echo.info("Emptying 'labels.json'...")
  store.set('labels', { 'labels': [] })
  echo.success('Done.\n', !cli.flags.newLabel) // -n carries on to add labels
}

/**
 * Uploads every stored label to a repository.
 * @param token Personal access token
 * @param owner Repository owner
 * @param host API host
 * @param repository Repository name
 * @param cli The parsed command line
 * @param exit Whether finishing ends the run
 */
export async function uploadLabels(token: string | null, owner: string | null, host: string, repository: string | null, cli: Cli, exit: boolean): Promise<void> {
  // Check required Flags
  const target = checkRequiredFlags(token, owner, repository)

  // Variables
  const labels = store.getAll('labels')

  // Ask if the user is sure. During a bulk update, declining only skips this repository
  if (!await confirmed(cli, () => inquirer.confirmUploadLabels(target.repository), `Upload labels to ${target.repository}.`, cli.flags.bulkUpdate)) return
  echo.info(bold(`Uploading labels to ${target.repository}...`))

  // Run promises (aka upload all labels)
  await Promise.all(labels.map(label => github.saveLabel(false, target.token, target.owner, host, target.repository, label)))

  // Done
  echo.success('Done!\n')
  if (exit) echo.success('Finished!', exit)
}

/**
 * Deletes every label in a repository.
 * @param token Personal access token
 * @param owner Repository owner
 * @param host API host
 * @param repository Repository name
 * @param cli The parsed command line
 * @param exit Whether finishing ends the run
 */
export async function deleteAllLabels(token: string | null, owner: string | null, host: string, repository: string | null, cli: Cli, exit: boolean): Promise<void> {
  // Check required Flags
  const target = checkRequiredFlags(token, owner, repository)

  // Ask if the user is sure. During a bulk update, declining only skips this repository
  if (!await confirmed(cli, () => inquirer.confirmDeleteAllLabels(target.repository), `Delete labels from ${target.repository}.`, cli.flags.bulkUpdate)) return
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

/**
 * Lists every repository in an organization.
 * @param token Personal access token
 * @param owner Organization name
 * @param host API host
 * @returns Their names
 */
export async function getRepositories(token: string | null, owner: string | null, host: string): Promise<string[]> {
  // Variables
  const repos: string[] = []
  const perPage = 100

  // Check required Flags (repository not needed here but need to send so check won't fail)
  const target = checkRequiredFlags(token, owner, 'sample')

  // Get the 'link' header from a request to list all repositories for the given org
  const link = await github.headRepoList(true, target.token, target.owner, host, 1)

  /* By passing in 1 as the per_page value, the "last" page link will have a page number equal to the number of repos
     To compute the actual number of necessary requests, divide the number of repos by the requested per_page limit (max 100)
     GitHub leaves the header out when everything fits on one page, which with one per page means 0 or 1 repos */
  const pageCount = link ? Math.ceil(getPageCountFromLinkHeader(link) / perPage) : 1

  // Push every repo into repos array
  for (let i = 1; i <= pageCount; i++) {
    const res = await github.getReposByPage(true, target.token, target.owner, host, i, perPage)
    repos.push(...(res ?? []).map(repo => repo.name))
  }

  echo.info(bold(`Found ${repos.length} ${repos.length == 1 ? 'repository' : 'repositories'} in organization ${target.owner}.`))
  return repos
}

/**
 * Counts an organization's repositories, from the "last" rel of a "link" header requested one
 * repository per page.
 * @param header The 'link' response header
 * @returns The number of repositories
 */
export function getPageCountFromLinkHeader(header: string): number {
  if (!header) echo.error('Header input must not be null or of zero length.', true)

  // Parse each comma-separated part into a named link
  for (const part of header.split(',')) {
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

/** Opens the interactive config CLI, which runs until the user chooses to exit */
export async function cliConfig(): Promise<void> {
  while (true) {
    // Display current config
    console.clear()
    echo.info('Current config:')
    console.log(censorConfig(store.getAll('config')))
    console.log()

    // Store the new value. An empty one removes the setting
    const answer = await inquirer.config()
    if (answer == 'exit') process.exit()
    if (!answer) continue
    if (answer.value) store.set('config', { [answer.key]: answer.value })
    else store.remove('config', answer.key)
  }
}

/**
 * Opens the interactive "create new label" CLI, which runs until the user presses Ctrl+C.
 * @param cli The parsed command line
 */
export async function cliNewLabel(cli: Cli): Promise<void> {
  echo.tip('If you want to edit the file, here\'s the path:')
  echo.info(store.path('labels'))
  console.log()

  // Ask if the user wants a fresh file or not
  if (!cli.flags.force && !cli.flags.emptyLabelsFile) {
    if (await inquirer.choiceFreshNewLabels()) store.set('labels', { 'labels': [] })
    console.log()
  }

  echo.info('Create new labels:')
  while (true) {
    const labels = store.getAll('labels')
    const label = await inquirer.newLabel()

    // Save unless the name is taken
    if (labels.some(existing => existing.name == label.name)) {
      echo.error(`Label '${label.name}' already exists! Please choose another name.\n`)
    } else {
      store.set('labels', { 'labels': [...labels, label] })
      echo.success('Saved label! Use Ctrl+C to exit.\n')
    }
  }
}
