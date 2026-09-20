// Import: Packages
import Conf from 'conf'
import { existsSync, readFileSync, unlinkSync } from 'node:fs'
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

// What a migration imported, so the CLI can mention it once at startup
export interface Imported {
  config: number
  labels: number
}

// Variables
const name = 'labeler'

// The layout version of the stores themselves, deliberately independent of the app version
// so that releasing a new Labeler does not imply a store migration
const storeVersion = '1.0.0'

// conf hides its bookkeeping behind this key. It must never reach the user
const internalKey = '__internal__'

const imported: Imported = { config: 0, labels: 0 }

/* --- Migration --- */
// v5 stored both files with the 'configstore' package, which used
// <XDG_CONFIG_HOME>/configstore on every platform, unlike conf's platform-native paths.
// The old location cannot be derived from the new one, so it is spelled out here
export function legacyDir(): string {
  return Path.join(process.env['XDG_CONFIG_HOME'] ?? Path.join(Os.homedir(), '.config'), 'configstore')
}

export function legacyPaths(): { config: string, labels: string } {
  const dir = legacyDir()
  return { config: Path.join(dir, `${name}.json`), labels: Path.join(dir, `${name}_labels.json`) }
}

// Removes the v5 files once their contents are safely in the new stores. Only the two files
// Labeler owns are touched. The directory is shared with every other tool that used the
// configstore package, so it is never removed
export function removeLegacy(): string[] {
  const removed: string[] = []
  const paths = legacyPaths()
  for (const file of [paths.config, paths.labels]) {
    try {
      if (existsSync(file)) {
        unlinkSync(file)
        removed.push(file)
      }
    } catch {
      // A file that cannot be removed is left alone. The data is already in the new store
    }
  }
  return removed
}

// Reads a JSON file, treating a missing or unreadable one as absent
function readJson(file: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
  } catch {
    return undefined
  }
}

// What the migration brought over from v5, if anything
export function importedFromLegacy(): Imported {
  return { ...imported }
}

/* --- Stores --- */
// Both stores live wherever conf places them by default, which is the platform's standard
// config directory. 'labeler -p' prints the resolved path.
// conf stamps the store version on first write and compares it on every later start, so the
// migrations below run at most once per installation and cost no filesystem access after that
const labelsConfig = new Conf<LabelsStore>({
  projectName: name,
  configName: 'labels',
  projectVersion: storeVersion,
  migrations: {
    '1.0.0': store => {
      const legacy = readJson(legacyPaths().labels)?.['labels']
      if (Array.isArray(legacy) && legacy.length > 0) {
        store.set('labels', legacy as Label[])
        imported.labels = legacy.length
      }
    }
  }
})

const config = new Conf<Config>({
  projectName: name,
  projectVersion: storeVersion,
  migrations: {
    '1.0.0': store => {
      const legacy = readJson(legacyPaths().config)
      if (legacy && Object.keys(legacy).length > 0) {
        store.set(legacy as Partial<Config>)
        imported.config = Object.keys(legacy).length
      }
    }
  }
})

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
    case 'config': {
      // conf's own bookkeeping shares the file, but is not the user's to see or edit
      const values = { ...config.store } as Record<string, unknown>
      delete values[internalKey]
      return values as Config
    }
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
