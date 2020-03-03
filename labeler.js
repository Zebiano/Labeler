#!/usr/bin/env node
'use strict'

// Requires: Packages
const chalk = require('chalk')
const meow = require('meow')

// Requires: Libs
const inquirer = require('./lib/inquirer')
const config = require('./lib/configstore')
const axios = require('./lib/axios')

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

/* --- Main --- */
async function main() {
    console.log(cli.flags)
    /* for (var key in cli.flags) {
        if (cli.flags.hasOwnProperty(key)) {
            console.log(key + " -> " + cli.flags[key])
            switch (key) {
                case 'token':

                    break
                default:
                    break
            }
        }
    } */
}

// Start main
main()