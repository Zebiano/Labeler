#!/usr/bin/env node
'use strict';

// Requires: Packages
const chalk = require('chalk');
const inquirer = require('inquirer');
const Configstore = require('configstore');
const clear = require('clear');

// Requires: Files
const meow = require('./lib/meow');
const packageJson = require('./package.json');
const labels = require('./labels');

// Variables
const config = new Configstore(packageJson.name);

// Meow - CLI helper
const cli = meow.meow;

/* --- Functions --- */
// Launches interactive CLI to save config
function saveConfig() {
    // Variables
    let defaultSettings = `{
    "token": "",
    "owner": "",
    "repo": ""
}
`;
    const questions = [
        {
            type: 'imput',
            name: 'token',
            message: 'Enter Personal GitHub Access Token:',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return "Please enter a valid Token!";
                }
            }
        },
        {
            type: 'input',
            name: 'owner',
            message: 'Enter GitHub owner: (Username, Organization Name)'
        },
        {
            type: 'input',
            name: 'repository',
            message: 'Enter GitHub repository:'
        }
    ];

    // Get user input
    inquirer.prompt(questions).then(answers => {
        console.log(answers);
        config.set(answers);
        console.log(config.size)
    });
}


function checkFlags() {
    if (cli.flags.repository == "undefined") {

    }
}