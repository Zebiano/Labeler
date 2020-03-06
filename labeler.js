#!/usr/bin/env node
'use strict'

// Requires: Packages
const meow = require('meow')

// Requires: Libs
const inquirer = require('./lib/inquirer')
const config = require('./lib/configstore')
const requests = require('./lib/requests')
const echo = require('./lib/echo')

// Requires: Files
const labels = require('./labels')

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

    -c, --config
        Launch interactive CLI to store data into config.

    -n, --newLabel
        Launch interactive CLI to store new labels in the labels.json file.

    -u, --upload
        Upload custom labels.

EXAMPLES
    Delete all labels from the repo, and upload custom ones stored under labels.json:
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
        uploadLabel: {
            alias: 'u',
            type: 'boolean'
        },
    }
})

/* --- Functions --- */
// Check for flags, and use config if needed
function checkFlag(key) {
    if (cli.flags.hasOwnProperty(key)) {
        return cli.flags[key]
    } else if (config.hasKey(key)) {
        return config.getKey(key)
    } else {
        return null
    }
}

// Main
async function main() {
    console.log(cli.flags)
    // console.log(config.getAll())

    // Delete all labels from a repo
    if (cli.flags.deleteAllLabels) {
        // Get all labels form repo
        const allLabels = await requests.getLabels(checkFlag('token'), checkFlag('owner'), checkFlag('repository'))

        // Push promises that delete labels to array 
        let arrayPromises = []
        for (let i in allLabels.data) {
            arrayPromises.push(requests.deleteLabel(
                checkFlag('token'),
                checkFlag('owner'),
                checkFlag('repository'),
                allLabels.data[i].name
            ))
        }

        // Run promises (aka delete all labels)
        Promise.all(arrayPromises).then(values => {
            console.log(values);
        });
    }

    // 
    if (cli.flags.config) {
        inquirer.askConfig()
    }
}

// Start main
main()