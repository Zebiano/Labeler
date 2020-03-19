#!/usr/bin/env node
'use strict'

// Requires: Packages
const meow = require('meow')
const clear = require('clear')
const chalk = require('chalk')
const updateNotifier = require('update-notifier')

// Requires: Libs
const inquirer = require('./lib/inquirer')
const config = require('./lib/configstore')
const axios = require('./lib/axios')
const echo = require('./lib/echo')

// Require: Files
const pkg = require('./package.json')

// Variables
let labels = config.getAll('labels')
const helpText = `
NAME
    labeler - Label manager for GitHub repositories.

SYNOPSIS
    labeler [OPTIONS]

DESCRIPTION
    Create custom labels on GitHub repositories automatically.
    This CLI helps you organize your GitHub labels by storing them in a labels.json file. You can add new labels through the CLI with the -n flag.
    Whenever you create a new repository, instead of manually uploading your labels, use this CLI to have it done automatically!

OPTIONS
    -c, --config
        Launch interactive CLI to store data into config. Storing empty strings removes data from config.

    -n, --new-label
        Launch interactive CLI to store new labels in the labels.json file.

    -r, --repository [REPOSITORY]
        Specify GitHub repository name. If not specified uses values in config, else ignores config.

    -o, --owner [OWNER]
        Specify owner of the repository. If not specified uses values in config, else ignores config.

    -t, --token [TOKEN]
        Specify Personal Access Token. If not specified uses values in config, else ignores config.

    -h, --help
        Display this help page.
        
    -f, --force
        Ignore user confirmation.

    -d, --delete-all-labels
        Delete all existing labels in repository.

    -u, --upload-labels
        Upload custom labels to repository.

    -e, --empty-labels-file
        Remove every label from the labels.json file.

    -R, --reset-labels-file
        Reset labels.json by overwriting labels.json with the default labels.

    -p, --path
        Return the path for labels.json file.

EXAMPLES
    Delete all labels from the repository and upload custom ones stored under labels.json to the repository:
        labeler -dur [REPOSITORY]

    Same as above but without the confirmation questions:
        labeler -fdur [REPOSITORY]

    Delete every label from labels.json and add new labels to it:
        labeler -en
`;

// Meow CLI
const cli = meow(helpText, {
    description: false,
    flags: {
        'config': {
            alias: 'c',
            type: 'boolean'
        },
        'repository': {
            alias: 'r',
            type: 'string'
        },
        'owner': {
            alias: 'o',
            type: 'string'
        },
        'token': {
            alias: 't',
            type: 'string'
        },
        'help': {
            alias: 'h',
            type: 'boolean'
        },
        'delete-all-labels': {
            alias: 'd',
            type: 'boolean'
        },
        'new-label': {
            alias: 'n',
            type: 'boolean'
        },
        'upload-labels': {
            alias: 'u',
            type: 'boolean'
        },
        'force': {
            alias: 'f',
            type: 'boolean'
        },
        'empty-labels-file': {
            alias: 'e',
            type: 'boolean'
        },
        'reset-labels-file': {
            alias: 'R',
            type: 'boolean'
        },
        'path': {
            alias: 'p',
            type: 'boolean'
        }
    }
})

/* --- Start --- */
console.log()

// Update Notifier
updateNotifier({ pkg }).notify({ isGlobal: true })

// Variables
const token = assignFlag('token')
const owner = assignFlag('owner')
const repository = assignFlag('repository')

// Main function
async function main() {
    // console.log(cli.flags)

    // Warn user if -f
    if (cli.flags.force) echo.warning('Detected -f, ignoring user confirmation.\n')

    // Check if flags were called correctly
    checkFlags()
    if (cli.flags.path) labelsPath() // Return labels.json path
    if (cli.flags.resetLabelsFile) await resetLabelsFile() // Reset labels.json file
    if (cli.flags.emptyLabelsFile) await emptyLabelsFile() // Delete all labels from labels.json
    if (cli.flags.deleteAllLabels) await deleteAllLabels() // Delete all labels from repository
    if (cli.flags.uploadLabels) await uploadLabels() // Upload custom labels to repository
    if (cli.flags.config) await cliConfig() // Run the interactive config CLI
    // Run the interactive "create new label" CLI
    if (cli.flags.newLabel) {
        echo.tip('If you want to edit the file, here\'s the path:')
        echo.info(config.path('labels'))
        console.log()

        // Ask if the user wants a fresh file or not
        if (!cli.flags.force && !cli.flags.emptyLabelsFile) {
            const answerFresh = await inquirer.choiceFreshNewLabels()
            if (answerFresh) config.set('labels', { 'labels': [] })
            console.log()
        }

        echo.info('Create new labels:')
        await cliNewLabel()
    }
    if (cli.input[0] == "secret") echo.rainbow()

    // If any of these flags is true, exit (these are the ones that can always be called, no matter what)
    if (cli.flags.resetLabelsFile || cli.flags.path) process.exit()

    // If nothing happens, I'm assuming the user ran without flags
    echo.error('Missing arguments.')
    echo.tip('Use -h for help.', true)
}

// Call main()
main()

/* --- Functions --- */
// Echo the owner and repository
function echoOwnerRepository() {
    echo.owner(owner)
    echo.repository(repository)
    console.log()
}

// Returns flag from arguments, or from config
function assignFlag(flag) {
    if (cli.flags.hasOwnProperty(flag)) {
        return cli.flags[flag]
    } else if (config.has('config', flag)) {
        return config.get('config', flag)
    } else {
        return null
    }
}

// Check required flags
function checkRequiredFlags() {
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
function checkFlags() {
    // All flags to copy easily (without cli.flags.force and cli.flags.help)
    // cli.flags.repository cli.flags.token cli.flags.owner cli.flags.uploadLabels cli.flags.deleteAllLabels cli.flags.newLabel cli.flags.config cli.flags.emptyLabelsFile cli.flags.resetLabelsFile

    // Check for usage of flags that shouldn't be used together
    if (((cli.flags.repository || cli.flags.token || cli.flags.owner || cli.flags.uploadLabels || cli.flags.deleteAllLabels) && (cli.flags.newLabel || cli.flags.config))
        || (cli.flags.config && cli.flags.newLabel)
        || (cli.flags.emptyLabelsFile && (cli.flags.repository || cli.flags.token || cli.flags.owner || cli.flags.uploadLabels || cli.flags.deleteAllLabels || cli.flags.config || cli.flags.resetLabelsFile))) {
        echo.error('Wrong usage.')
        echo.tip('Use -h for help.', true)
    }
}

// Echos the path for labels.json
function labelsPath() {
    echo.info('Path for labels.json')
    echo.info(config.path('labels'))
    console.log()
}

// Deletes labels.json and creates it again with default values from /lib/fs.js
async function resetLabelsFile() {
    // Ask if the user is sure
    if (!cli.flags.force) {
        const answer = await inquirer.confirmResetLabels()
        if (!answer.resetLabels) {
            console.log()
            echo.abort('Reset labels.json.', true)
        }
    }

    echo.info('Resetting labels.json...')
    config.resetLabels()
    echo.success('Done!\n')
}

// Empties all labels from labels.json
async function emptyLabelsFile() {
    // Ask if the user is sure
    if (!cli.flags.force) {
        const answer = await inquirer.confirmEmptyLabels()
        if (!answer.emptyLabels) {
            console.log()
            echo.abort('Delete labels from labels.json.', true)
        }
    }

    // Empty labels.json
    echo.info('Emptying labels.json...')
    config.set('labels', { 'labels': [] })
    if (cli.flags.newLabel) echo.success('Done.\n')
    else {
        echo.success('Done.\n', true)
    }
}

// Deletes all labels from a repository
async function deleteAllLabels() {
    checkRequiredFlags() // Check required Flags
    echoOwnerRepository() // Echo repo and owner

    // Ask if the user is sure
    if (!cli.flags.force) {
        const answer = await inquirer.confirmDeleteAllLabels()
        if (!answer.deleteAllLabels) {
            console.log()
            echo.abort('Delete labels from ' + repository + '.', true)
        }
    }
    echo.info(chalk.bold('Deleting labels from ' + repository + '...'))

    // Variables
    let arrayPromises = []

    // Get all labels form repository
    const allLabels = await axios.getLabels(true, owner, repository)

    // Push promises (that delete labels) to an array
    for (let i in allLabels.data) {
        arrayPromises.push(axios.deleteLabel(
            false,
            token,
            allLabels.data[i]
        ))
    }

    // Run promises (aka delete all labels)
    await Promise.all(arrayPromises)

    // Done
    if (cli.flags.uploadLabels) echo.success('Done!\n')
    else {
        console.log()
        echo.success('Finished!', true)
    }
}

// Upload all labels from labels.json
async function uploadLabels() {
    // Check required Flags
    checkRequiredFlags()

    // Variables
    labels = config.getAll('labels')

    // Ask if the user is sure
    if (!cli.flags.force) {
        const answer = await inquirer.confirmUploadLabels()
        if (!answer.uploadLabels) {
            console.log()
            echo.abort('Upload labels to ' + repository + '.', true)
        }
    }
    echo.info(chalk.bold('Uploading labels to ' + repository + '...'))

    // Variables
    let arrayPromises = []

    // Push promises (that upload labels) to an array
    for (let i in labels) {
        arrayPromises.push(axios.saveLabel(
            false,
            token,
            owner,
            repository,
            labels[i]
        ))
    }

    // Run promises (aka upload all labels)
    await Promise.all(arrayPromises)

    // Done
    echo.success('Done!\n')
    echo.success('Finished!', true)
}

// Opens the interactive config CLI
async function cliConfig() {
    clear() // Clear

    // Display current config
    echo.info("Current config:")
    console.log(config.getAll('config'))
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
        } else {
            // Exit
            process.exit()
        }
    }

    // Call this function again until user exits
    await cliConfig()
}

// Opens the interactive "create new label" CLI
async function cliNewLabel() {
    // Variables
    labels = config.getAll('labels')
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
    if (!dupe) {
        labels.push(answer)
        config.set('labels', { 'labels': labels })
        echo.success('Saved label! Use Ctrl+C to exit.\n')
    } else echo.error('Label "' + answer.name + '" already exists! Please choose another name.\n')

    // Call this function again until user exits
    await cliNewLabel()
}