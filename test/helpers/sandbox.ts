// Import: Packages
import { mkdtempSync, rmSync } from 'node:fs'
import Os from 'node:os'
import Path from 'node:path'

/* Preloaded before every test file, because lib/store.ts builds both conf stores as it loads
   and conf resolves their directory in the constructor. Without this the tests would read and
   write the real config, which holds a working token */
const sandbox = mkdtempSync(Path.join(Os.tmpdir(), 'labeler-test-'))
process.env['XDG_CONFIG_HOME'] = sandbox

process.on('exit', () => {
  rmSync(sandbox, { recursive: true, force: true })
})
