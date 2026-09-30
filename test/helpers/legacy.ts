// Import: Packages
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import Os from 'node:os'
import Path from 'node:path'

/* --- Types --- */
/** A config directory with a v5 installation in it */
export interface Legacy {
  /** The config directory, to be used as XDG_CONFIG_HOME */
  dir: string
  /** The directory configstore wrote to, inside it */
  legacy: string
}

/* --- Functions --- */
/**
 * Builds a config directory holding a v5 installation, plus a file belonging to another tool.
 * The store module imports as it loads, so this has to run before it is imported.
 * @param config What v5 kept in 'labeler.json'
 * @param labels What v5 kept in 'labeler_labels.json'
 * @returns The directories
 */
export function seedLegacy(config: object, labels: object): Legacy {
  const dir = mkdtempSync(Path.join(Os.tmpdir(), 'labeler-legacy-'))
  const legacy = Path.join(dir, 'configstore')

  mkdirSync(legacy)
  writeFileSync(Path.join(legacy, 'labeler.json'), JSON.stringify(config))
  writeFileSync(Path.join(legacy, 'labeler_labels.json'), JSON.stringify(labels))
  writeFileSync(Path.join(legacy, 'update-notifier-labeler.json'), '{"another":"tool"}')
  return { dir, legacy }
}
