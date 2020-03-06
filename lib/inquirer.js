// Requires: Packages
const inquirer = require('inquirer');
const clear = require('clear')

/* --- Questions --- */
// Personal Access Token
const questionToken = {
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
}

// Owner
const questionOwner = {
    type: 'input',
    name: 'owner',
    message: 'Enter GitHub owner:',
    validate: function (value) {
        if (value.length) {
            return true;
        } else {
            return "Please enter a valid Owner!";
        }
    }
}

// Repository
const questionRepository = {
    type: 'input',
    name: 'repository',
    message: 'Enter GitHub repository:',
    validate: function (value) {
        if (value.length) {
            return true;
        } else {
            return "Please enter a valid Repository!";
        }
    }
}

/* --- Functions --- */
// Ask for Personal GitHub Access Token
function askToken() {
    return inquirer.prompt(questionToken);
}

// Ask for Owner
function askOwner() {
    return inquirer.prompt(questionOwner);
}

// Ask for repository
function askRepository() {
    return inquirer.prompt(questionRepository);
}

// Ask for Token, Owner, Repository
function askConfig() {
    return inquirer.prompt([questionToken, questionOwner, questionRepository]);
}

// Exports
module.exports = {
    askToken: askToken,
    askOwner: askOwner,
    askRepository: askRepository,
    askConfig: askConfig
}