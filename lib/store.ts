// Import: Packages
import Conf from 'conf'
import Os from 'node:os'
import Path from 'node:path'

// Import: Libs
import type { Label } from './github.js'

// Import: Files
import defaultLabels from './_default_labels.json' with { type: 'json' }

/* --- Types --- */
// Which of the two stores to act on
export type StoreType = 'config' | 'labels'

// The values kept in the config store
export interface Config {
  token?: string
  owner?: string
  repository?: string
  host?: string
}

// The shape of the labels store
interface LabelsStore {
  labels: Label[]
}

// Variables
const name = 'labeler'

// v5 wrote both files with the 'configstore' package, which puts them in
// <XDG_CONFIG_HOME>/configstore. Point conf at the same directory and filenames
// so an existing installation keeps its config and its labels
const cwd = Path.join(process.env['XDG_CONFIG_HOME'] ?? Path.join(Os.homedir(), '.config'), 'configstore')

const config = new Conf<Config>({ projectName: name, configName: name, cwd })
const labelsConfig = new Conf<LabelsStore>({ projectName: name, configName: `${name}_labels`, cwd })

/* --- Functions --- */
// Check for key in config
export function has(type: StoreType, key: string): boolean {
  switch (type) {
    case 'config': return config.has(key as keyof Config)
    case 'labels': return labelsConfig.has(key as keyof LabelsStore)
  }
}

// Get key
export function get(type: StoreType, key: string): unknown {
  switch (type) {
    case 'config': return config.get(key as keyof Config)
    case 'labels': return labelsConfig.get(key as keyof LabelsStore)
  }
}

// Get all
export function getAll(type: 'config'): Config
export function getAll(type: 'labels'): Label[]
export function getAll(type: StoreType): Config | Label[] {
  switch (type) {
    case 'config': return config.store
    case 'labels':
      if (!has('labels', 'labels')) resetLabels()
      return labelsConfig.get('labels') ?? []
  }
}

// Set new key
export function set(type: StoreType, object: object): void {
  switch (type) {
    case 'config': config.set(object as Partial<Config>); break
    case 'labels': labelsConfig.set(object as LabelsStore); break
  }
}

// Delete key
export function remove(type: StoreType, key: string): void {
  switch (type) {
    case 'config': config.delete(key as keyof Config); break
    case 'labels': labelsConfig.delete(key as keyof LabelsStore); break
  }
}

// Delete all items
export function clear(type: StoreType): void {
  switch (type) {
    case 'config': config.clear(); break
    case 'labels': labelsConfig.clear(); break
  }
}

// Reset labels.json
export function resetLabels(): void {
  set('labels', { labels: defaultLabels })
}

// Get path
export function path(type: StoreType): string {
  switch (type) {
    case 'config': return config.path
    case 'labels': return labelsConfig.path
  }
}
