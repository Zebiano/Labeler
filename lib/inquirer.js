// Requires: Packages
const inquirer = require('inquirer');
const clear = require('clear')
const chalkPipe = require('chalk-pipe')

/* --- Prompts --- */
// Personal Access Token
const inputToken = {
    type: 'input',
    name: 'token',
    message: 'Enter Personal GitHub Access Token:'
}

// Owner
const inputOwner = {
    type: 'input',
    name: 'owner',
    message: 'Enter GitHub owner:'
}

// Repository
const inputRepository = {
    type: 'input',
    name: 'repository',
    message: 'Enter GitHub repository:'
}

// Label name
const inputLabelName = {
    type: 'input',
    name: 'name',
    message: 'Enter Label name:',
    validate: function (value) {
        if (value.length) {
            return true;
        } else {
            return 'Please enter a valid Label name.';
        }
    }
}

// Label description
const inputLabelDescription = {
    type: 'input',
    name: 'description',
    message: 'Enter Label description:'
}

// Color
const inputLabelColor = {
    type: 'input',
    name: 'color',
    message: 'Enter Label Color:',
    validate: function (value) {
        if (value.length && /^([A-Fa-f0-9]{6})$/.test(value)) {
            return true;
        } else {
            return 'Please enter a valid Hex color.';
        }
    },
    transformer: function (color) {
        return chalkPipe('#' + color)(color)
    }
}

// List for config
const listConfig = {
    type: 'list',
    name: 'choice',
    message: 'Which of the following do you want to update?',
    choices: [
        {
            name: 'Personal Access Token',
            value: 'token'
        },
        {
            name: 'Owner',
            value: 'owner'
        },
        {
            name: 'Repository',
            value: 'repository'
        },
        new inquirer.Separator(),
        {
            name: 'Exit Config',
            value: 'exit'
        },
    ]
}

// Confirm Repository
const confirmRepo = {
    type: 'confirm',
    name: 'updateRepo',
    message: 'It is NOT recommended to store repositories in the config as it is prone to mistakenly editing the wrong repository. Do you want to proceed?',
    default: false
}

// Confirm deletion of labels
const confirmDeletionAllLabels = {
    type: 'confirm',
    name: 'deleteAllLabels',
    message: 'Are you sure you want to delete ALL labels from the repository?',
    default: false
}

// Confirm upload of labels
const confirmLabelUpload = {
    type: 'confirm',
    name: 'uploadLabels',
    message: 'Are you sure you want to upload all labels from labels.json to the repository?',
    default: false
}

// Confirm emptying labels.json
const confirmLabelsEmpty = {
    type: 'confirm',
    name: 'emptyLabels',
    message: 'Are you sure you want to delete all labels from labels.json?',
    default: false
}

// Confirm resetting labels.json
const confirmLabelsReset = {
    type: 'confirm',
    name: 'resetLabels',
    message: 'Are you sure you want to reset labels.json to the default labels?',
    default: false
}

/* --- Functions --- */
// Confirm deletion of all labels
function confirmDeleteAllLabels() {
    return inquirer.prompt(confirmDeletionAllLabels)
}

// Confirm upload of all labels
function confirmUploadLabels() {
    return inquirer.prompt(confirmLabelUpload)
}

// Confirm deletion of all labels in labels.json
function confirmEmptyLabels() {
    return inquirer.prompt(confirmLabelsEmpty)
}

// Confirm reset of labels.json
function confirmResetLabels() {
    return inquirer.prompt(confirmLabelsReset)
}

// Ask for Token, Owner, Repository
async function config() {
    const answerConfig = await inquirer.prompt(listConfig);

    if (answerConfig.choice == 'token') return await inquirer.prompt(inputToken)
    else if (answerConfig.choice == 'owner') return await inquirer.prompt(inputOwner)
    else if (answerConfig.choice == 'repository') {
        clear()
        const answerConfirm = await inquirer.prompt(confirmRepo)
        if (answerConfirm.updateRepo) return await inquirer.prompt(inputRepository)
    } else if (answerConfig.choice == 'exit') {
        return true
    }
}

// Ask for new Label data
async function newLabel() {
    return await inquirer.prompt([inputLabelName, inputLabelDescription, inputLabelColor]);
}


// Exports
module.exports = {
    config: config,
    confirmDeleteAllLabels: confirmDeleteAllLabels,
    confirmUploadLabels: confirmUploadLabels,
    newLabel: newLabel,
    confirmEmptyLabels: confirmEmptyLabels,
    confirmResetLabels: confirmResetLabels
}