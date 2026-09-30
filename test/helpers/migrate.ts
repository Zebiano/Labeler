// Import: Libs
import * as helper from '../../lib/helper.js'
import * as store from '../../lib/store.js'

/* Run by the store tests in a process of its own, with XDG_CONFIG_HOME pointing at a prepared
   directory, because a store only migrates when it is first built. It prints the v5 notice the
   way the CLI would, then one last line reporting what the stores hold */
helper.echoMigration()
console.log(JSON.stringify({
  imported: store.importedFromLegacy(),
  config: store.getAll('config'),
  labels: store.getAll('labels')
}))
