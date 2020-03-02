#!/usr/bin/env node
'use strict';

// Requires: Packages
const meow = require('meow');
const chalk = require('chalk');

// Requires: Files
const labels = require('./labels')

// TODO: If run without commands and no settings file is found, ask for default values of settings file

// Variables
const helpText = `
NAME
    labeler - Label manager for GitHub repositories.

SYNOPSIS
    labeler [OPTIONS] -r [REPOSITORY]

DESCRIPTION
    Create custom labels on GitHub repositories automatically.
    This CLI helps you organize your GitHub labels by storing them in a file called labels.json, as well as storing more info into another file called settings.json. You can add new labels through the CLI, with the -n flag. Whenever you create a new repository, run this script with the -du flag to delete the default labels and upload your custom ones!

OPTIONS
    -r, --repository (REQUIRED)
        Specify GitHub repository name.

    -o, --owner
        Specify owner of the repository. Ignores "owner" key in settings.json.

    -h, --help
        Display this help page.

    -d, --deleteAllLabels
        Delete all existing labels in repository.

    -n, --newLabel
        Launch interactive CLI to store new labels in the labels.json file.

    -s, --settings
        Launch interactive CLI to generate the settings.js file.

    -u, --upload
        Upload custom labels.

EXAMPLES
    Delete all labels from the repo, and upload custom ones stored under labels.json:
        labeler -dur repositoryName
`

// Variables
const cli = meow(helpText, {
    description: false,
    flags: {
        repository: {
            alias: 'r',
            type: 'string',
            default: "null"
        },
        owner: {
            alias: 'o',
            type: 'string',
            default: "null"
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
        settings: {
            alias: 's',
            type: 'boolean'
        },
        upload: {
            alias: 'u',
            type: 'boolean'
        },
    }
});
// console.log(cli.input[1], cli.flags);
console.log(cli)

/* --- Functions --- */