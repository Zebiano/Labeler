// Import: Packages
import Clear from 'clear'
import Chalk from 'chalk'
import { readFile } from 'fs/promises'
import Path from 'path'
import { fileURLToPath } from 'url'

// Import: Libs
import * as inquirer from './inquirer.js'
import * as config from './configstore.js'
import * as axios from './axios.js'
import * as echo from './echo.js'

// Import: Files
const pkg = JSON.parse(await readFile(`${Path.dirname(fileURLToPath(import.meta.url))}/../package.json`));

// Echo the owner and repository
export function echoOwnerRepository(owner, repository) {
    echo.owner(owner)
    echo.repository(repository)
    console.log()
}

// Returns flag from arguments, or from config
export function assignFlag(cli, flag) {
    if (cli.flags.hasOwnProperty(flag)) return cli.flags[flag]
    else if (config.has('config', flag)) return config.get('config', flag)
    else {
        if (flag == 'host') return pkg.labeler.defaultHost
        else return null
    }
}

// Echos the path for labels.json
export function labelsPath() {
    echo.info("Path for 'labels.json'")
    echo.info(config.path('labels'))
    console.log()
}

// Censor config
export function censorConfig(config) {
    if (config.token) config.token = config.token.replace(/^.{36}/g, '*'.repeat(36))
    return config
}

// Check required flags
export function checkRequiredFlags(token, owner, repository) {
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
}

// Check flags
export function checkFlags(cli) {
    // console.log(cli.flags)
    // All flags to copy easily (without cli.flags.force and cli.flags.help)
    // cli.flags.repository cli.flags.token cli.flags.owner cli.flags.host cli.flags.uploadLabels cli.flags.deleteAllLabels cli.flags.newLabel cli.flags.config cli.flags.emptyLabelsFile cli.flags.resetLabelsFile

    // Check for usage of flags that shouldn't be used together
    // If (((Flags) && (Flags)) || (cli.flags.config && cli.flags.newLabel) || (cli.flags.emptyLabelsFile && (Flags)))
    if (((cli.flags.repository || cli.flags.token || cli.flags.owner || cli.flags.host || cli.flags.bulkUpdate || cli.flags.uploadLabels || cli.flags.deleteAllLabels) && (cli.flags.newLabel || cli.flags.config))
        || (cli.flags.bulkUpdate && cli.flags.host == pkg.labeler.defaultHost)
        || (cli.flags.config && cli.flags.newLabel)
        || (cli.flags.emptyLabelsFile && (cli.flags.repository || cli.flags.token || cli.flags.owner || cli.flags.host || cli.flags.bulkUpdate || cli.flags.uploadLabels || cli.flags.deleteAllLabels || cli.flags.config || cli.flags.resetLabelsFile))
        || (cli.flags.bulkUpdate && cli.flags.repository)) {
        echo.error('Wrong usage.')
        echo.tip('Use -h for help.', true)
    }
}

// Deletes labels.json and creates it again with default values
export async function resetLabelsFile(cli) {
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
export async function emptyLabelsFile(cli) {
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
export async function uploadLabels(token, owner, host, repository, cli, exit) {
    // Check required Flags
    checkRequiredFlags(token, owner, repository)

    // Variables
    const labels = config.getAll('labels')

    // Ask if the user is sure
    if (!cli.flags.force) {
        const answer = await inquirer.confirmUploadLabels(repository)
        if (!answer.uploadLabels) {
            if (cli.flags.bulkUpdate) return

            console.log()
            echo.abort(`Upload labels to ${repository}.`, true)
        }
    }
    echo.info(Chalk.bold(`Uploading labels to ${repository}...`))

    // Variables
    let arrayPromises = []

    // Push promises (that upload labels) to an array
    for (let i in labels) arrayPromises.push(axios.saveLabel(false, token, owner, host, repository, labels[i]))

    // Run promises (aka upload all labels)
    await Promise.all(arrayPromises)

    // Done
    echo.success('Done!\n')
    if (exit) echo.success('Finished!', exit)
}

// Deletes all labels from a repository
export async function deleteAllLabels(token, owner, host, repository, cli, exit) {
    // Check required Flags
    checkRequiredFlags(token, owner, repository)

    // Ask if the user is sure
    if (!cli.flags.force) {
        const answer = await inquirer.confirmDeleteAllLabels(repository)
        if (!answer.deleteAllLabels) {
            if (cli.flags.bulkUpdate) return

            console.log()
            echo.abort(`Delete labels from ${repository}.`, true)
        }
    }
    echo.info(Chalk.bold(`Deleting labels from ${repository}...`))

    // Variables
    let arrayPromises = []

    // Get all labels form repository
    const allLabels = await axios.getLabels(true, token, owner, host, repository)

    // Push promises (that delete labels) to an array
    for (let i in allLabels.data) arrayPromises.push(axios.deleteLabel(false, token, allLabels.data[i]))

    // Run promises (aka delete all labels)
    await Promise.all(arrayPromises)

    // Done
    if (cli.flags.uploadLabels) echo.success('Done!\n')
    else if (exit) {
        console.log()
        echo.success('Finished!', exit)
    }
}

// Gets array of repository names in "owner" organization
export async function getRepositories(token, owner, host) {
    // Variables
    let repos = []
    let pageCount = 0
    const perPage = 100

    // Check required Flags (repository not needed here but need to send so check won't fail)
    checkRequiredFlags(token, owner, "sample")

    // Get headers for a request to list all repositories for the given org
    const response = await axios.headRepoList(true, token, owner, host, 1)
    if (response.status != 200 || !response.headers.link) echo.error('Unexpected status or response on HEAD request for GHE repository list.', true)

    // By passing in 1 as the per_page value, the "last" page link will have a page number equal to the number of repos
    // To compute the actual number of necessary requests, divide the number of repos by the requested per_page limit (max 100)
    const numberOfRepos = getPageCountFromLinkHeader(response.headers.link)
    pageCount = Math.ceil(numberOfRepos / perPage)

    echo.info(Chalk.bold(`Fetching list of ${numberOfRepos} repository name(s) across ${pageCount} page(s), in organization ${owner}...`))

    // Push every repo into repos array
    for (let i = 1; i <= pageCount; i++) {
        const res = await axios.getReposByPage(true, token, owner, host, i, perPage)
        res.data.forEach(function (repo) {
            // Get the url for each repo object and extract just the name at the end of the url
            repos.push(repo.html_url.substring(repo.html_url.lastIndexOf('/') + 1))
        })
    }
    return repos
}

// Gets the total number of pages in the list of repositories by parsing the "last" rel of the "link" response header
// GitHubApi has a per_page limit of 100, default 30
// To instead return a 'links' object with props 'name: url' in order to traverse the API pages using the relational links instead of the page count
// Uncomment the code below, comment the last if statement and last error log
export function getPageCountFromLinkHeader(header) {
    if (!header || header.length === 0) echo.error('Header input must not be null or of zero length.', true)

    // Split parts by comma
    let parts = header.split(',')
    // let links = {}

    // Parse each part into a named link
    for (i of parts) {
        let section = i.split(';')
        if (section.length !== 2) echo.error('Section could not be properly split on ";".', true)

        const url = section[0].replace(/<(.*)>/, '$1').trim()
        const name = section[1].replace(/rel="(.*)"/, '$1').trim()
        if (name === 'last') return url.match(/.*&page=(\d+).*/)[1]

        // links[name] = url
    }

    // Log error and exit if the last page link cannot be found
    echo.error('Repository page count could not be found for given GHE org.', true)

    // return links
}

// Opens the interactive config CLI
export async function cliConfig() {
    // Clear
    Clear()

    // Display current config
    echo.info("Current config:")
    console.log(censorConfig(config.getAll('config')))
    console.log()

    // Get config input from user
    let answer = await inquirer.config()

    // Check input
    if (answer) {
        if (answer.hasOwnProperty('token')) {
            // Token
            if (answer.token) config.set('config', answer)
            else config.remove('config', 'token')
        } else if (answer.hasOwnProperty('owner')) {
            // Owner
            if (answer.owner) config.set('config', answer)
            else config.remove('config', 'owner')
        } else if (answer.hasOwnProperty('repository')) {
            // Repository
            if (answer.repository) config.set('config', answer)
            else config.remove('config', 'repository')
        } else if (answer.hasOwnProperty('host')) {
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
export async function cliNewLabel(cli) {
    // Variables
    let labels = config.getAll('labels')
    let dupe = false

    // Get config input from user
    let answer = await inquirer.newLabel()

    // Check for dupe
    for (let i in labels) {
        if (labels[i].name == answer.name) {
            dupe = true
            break
        }
    }

    // Save if not dupe
    if (!dupe) {
        labels.push(answer)
        config.set('labels', { 'labels': labels })
        echo.success('Saved label! Use Ctrl+C to exit.\n')
    } else echo.error(`Label '${answer.name}' already exists! Please choose another name.\n`)

    // Call this function again until user exits
    await cliNewLabel(cli)
}
