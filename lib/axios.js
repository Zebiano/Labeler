// Requires: Packages
const axios = require('axios')

/* --- Functions --- */
// Save new Labels
function saveLabels(labels) {
    console.log(labels)
    // curl -u $TOKEN:x-oauth-basic --include --request POST --data '{"name":"Ready","color":"fbca04"}' "https://api.github.com/repos/$REPO_USER/$REPO_NAME/labels"
}

// Delete Labels
function deleteLabels(labels) {
    console.log(labels)
    // curl -u $TOKEN:x-oauth-basic --request DELETE https://api.github.com/repos/$REPO_USER/$REPO_NAME/labels/wontfix
}

// Exports
module.exports = {
    saveLabels: saveLabels
}