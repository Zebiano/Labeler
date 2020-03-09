// Requires: Packages
const Configstore = require('configstore')

// Requires: Files
const packageJson = require('../package.json')

// Variables
const config = new Configstore(packageJson.name)

// Check for key in config
function has(key) {
    if (config.has(key)) return true
    return false
}

// Get key
function get(key) {
    return config.get(key)
}

// Get all
function getAll() {
    return config.all
}

// Set new key
function set(object) {
    config.set(object)
}

// Delete key
function remove(key) {
    config.delete(key)
}

// Exports
module.exports = {
    has: has,
    get: get,
    getAll: getAll,
    set: set,
    remove: remove
}