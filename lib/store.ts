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
/** Which of the two stores to act on */
export type StoreType = 'config' | 'labels'

/** The values kept in the config store */
export interface Config {
  token?: string
  owner?: string
  repository?: string
  host?: string
  apiVersion?: string
  enterpriseApiVersion?: string
}

/** The shape of the labels store */
interface LabelsStore {
  labels: Label[]
}

/** What a migration imported, and which v5 files it then removed */
export interface Imported {
  /** Config values brought over */
  config: number
  /** Labels brought over */
  labels: number
  /** Paths of the v5 files that were deleted */
  removed: string[]
}

// Variables
const name = 'labeler'

/** Layout version of the stores, kept apart from the app version on purpose */
const storeVersion = '1.0.0'

/** conf hides its bookkeeping behind this key. It must never reach the user */
const internalKey = '__internal__'

const imported: Imported = { config: 0, labels: 0, removed: [] }

/* --- Migration --- */
/**
 * Where v5 kept its files. The 'configstore' package used the same path on every platform,
 * unlike conf, so this cannot be derived from the current location.
 * @returns The v5 directory
 */
export function legacyDir(): string {
  return Path.join(process.env['XDG_CONFIG_HOME'] ?? Path.join(Os.homedir(), '.config'), 'configstore')
}

/**
 * Locates the two v5 files.
 * @returns Their paths
 */
export function legacyPaths(): { config: string, labels: string } {
  const dir = legacyDir()
  return { config: Path.join(dir, `${name}.json`), labels: Path.join(dir, `${name}_labels.json`) }
}

/**
 * Removes the v5 files, once their contents are safely in the new stores. Only Labeler's two
 * files are touched, never the directory, which is shared with every other configstore user.
 * @returns The paths that were removed
 */
function removeLegacy(): string[] {
  const removed: string[] = []
  for (const file of Object.values(legacyPaths())) {
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

/**
 * Reads a JSON file, treating a missing or unreadable one as absent.
 * @param file Path to read
 * @returns Its contents, or undefined
 */
function readJson(file: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
  } catch {
    return undefined
  }
}

/**
 * Reports what the migration brought over from v5, if anything.
 * @returns The counts and the removed files
 */
export function importedFromLegacy(): Imported {
  return { ...imported, removed: [...imported.removed] }
}

/* --- Stores --- */
/** The labels store, in conf's default directory. The migration imports a v5 file once */
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

/** The config store, beside the labels. 'labeler -p' prints the resolved directory */
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

/* The stores are written and stamped once their constructors return, so the v5 files can go
   here rather than where the import is announced, which a run can exit before reaching */
if (imported.config || imported.labels) imported.removed = removeLegacy()

/**
 * Both stores behind one lookup. The functions below are addressed by name, so this loosens
 * conf's per-store key typing on purpose.
 */
const stores = { config, labels: labelsConfig } as unknown as Record<StoreType, Conf<Record<string, unknown>>>

/* --- Functions --- */
/**
 * Checks a store for a key.
 * @param type Which store
 * @param key Key to look for
 * @returns Whether it is set
 */
export function has(type: StoreType, key: string): boolean {
  return stores[type].has(key)
}

/**
 * Reads one value.
 * @param type Which store
 * @param key Key to read
 * @returns Its value, or undefined
 */
export function get(type: StoreType, key: string): unknown {
  return stores[type].get(key)
}

/**
 * Reads a whole store. The labels are seeded with the defaults when missing, and conf's own
 * bookkeeping is stripped from the config.
 * @param type Which store
 * @returns Its contents
 */
export function getAll(type: 'config'): Config
export function getAll(type: 'labels'): Label[]
export function getAll(type: StoreType): Config | Label[] {
  if (type == 'labels') {
    if (!has('labels', 'labels')) resetLabels()
    return labelsConfig.get('labels') ?? []
  }

  // conf's own bookkeeping shares the file, but is not the user's to see or edit
  const values = { ...config.store } as Record<string, unknown>
  delete values[internalKey]
  return values as Config
}

/**
 * Merges values into a store.
 * @param type Which store
 * @param object The values to write
 */
export function set(type: StoreType, object: object): void {
  stores[type].set(object)
}

/**
 * Removes one value.
 * @param type Which store
 * @param key Key to remove
 */
export function remove(type: StoreType, key: string): void {
  stores[type].delete(key)
}

/** Overwrites the labels store with the shipped defaults */
export function resetLabels(): void {
  set('labels', { labels: defaultLabels })
}

/**
 * Locates a store's file.
 * @param type Which store
 * @returns Its path
 */
export function path(type: StoreType): string {
  return stores[type].path
}
