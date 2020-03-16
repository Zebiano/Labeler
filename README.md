<div align="center">
	<!-- <img src="Stuff/AppIcon-readme.png" width="200" height="200"> -->
	<h1>Labeler</h1>
	<p>
		<b>Easily manage default labels in GitHub repositories</b>
	</p>

  <!-- Badges -->
  <a href="#usage" alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Passing-green.svg"></img></a>
  <!-- <a href="#issues" alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Partial-orange.svg"></img></a> -->
  <!-- <a href="#issues" alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Failing-red.svg"></img></a> -->
</div>

<!-- Uncomment the following quote whenever the CLI is Failing -->
<!-- > Why is it failing? -->

## Why?
Because I was sick of always deleting the default labels and uploading my own ones.

## How?
By storing custom labels in a `labels.json` file, deleting the default ones from the repository and uploading those from said file.

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
    This CLI helps you organize your GitHub labels by storing them in a labels.json file. You can add new labels through the CLI with the -n flag.
    Whenever you create a new repository, instead of manually uploading your labels, use this CLI to have it done automatically!

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

    -d, --delete-all-labels
        Delete all existing labels in repository.

    -u, --upload-labels
        Upload custom labels.

    -n, --new-label
        Launch interactive CLI to store new labels in the labels.json file.

    -f, --force
        Does not ask for user confirmation.

    -e, --empty-labels-file
        Remove every label from the labels.json file.

    -R, --reset-labels-file
        Reset labels.json by deleting it and creating it with default labels.

EXAMPLES
    Delete all labels from the repository and upload custom ones stored under labels.json:
        labeler -dur repositoryName

    Same as above but without the confirmation questions:
        labeler -fdur repositoryName

    Delete every label from labels.json and add new labels to it:
        labeler -en
```

I've tried my best to create a tool for everyone. If you prefer using flags, feel free to run `labeler -t [TOKEN] -o [OWNER] -r [REPOSITORY] -du`! If you fancy writing less, run `labeler -c` and save your values. Those will be your default ones (unless specified by a flag).

`labeler` comes with some predefined labels, but you can of course use your own. By running  `labeler -en`, you'll start a fresh new file. The `path` to the file will be in the terminal, in case you prefer to open and edit it with your editor of choice.

## Commands
#### `labeler -c`
Interactive CLI for the config. Most likely the first command to run. I recommend setting the `token` and the `owner`, as they rarely change usually. If you want to remove an entry, simply enter nothing when asked.

- **token**: Personal GitHub Access Token. Create one called "Labeler" [here](https://github.com/settings/tokens) with the following permissions: `admin:org, repo`
- **owner**: Also known as the username. In [my case](https://github.com/Zebiano) it's `Zebiano` for example.
- **repository**: Name of the repository. As an example, this repo would be `labeler`. It is **not recommended** to set this setting as it may cause non-intentional deletions of labels.

In case you need to access a repository from another owner, simply run the `-o [OWNER]` flag and the one stored in the config will be ignored.

#### `labeler -n`
An interactive CLI to help you add new Labels to the `labels.json` file. It also shows the files `path`.
- **name**: Name of label.
  - *Example:* `Bug :beetle:`
- **description**: (Optional) Description of label.
  - *Example:* `This is a bug.`
- **color**: Hex color of label.
  - *Example:* `FC271E`

If you want to start fresh, run `labeler -en`. This way, every label inside the `labels.json` file will be removed first.

#### `labeler -fdur [REPOSITORY]`
A very specific example, yet the one I think will be the most used. It's assumed that `token` and `owner` are set in the [config](#labeler--c)!
- `-f` Ignore user confirmation.
- `-d` Delete all labels from repository.
- `-u` Upload custom labels to repository.
- `-r` Specify the repository.

## `labels.json`
This is the file where all your custom labels are stored. Feel free to edit it. Just keep in mind it has to have the following structure:
```
[
    {
        "name": "Label name",
        "color": "FC271E",
        "description": "Label Description."
    },
    ...
]
```

## Issues
You tell me. Make sure to check the [issues](https://github.com/zebscripts/Labeler/issues) out, I'll try my best to keep them updated! And since you're there already, might as well take a look at the default labels, as those are the ones shipped with this package.
