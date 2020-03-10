<div align="center">
	<!-- <img src="Stuff/AppIcon-readme.png" width="200" height="200"> -->
	<h1>labeler</h1>
	<p>
		<b>Easily manage default labels in GitHub repositories</b>
	</p>

  <!-- Badges -->
  <a href="#usage" alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Passing-green.svg"></img></a>
  <!-- <a href="#issues" alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Partial-orange.svg"></img></a> -->
  <!-- <a href="#issues" alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Failing-red.svg"></img></a> -->
</div>

<!-- Uncomment the following quote whenever the CLI is Failing -->
<!-- > Reason to why its failing here. -->

## Why?
Because I was sick of always deleting the default labels and uploading my own ones one by one.

## How?
By storing your labels in a file called `labels.json`, deleting the default ones in the repository and uploading the ones from said file.

## Installation
```
npm install --global labeler
```

## Usage
```
NAME
    labeler - Label manager for GitHub repositories.

SYNOPSIS
    labeler [OPTIONS]

DESCRIPTION
    Create custom labels on GitHub repositories automatically.
    This CLI helps you organize your GitHub labels by storing them in a file called labels.json.
    You can add new labels through the CLI with the -n flag.
    Whenever you create a new repository, instead of manually uploading your labels,
    use this CLI to have it done automatically!

OPTIONS
    -c, --config
        Launch interactive CLI to store data into config. Storing empty strings removes data from config.

    -r, --repository [REPOSITORY]
        Specify GitHub repository name. If not specified uses values in config, else ignores config.

    -o, --owner [OWNER]
        Specify owner of the repository. If not specified uses values in config, else ignores config.

    -t, --token [TOKEN]
        Specify Personal Access Token. If not specified uses values in config, else ignores config.

    -h, --help
        Display this help page.

    -d, --deleteAllLabels
        Delete all existing labels in repository.

    -u, --upload
        Upload custom labels.

    -n, --newLabel
        Launch interactive CLI to store new labels in the labels.json file.

    -f, --force
        Does not ask for user confirmation.

EXAMPLES
    Delete all labels from the repository and upload custom ones stored under labels.json:
        labeler -dur repositoryName

    Same as above but without the confirmation questions:
        labeler -fdur repositoryName
```

I've tried my best to create a tool that everyone can use as they want. If you prefer using flags for everything, feel free to run `labeler -t [TOKEN] -o [OWNER] -r [REPOSITORY] -du`! If you fancy writing less, run `labeler -c` and save your values. Those will be your default ones (unless specified by a flag) when running `labeler -du` (for example).

`labeler` comes with some predefined labels, but you can of course use your own. Either edit `labels.json` accordingly, or run `labeler -n` to add a new label through the CLI.

## Commands
### `labeler -c`
Interactive CLI for the config. Most likely the first command to run. I recommend setting the `token` and the `owner`, as they rarely change usually. If you want to remove an entry, simply enter nothing when asked.

- **token**: Personal GitHub Access Token. Create one called `labeler` [here](https://github.com/settings/tokens) with the following permissions: `admin:org, repo`
- **owner**: Also known as the username. In [my case](https://github.com/Zebiano) it's `Zebiano` for example.
- **repository**: Name of the repository. As an example, this repo would be `labeler`. It is **not recommended** to set this setting as it may cause non-intentional deletion of labels.

In case you need to access a repository from another owner, simply run the `-o [OWNER]` flag and the one stored in the config will be ignored.

### `labeler -n`
An interactive CLI to help you add new Labels to the `labels.json` file.

- **name**: Name of label.
  - *Example:* `Bug :beetle:`
- **description**: Description of label.
  - *Example:* `This is bug.`
- **color**: Color of label. Hex value, no `#` needed.
  - *Example:* `FC271E`

### `labeler -fdur [REPOSITORY]`
A very specific example, yet the one I think will be the most used:
- `-f` Ignores asking for confirmation.
- `-d` Delete all labels from repository.
- `-u` Upload custom labels to repository.
- `-r` Specify the repository.

It's assumed that `token` and `owner` are set in the `config`!

## `labels.json`
This is the file where all you custom labels are stored. Feel free to edit it. Just keep in mind it has to have the following structure:
```
[
    {
        "name": "Label name",
        "color": "FFFFFF",
        "description": "Label Description."
    },
    ...
]
```

## Issues
You tell me. Make sure to check the [issues](https://github.com/zebscripts/Labeler/issues) out, I'll try my best to keep them updated. Might as well check the default labels out!

## Contributing
I'm always open for new ideas and pull requests/code optimization. Though I don't think a lot more will be done as this is a fairly small project, which doesn't need too many features.
