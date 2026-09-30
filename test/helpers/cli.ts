// Import: Types
import type { Cli } from '../../labeler.js'

/* --- Functions --- */
/**
 * Builds a stand-in for Meow's result. The helpers only read its flags, and assignFlag checks
 * which flags are present, so only the ones passed here are set.
 * @param flags The flags that were given on the command line
 * @returns The parsed command line
 */
export function cli(flags: Partial<Cli['flags']> = {}): Cli {
  return { flags, input: [], pkg: { version: '6.0.0' }, help: '' } as unknown as Cli
}
