// Requires: Packages
const meow = require('meow');

// Variables
const helpText = `
NAME
    labeler - Label manager for GitHub repositories.

SYNOPSIS
    labeler [OPTIONS] -r [REPOSITORY]

DESCRIPTION
    Create custom labels on GitHub repositories automatically.
    This CLI helps you organize your GitHub labels by storing them in a file called labels.json. You can add new labels through the CLI, with the -n flag. Whenever you create a new repository, run this script with the -du flag to delete the default labels and upload your custom ones!

OPTIONS
    -r, --repository (REQUIRED)
        Specify GitHub repository name.

    -o, --owner
        Specify owner of the repository. Ignores "owner" key in settings.json.

    -h, --help
        Display this help page.

    -d, --deleteAllLabels
        Delete all existing labels in repository.

    -c, --config
        Launch interactive CLI to store data into config.

    -n, --newLabel
        Launch interactive CLI to store new labels in the labels.json file.

    -u, --upload
        Upload custom labels.

EXAMPLES
    Delete all labels from the repo, and upload custom ones stored under labels.json:
        labeler -dur repositoryName
`;

meow(helpText, {
    description: false,
    flags: {
        config: {
            alias: 'c',
            type: 'boolean'
        },
        repository: {
            alias: 'r',
            type: 'string',
            default: "undefined"
        },
        owner: {
            alias: 'o',
            type: 'string',
            default: 'undefined'
        },
        help: {
            alias: 'h',
            type: 'boolean'
        },
        deleteAllLabels: {
            alias: 'd',
            type: 'boolean'
        },
        newLabel: {
            alias: 'n',
            type: 'boolean'
        },
        upload: {
            alias: 'u',
            type: 'boolean'
        },
    }
});
// console.log("Hey!", cli.input, cli.flags);
// console.log(cli)

// Exports
module.export = {
    meow: meow
}