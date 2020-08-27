// Requires: Packages
const axios = require('axios')
const chalk = require('chalk')

// Requires: Libs
const echo = require('./echo')

// Variables
const githubApiUrl = 'https://api.github.com'

/* --- Functions --- */
// Get all Labels
function getLabels(exit, token, owner, repository) {
    const url = githubApiUrl + '/repos/' + owner + '/' + repository + '/labels'
    return axios.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    })
        // Catch error
        .catch(function (err) {
            // If response.status is 404
            if (err.response.status == 404) {
                echo.error('404: Not found.')
                echo.error('URL seems to be faulty: ' + url)
                echo.error('Please check your arguments and try again.', true)
            } else {
                echo.error('An unexpected error occurred.')
                echo.error(err, exit)
            }
        })
}

// Save new Label
function saveLabel(exit, token, owner, repository, label) {
    const url = githubApiUrl + '/repos/' + owner + '/' + repository + '/labels'
    return axios.post(url, {
        name: label.name,
        description: label.description,
        color: label.color
    }, {
        headers: {
            Authorization: 'Bearer ' + token
        }
    })
        .then(function () {
            // echo.info(chalk.italic('Uploaded ') + label.name)
            echo.upload(label.name)
        })
        // Catch error
        .catch(function (err) {
            // If response.status is 404
            if (err.response.status == 404) {
                echo.error('404: Not found.')
                echo.error('URL seems to be faulty: ' + url)
                echo.error('Please check your arguments and try again.', true)
            } else {
                echo.error('An unexpected error occurred.')
                echo.error('Label: ' + JSON.stringify(label))
                echo.error(err, exit)
            }
        })
}

// Delete Label
function deleteLabel(exit, token, label) {
    return axios.delete(label.url, { headers: { Authorization: 'Bearer ' + token } })
        .then(function () {
            // echo.info(chalk.italic('Deleted ') + label.name)
            echo.remove(label.name)
        })
        // Catch error
        .catch(function (err) {
            echo.error('An unexpected error occurred.')
            echo.error('Label: ' + JSON.stringify(label))
            echo.error(err, exit)
        })
}

// Exports
module.exports = {
    getLabels: getLabels,
    saveLabel: saveLabel,
    deleteLabel: deleteLabel
}
