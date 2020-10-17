// Require: Packages
const axios = require('axios')

// Require: Libs
const echo = require('./echo')

// Require: Files
const pkg = require('../package.json')

/* --- Functions --- */
// Get all Labels
function getLabels(exit, token, owner, host, repository) {
    // Variables
    let url

    // Set URL depending on the host
    if (host != pkg.labeler.defaultHost) url = 'https://' + host + '/api/v3/repos/' + owner + '/' + repository + '/labels'
    else url = 'https://' + host + '/repos/' + owner + '/' + repository + '/labels'

    // Get request
    return axios
        .get(url, {
            headers: {
                Authorization: 'Bearer ' + token,
                accept: 'application/vnd.github.v3+json'
            }
        })
        .catch(function (err) {
            // If response.status is 404
            if (err.response.status == 404) {
                echo.error('404: Not found.')
                echo.error('URL seems to be faulty: ' + url)
                echo.error('Please check your arguments and try again.', true)
            } else {
                echo.error('An unexpected error occurred.')
                echo.error(err.message, exit)
            }
        })
}

// Save new Label
function saveLabel(exit, token, owner, host, repository, label) {
    // Variables
    let url

    // Set URL depending on the host
    if (host != pkg.labeler.defaultHost) url = 'https://' + host + '/api/v3/repos/' + owner + '/' + repository + '/labels'
    else url = 'https://' + host + '/repos/' + owner + '/' + repository + '/labels'

    // Post request
    return axios
        .post(url, {
            name: label.name,
            description: label.description,
            color: label.color
        }, {
            headers: {
                Authorization: 'Bearer ' + token,
                accept: 'application/vnd.github.v3+json'
            }
        })
        .then(function () {
            // echo.info(chalk.italic('Uploaded ') + label.name)
            echo.upload(label.name)
        })
        .catch(function (err) {
            if (err.response) {
                if (err.response.status == 404) {
                    // If response.status is 404
                    echo.error('404: Not found.')
                    echo.error('URL seems to be faulty: ' + url)
                    echo.error('Please check your arguments and try again.', true)
                } else if (err.response.status == 422 && err.response.data.errors[0].code == 'already_exists') {
                    // If already_exists
                    echo.skip(label.name)
                }
            } else {
                echo.error('An unexpected error occurred.')
                echo.error('Label: ' + JSON.stringify(label))
                echo.error(err.message, exit)
            }
        })
}

// Delete Label
function deleteLabel(exit, token, label) {
    return axios
        .delete(label.url, {
            headers: {
                Authorization: 'Bearer ' + token,
                accept: 'application/vnd.github.v3+json'
            }
        })
        .then(function () {
            echo.remove(label.name)
        })
        .catch(function (err) {
            echo.error('An unexpected error occurred.')
            echo.error('Label: ' + JSON.stringify(label))
            echo.error(err.message, exit)
        })
}

// Get headers from request to list all repos for an organization
function headRepoList(exit, token, owner, host, perPage) {
    // Variables
    let url = 'https://' + host + '/api/v3/orgs/' + owner + '/repos?sort=full_name&per_page=' + perPage

    // HEAD request
    return axios    
        .head(url, {
            headers: {
                Authorization: 'Bearer ' + token,
                accept: 'application/vnd.github.v3+json'
            }
        })
        .catch(function (err) {
            // If response.status is 404
            if (err.response.status == 404) {
                echo.error('404: Not found.')
                echo.error('URL seems to be faulty: ' + url)
                echo.error('Please check your arguments and try again.', true)
            } else {
                echo.error('An unexpected error occurred.')
                echo.error(err.message, exit)
            }
        })

    // console.log(parse_link_header(response.headers.link))
}

function getReopsByPage(exit, token, owner, host, pageNum, perPage) {
    // Variables
    let url = 'https://' + host + '/api/v3/orgs/' + owner + '/repos?sort=full_name&page=' + pageNum + '&per_page=' + perPage

    // Get request
    return axios    
        .get(url, {
            headers: {
                Authorization: 'Bearer ' + token,
                accept: 'application/vnd.github.v3+json'
            }
        })
        .catch(function (err) {
            // If response.status is 404
            if (err.response.status == 404) {
                echo.error('404: Not found.')
                echo.error('URL seems to be faulty: ' + url)
                echo.error('Please check your arguments and try again.', true)
            } else {
                echo.error('An unexpected error occurred.')
                echo.error(err.message, exit)
            }
        })

    // console.log(parse_link_header(response.headers.link))
}

function parse_link_header(header) {
    if (header.length === 0) {
        throw new Error("input must not be of zero length");
    }

    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    for(var i=0; i<parts.length; i++) {
        var section = parts[i].split(';');
        if (section.length !== 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    }
    return links;
}



// Exports
module.exports = {
    getLabels: getLabels,
    saveLabel: saveLabel,
    deleteLabel: deleteLabel,
    headRepoList: headRepoList,
    getReopsByPage: getReopsByPage
}
