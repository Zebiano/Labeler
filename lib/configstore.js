// Requires: Packages
const Configstore = require('configstore')

// Requires: Files
const packageJson = require('../package.json')

// Variables
const config = new Configstore(packageJson.name)

// Check for Token
function hasToken() {
    if (config.has('token')) return true
    return false
}

// Check for Owner
function hasOwner() {
    if (config.has('owner')) return true
    return false
}

// Check for Repository
function hasRepository() {
    if (config.has('repository')) return true
    return false
}

// Exports
module.exports = {
    hasToken: hasToken,
    hasOwner: hasOwner,
    hasRepository: hasRepository
}