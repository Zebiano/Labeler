// Requires: Packages
const inquirer = require('inquirer');
const clear = require('clear')

/* --- Questions --- */
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
    message: 'Enter Label description: (Optional)'
}

// Color
const inputLabelColor = {
    type: 'input',
    name: 'color',
    message: 'Enter Label Color (Hex value without #):',
    validate: function (value) {
        if (value.length && /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
            return true;
        } else {
            return 'Please enter a valid Hex color.';
        }
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
    message: 'Are you sure you want to delete ALL labels? There is no going back.',
    default: false
}

// Confirm upload of labels
const confirmLabelUpload = {
    type: 'confirm',
    name: 'uploadLabels',
    message: 'Are you sure you want to upload all labels from labels.json?',
    default: false
}

/* --- Functions --- */
// Ask for Personal GitHub Access Token
function askToken() {
    return inquirer.prompt(inputToken);
}

// Ask for Owner
function askOwner() {
    return inquirer.prompt(inputToken);
}

// Ask for repository
function askRepository() {
    return inquirer.prompt(inputRepository);
}

// Confirm deletion of all labels
function confirmDeleteAllLabels() {
    return inquirer.prompt(confirmDeletionAllLabels)
}

// Confirm upload of all labels
function confirmUploadLabels() {
    return inquirer.prompt(confirmLabelUpload)
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
    askToken: askToken,
    askOwner: askOwner,
    askRepository: askRepository,
    config: config,
    confirmDeleteAllLabels: confirmDeleteAllLabels,
    confirmUploadLabels: confirmUploadLabels,
    newLabel: newLabel
}