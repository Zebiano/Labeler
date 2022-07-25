// Import: Packages
import Configstore from 'configstore'
import { readFile } from 'fs/promises'
import Path from 'path'
import { fileURLToPath } from 'url'

// Import: Files
const pkg = JSON.parse(await readFile(`${Path.dirname(fileURLToPath(import.meta.url))}/../package.json`));
const defaultLabels = JSON.parse(await readFile(`${Path.dirname(fileURLToPath(import.meta.url))}/_default_labels.json`));

// Variables
const config = new Configstore(pkg.name)
const labelsConfig = new Configstore(`${pkg.name}_labels`)

// Check for key in config
export function has(type, key) {
    switch (type) {
        case 'config': return config.has(key)
        case 'labels': return labelsConfig.has(key)
    }
}

// Get key
export function get(type, key) {
    switch (type) {
        case 'config': return config.get(key)
        case 'labels': return labelsConfig.get(key)
    }
}

// Get all
export function getAll(type) {
    switch (type) {
        case 'config': return config.all
        case 'labels':
            if (!has('labels', 'labels')) set('labels', { 'labels': defaultLabels })
            return labelsConfig.get('labels')
    }
}

// Set new key
export function set(type, object) {
    switch (type) {
        case 'config': config.set(object)
        case 'labels': labelsConfig.set(object)
    }
}

// Delete key
export function remove(type, key) {
    switch (type) {
        case 'config': config.delete(key)
        case 'labels': labelsConfig.delete(key)
    }
}

// Delete all items
export function clear(type) {
    switch (type) {
        case 'config': config.clear()
        case 'labels': labelsConfig.clear()
    }
}

// Reset labels.json
export function resetLabels() {
    set('labels', { 'labels': defaultLabels })
}

// Get path
export function path(type) {
    switch (type) {
        case 'config': return config.path
        case 'labels': return labelsConfig.path
    }
}
