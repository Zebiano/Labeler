#!/usr/bin/env node
// Import: Packages
import Meow from 'meow'
import UpdateNotifier from 'update-notifier'
import { readFile } from 'fs/promises'
import Path from 'path'
import { fileURLToPath } from 'url'

// Import: Libs
import * as inquirer from './lib/inquirer.js'
import * as config from './lib/configstore.js'
import * as echo from './lib/echo.js'
import * as helper from './lib/helper.js'

// Import: Files
const pkg = JSON.parse(await readFile(`${Path.dirname(fileURLToPath(import.meta.url))}/package.json`));

// Variables
const helpText = `
NAME
    labeler - Label manager for GitHub repositories.

SYNOPSIS
    labeler [OPTIONS]

DESCRIPTION
    Create custom labels on GitHub repositories automatically.
    This CLI helps you organize your GitHub labels by storing them in a 'labels.json' file. You can add new labels through the CLI with the -n flag.
    Whenever you create a new repository, instead of manually uploading your labels, use this CLI to have it done automatically!

OPTIONS
    -b, --bulkUpdate
        Update all repositories under GHE owner organization. Can only be used with a GitHub Enterprise host.

    -c, --config
        Launch interactive CLI to store data into config. Storing empty strings removes data from config.

    -d, --deleteAllLabels
        Delete all existing labels in repository.

    -e, --emptyLabelsFile
        Remove every label from the 'labels.json' file.
    
    -f, --force
        Ignore user confirmation.

    -h, --help
        Display this help page.
    
    -H, --host [HOST]
        Specify host. If not specified uses values in config, else ignores config.

    -n, --newLabel
        Launch interactive CLI to store new labels in the 'labels.json' file.

    -o, --owner [OWNER]
        Specify owner of repository. If not specified uses values in config, else ignores config.

    -p, --path
        Return the path for 'labels.json' file.

    -r, --repository [REPOSITORY]
        Specify GitHub repository name. If not specified uses values in config, else ignores config.

    -R, --resetLabelsFile
        Reset 'labels.json' by overwriting 'labels.json' with the default labels.

    -t, --token [TOKEN]
        Specify personal access token. If not specified uses values in config, else ignores config.

    -u, --uploadLabels
        Upload custom labels to repository. Skips already existing labels.

EXAMPLES
    Delete all labels from the repository and upload custom ones stored under 'labels.json' to the repository:
        labeler -dur Labeler

    Same as above but without the confirmation questions:
        labeler -fdur Labeler

    Delete every label from 'labels.json' and add new labels to it:
        labeler -en

    Using GitHub Enterprise hosts:
        labeler -dur Labeler -H github.yourhost.com
    
    Delete and upload all labels from a GHE organization:
        labeler -dub -H github.yourhost.com
`;

// Meow CLI
const cli = Meow(helpText, {
  importMeta: import.meta,
  description: false,
  flags: {
    'help': {
      alias: 'h',
      type: 'boolean'
    },
    'config': {
      alias: 'c',
      type: 'boolean'
    },
    'repository': {
      alias: 'r',
      type: 'string'
    },
    'owner': {
      alias: 'o',
      type: 'string'
    },
    'host': {
      alias: 'H',
      type: 'string'
    },
    'token': {
      alias: 't',
      type: 'string'
    },
    'bulkUpdate': {
      alias: 'b',
      type: 'boolean'
    },
    'deleteAllLabels': {
      alias: 'd',
      type: 'boolean'
    },
    'newLabel': {
      alias: 'n',
      type: 'boolean'
    },
    'uploadLabels': {
      alias: 'u',
      type: 'boolean'
    },
    'force': {
      alias: 'f',
      type: 'boolean'
    },
    'emptyLabelsFile': {
      alias: 'e',
      type: 'boolean'
    },
    'resetLabelsFile': {
      alias: 'R',
      type: 'boolean'
    },
    'path': {
      alias: 'p',
      type: 'boolean'
    }
  }
})

/* --- Start --- */
console.log()

// Update Notifier
UpdateNotifier({ pkg }).notify({ isGlobal: true })

// Variables
const token = helper.assignFlag(cli, 'token')
const owner = helper.assignFlag(cli, 'owner')
const repository = helper.assignFlag(cli, 'repository')
const host = helper.assignFlag(cli, 'host')

// Main function
async function main() {
  // Warn user if -f
  if (cli.flags.force) echo.warning('Detected -f, ignoring user confirmation.\n')

  // Check if flags were called correctly
  helper.checkFlags(cli)

  // Check for flags
  if (cli.flags.bulkUpdate) helper.echoOwnerRepository(owner, 'Various')
  else if (cli.flags.deleteAllLabels || cli.flags.uploadLabels) helper.echoOwnerRepository(owner, repository)

  // Run functions according to flags
  if (cli.flags.path) helper.labelsPath() // Return labels.json path
  if (cli.flags.resetLabelsFile) await helper.resetLabelsFile(cli) // Reset labels.json file
  if (cli.flags.emptyLabelsFile) await helper.emptyLabelsFile(cli) // Delete all labels from labels.json

  // This will delete and/or upload all labels to every repository under the owner organization in GHE
  // TODO (#27): Currently only handles GHE instances, but could probably be adapted for a GitHub user
  if (cli.flags.bulkUpdate) {
    const repos = await helper.getRepositories(token, owner, host)
    for (const repo of repos) {
      if (cli.flags.deleteAllLabels) await helper.deleteAllLabels(token, owner, host, repo, cli, false) // Delete all labels from repository
      if (cli.flags.uploadLabels) await helper.uploadLabels(token, owner, host, repo, cli, false) // Upload custom labels to repository
    }
    echo.success('Finished!', true)
  } else {
    if (cli.flags.deleteAllLabels) await helper.deleteAllLabels(token, owner, host, repository, cli, true) // Delete all labels from repository
    if (cli.flags.uploadLabels) await helper.uploadLabels(token, owner, host, repository, cli, true) // Upload custom labels to repository
  }

  if (cli.flags.config) await helper.cliConfig() // Run the interactive config CLI
  // Run the interactive "create new label" CLI
  if (cli.flags.newLabel) {
    echo.tip('If you want to edit the file, here\'s the path:')
    echo.info(config.path('labels'))
    console.log()

    // Ask if the user wants a fresh file or not
    if (!cli.flags.force && !cli.flags.emptyLabelsFile) {
      const answerFresh = await inquirer.choiceFreshNewLabels()
      if (answerFresh) config.set('labels', { 'labels': [] })
      console.log()
    }

    echo.info('Create new labels:')
    await helper.cliNewLabel(cli)
  }

  // If any of these flags is true, exit (these are the ones that can always be called, no matter what)
  if (cli.flags.resetLabelsFile || cli.flags.path) process.exit()

  // If nothing happens, I'm assuming the user ran without flags
  echo.error('Missing arguments.')
  echo.tip('Use -h for help.')
  echo.info(`Version ${pkg.version}`, true)
}

// Call main()
main()
