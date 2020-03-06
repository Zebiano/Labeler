// Requires: Packages
const Configstore = require('configstore')

// Requires: Files
const packageJson = require('../package.json')

// Variables
const config = new Configstore(packageJson.name)

// Check for key in config
function hasKey(key) {
    if (config.has(key)) return true
    return false
}

// Get key
function getKey(key) {
    return config.get(key)
}

// Get all
function getAll() {
    return config.all
}

// Exports
module.exports = {
    hasKey: hasKey,
    getKey: getKey,
    getAll: getAll
}