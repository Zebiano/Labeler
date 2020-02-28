#!/usr/bin/env node
'use strict';

// Requires: Packages
const meow = require('meow');

// Requires: Files
const labels = require('./labels')

// TODO: If run without commands and no settings file is found, ask for default values of settings file

// Variables
const helpText = `
NAME
    labeler - Label manager for GitHub repositories.

SYNOPSIS
    labeler [OPTIONS]

DESCRIPTION
    Create custom labels on GitHub repositories automatically.

OPTIONS
    -r
        Removes all existing labels in repository.

    -h
        Display this help page.

    -n
        Launches interactive cli to store a new lable locally.

EXAMPLES
    Delete all labels and upload custom ones saved in labels.json:
        labeler -d
`

// Variables
const cli = meow(helpText, {
    // Possible flags
    flags: {
        delete: {
            alias: 'd',
            type: 'boolean',
            default: false
        },
    },
    // Default if no flags are set
    default: {

    }
});
console.log(cli.input[0], cli.flags);

// CLI arguments
/* const cli = require('meow')(`
  Usage: appname [options]

  Options:
        --lang LANG    set the language

  Other options:
    -h, --help         show usage information
    -v, --version      print version info and exit
`, {
    string: ['lang'],
    boolean: ['help', 'version'],
    alias: { h: 'help', v: 'version' }
}) */
// console.log(cli.input[0], cli.flags);

/* --- Functions --- */