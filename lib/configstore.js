// Require: Packages
const Configstore = require('configstore')

// Require: Files
const pkg = require('../package.json')
const defaultLabels = require('./_default_labels.json')

// Variables
const config = new Configstore(pkg.name)
const labelsConfig = new Configstore(pkg.name + '_labels')

// Check for key in config
function has(type, key) {
    switch (type) {
        case 'config':
            if (config.has(key)) return true
            return false
        case 'labels':
            if (labelsConfig.has(key)) return true
            return false
    }
}

// Get key
function get(type, key) {
    switch (type) {
        case 'config':
            return config.get(key)
        case 'labels':
            return labelsConfig.get(key)
    }
}

// Get all
function getAll(type) {
    switch (type) {
        case 'config':
            return config.all
        case 'labels':
            if (!has('labels', 'labels')) set('labels', { 'labels': defaultLabels })
            return labelsConfig.get('labels')
    }
}

// Set new key
function set(type, object) {
    switch (type) {
        case 'config':
            config.set(object)
        case 'labels':
            labelsConfig.set(object)
    }
}

// Delete key
function remove(type, key) {
    switch (type) {
        case 'config':
            config.delete(key)
        case 'labels':
            labelsConfig.delete(key)
    }
}

// Delete all items
function clear(type) {
    switch (type) {
        case 'config':
            config.clear()
        case 'labels':
            labelsConfig.clear()
    }
}

// Reset labels.json
function resetLabels() {
    set('labels', { 'labels': defaultLabels })
}

// Get path
function path(type) {
    switch (type) {
        case 'config':
            return config.path
        case 'labels':
            return labelsConfig.path
    }
}

// Exports
module.exports = {
    has: has,
    get: get,
    getAll: getAll,
    set: set,
    remove: remove,
    clear: clear,
    resetLabels: resetLabels,
    path: path
}
