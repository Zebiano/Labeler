// Requires: Packages
const axios = require('axios')

// Requires: Libs
const echo = require('./echo')

// Variables
const githubApiUrl = 'https://api.github.com'

/* --- Functions --- */
// Check Flags
function checkFlag() {

}

// Get all Labels
function getLabels(token, owner, repo) {
    if (!owner) echo.error('You need to specifiy an owner!', true)
    if (!repo) echo.error('You need to specifiy a repository!', true)

    return axios.get(githubApiUrl + '/repos/' + owner + '/' + repo + '/labels')
}

// Get one Label
function getLabel(token, owner, repo, label) {
    console.log(label)
}

// Save new Label
function saveLabel(token, owner, repo, label) {
    console.log(label)
}

// Delete Label
function deleteLabel(token, owner, repo, label) {
    console.log(token, owner, repo, label)

    if (!token) echo.error('You need to specifiy a token!', true)
    if (!owner) echo.error('You need to specifiy an owner!', true)
    if (!repo) echo.error('You need to specifiy a repository!', true)
    if (!label) echo.error('Apparently I have no idea how to code. Sorry.', true)
    // TODO: Are you sure you want to delete the labels from this repo bkabla?
}

// Exports
module.exports = {
    getLabels: getLabels,
    saveLabel: saveLabel,
    deleteLabel: deleteLabel
}