// Requires: Packages
const axios = require('axios')

// Requires: Libs
const echo = require('./echo')

// Variables
const githubApiUrl = 'https://api.github.com'

/* --- Functions --- */
// Get all Labels
function getLabels(token, owner, repo) {
    const url = githubApiUrl + '/repos/' + owner + '/' + repo + '/labels'
    return axios.get(url)
        // Catch error
        .catch(function (err) {
            // If response.status is 404
            if (err.response.status == 404) {
                echo.error('404: Not found.')
                echo.error('URL seems to be faulty: ' + url)
                echo.error('Please check your arguments and try again.', true)
            } else echo.error('An unexpected error occurred. Please try again.', true)
        })
}

// Save new Label
function saveLabel(token, owner, repo, label) {
    const url = githubApiUrl + '/repos/' + owner + '/' + repo + '/labels'
    return axios.post(url, {
        name: label.name,
        description: label.description,
        color: label.color
    }, {
        headers: { Authorization: 'Bearer ' + token }
    })
        .then(function () {
            echo.info('Uploaded ' + label.name + '.')
        })
        // Catch error
        .catch(function (err) {
            // If response.status is 404
            if (err.response.status == 404) {
                echo.error('404: Not found.')
                echo.error('URL seems to be faulty: ' + url)
                echo.error('Please check your arguments and try again.', true)
            } else echo.error('An unexpected error occurred. Please try again. ' + err, true)
        })
}

// Delete Label
function deleteLabel(token, label) {
    if (!label) echo.error('Apparently I have no idea how to code. Sorry.', true)

    return axios.delete(label.url, { headers: { Authorization: 'Bearer ' + token } })
        .then(function () {
            echo.info('Deleted ' + label.name + '.')
        })
        // Catch error
        .catch(function (err) {
            // If response.status is 404
            if (err.response.status == 404) {
                echo.error('404: Not found.')
                echo.error('URL seems to be faulty: ' + url)
                echo.error('Please check your arguments and try again.', true)
            } else echo.error('An unexpected error occurred. Please try again.', true)
        })
}

// Exports
module.exports = {
    getLabels: getLabels,
    saveLabel: saveLabel,
    deleteLabel: deleteLabel
}