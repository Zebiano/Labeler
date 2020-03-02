// Requires: Packages
const inquirer = require('inquirer');

// Ask the user for a Token, Owner, Repository
function askConfig() {
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
    return inquirer.prompt(questions);
}

// Exports
module.exports = {
    askConfig: askConfig
}