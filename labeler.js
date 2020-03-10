#!/usr/bin/env node
'use strict'

// Requires: Packages
const meow = require('meow')
const clear = require('clear')

// Requires: Libs
const inquirer = require('./lib/inquirer')
const config = require('./lib/configstore')
const requests = require('./lib/requests')
const echo = require('./lib/echo')

// Requires: Files
const labels = require('./labels')

// TODO: -n

// Variables
const helpText = `
NAME
    labeler - Label manager for GitHub repositories.

SYNOPSIS
    labeler [OPTIONS] -r [REPOSITORY]

DESCRIPTION
    Create custom labels on GitHub repositories automatically.
    This CLI helps you organize your GitHub labels by storing them in a file called labels.json. You can add new labels through the CLI, with the -n flag. Whenever you create a new repository, run this script with the -du flag to delete the default labels and upload your custom ones!

OPTIONS
    -c, --config
        Launch interactive CLI to store data into config. Storing empty strings removes data from config.

    -r, --repository
        Specify GitHub repository name. If not specified uses values in config, else ignores config.

    -o, --owner
        Specify owner of the repository. If not specified uses values in config, else ignores config.

    -t, --token
        Specify Personal Access Token. If not specified uses values in config, else ignores config.

    -h, --help
        Display this help page.

    -d, --deleteAllLabels
        Delete all existing labels in repository.

    -n, --newLabel
        Launch interactive CLI to store new labels in the labels.json file.

    -u, --upload
        Upload custom labels.

    -f, --force
        Does not ask for user confirmation.

EXAMPLES
    Delete all labels from the repository and upload custom ones stored under labels.json:
        labeler -dur repositoryName
`;

// Meow CLI
const cli = meow(helpText, {
    description: false,
    flags: {
        config: {
            alias: 'c',
            type: 'boolean'
        },
        repository: {
            alias: 'r',
            type: 'string'
        },
        owner: {
            alias: 'o',
            type: 'string'
        },
        token: {
            alias: 't',
            type: 'string'
        },
        help: {
            alias: 'h',
            type: 'boolean'
        },
        deleteAllLabels: {
            alias: 'd',
            type: 'boolean'
        },
        newLabel: {
            alias: 'n',
            type: 'boolean'
        },
        uploadLabels: {
            alias: 'u',
            type: 'boolean'
        },
        force: {
            alias: 'f',
            type: 'boolean'
        }
    }
})

/* --- Functions --- */
// Returns flag from arguments, or from config
function assignFlag(flag) {
    if (cli.flags.hasOwnProperty(flag)) {
        return cli.flags[flag]
    } else if (config.has(flag)) {
        return config.get(flag)
    } else {
        return null
    }
}

// Check flags


// Deletes all labels from a repo
async function deleteAllLabels(exit) {
    // Check flags
    if (!token && !owner && !repo) {
        echo.error('Missing arguments.')
        echo.info('Use -h for help.', true)
    } else if (!token) {
        echo.error('You need to specify a token!')
        echo.tip('Use the -t flag.', true)
    } else if (!owner) {
        echo.error('You need to specify an owner!')
        echo.tip('Use the -o flag.', true)
    } else if (!repo) {
        echo.error('You need to specify a repository!')
        echo.tip('Use the -r flag.', true)
    }

    // Ask if the user is sure
    if (!cli.flags.force) {
        const answer = await inquirer.confirmDeleteAllLabels()
        if (!answer.deleteAllLabels) echo.warning('Aborted deletion of all labels from ' + repo + '.', true)
    }
    echo.info('Deleting labels...')

    // Variables
    let arrayPromises = []

    // Get all labels form repo
    const allLabels = await requests.getLabels(token, owner, repo)

    // Push promises (that delete labels) to an array
    for (let i in allLabels.data) {
        arrayPromises.push(requests.deleteLabel(
            token,
            allLabels.data[i]
        ))
    }

    // Run promises (aka delete all labels)
    await Promise.all(arrayPromises)

    // Done
    if (cli.flags.uploadLabels) echo.success('Done!')
    else echo.success('Finished!', true)
}

// Upload all labels from labels.json
async function uploadLabels(exit) {
    // Check flags
    if (!token && !owner && !repo) {
        echo.error('Missing arguments.')
        echo.info('Use -h for help.', true)
    } else if (!token) {
        echo.error('You need to specify a token!')
        echo.tip('Use the -t flag.', true)
    } else if (!owner) {
        echo.error('You need to specify an owner!')
        echo.tip('Use the -o flag.', true)
    } else if (!repo) {
        echo.error('You need to specify a repository!')
        echo.tip('Use the -r flag.', true)
    }

    // Ask if the user is sure
    if (!cli.flags.force) {
        const answer = await inquirer.confirmUploadLabels()
        if (!answer.uploadLabels) echo.warning('Aborted upload of all labels to ' + repo + '.', true)
    }
    echo.info('Uploading labels...')

    // Variables
    let arrayPromises = []

    // Push promises (that upload labels) to an array
    for (let i in labels) {
        arrayPromises.push(requests.saveLabel(
            token,
            owner,
            repo,
            labels[i]
        ))
    }

    // Run promises (aka upload all labels)
    await Promise.all(arrayPromises)

    // Done
    echo.success('Finished!', true)
}

// Opens the interactive config CLI
async function configCli() {
    clear() // Clear

    // Display current config
    echo.info("Current config:")
    console.log(config.getAll()) // TODO: Censor the token out (show last 4 characters maybe), and make input type: password in inquirer
    console.log()

    // Get config input from user
    let answer = await inquirer.config()

    // Check input
    if (answer.hasOwnProperty('token')) {
        // Token
        if (answer.token) config.set(answer)
        else config.remove('token')
    } else if (answer.hasOwnProperty('owner')) {
        // Owner
        if (answer.owner) config.set(answer)
        else config.remove('owner')
    } else if (answer.hasOwnProperty('repository')) {
        // Repository
        if (answer.repository) config.set(answer)
        else config.remove('repository')
    } else {
        // Exit
        clear()
        echo.success('Finished!', true)
    }

    // Call this function again until user exits
    await configCli()
}

/* --- Start --- */
// Variables
const token = assignFlag('token')
const owner = assignFlag('owner')
const repo = assignFlag('repository')

// Main function
async function main() {
    // console.log(cli.flags)
    // console.log(config.getAll())

    // Delete all labels from a repo
    if (cli.flags.deleteAllLabels) await deleteAllLabels(true)

    // Upload custom labels
    if (cli.flags.uploadLabels) await uploadLabels()

    // Run the config interactive CLI
    if (cli.flags.config) await configCli()

    // If nothing happens, I'm assuming the user ran without flags
    echo.error('Missing arguments.')
    echo.info('Use -h for help.', true)
}

// Call main()
main()