<div align="center">
	<!-- <img src="Stuff/AppIcon-readme.png" width="200" height="200"> -->
    <pre>
   __       _          _           
  / /  __ _| |__   ___| | ___ _ __ 
 / /  / _` | '_ \ / _ \ |/ _ \ '__|
/ /__| (_| | |_) |  __/ |  __/ |   
\____/\__,_|_.__/ \___|_|\___|_|   
    </pre>
	<p>
		<b>Easily manage default labels in GitHub repositories</b>
	</p>

  <!-- Badges -->
  <a href="#usage" alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Passing-green.svg"></img></a>
  <!-- <a alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Partial-orange.svg"></img></a> -->
  <!-- <a alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Failing-red.svg"></img></a> -->
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
    -h, --help
        Display this help page.

    -c, --config
        Launch interactive CLI to store data into config. Storing empty strings removes data from config.

    -n, --newLabel
        Launch interactive CLI to store new labels in the labels.json file.

    -r, --repository [REPOSITORY]
        Specify GitHub repository name. If not specified uses values in config, else ignores config.

    -o, --owner [OWNER]
        Specify owner of repository. If not specified uses values in config, else ignores config.

    -t, --token [TOKEN]
        Specify personal access token. If not specified uses values in config, else ignores config.

    -H, --host [HOST]
        Specify host. If not specified uses values in config, else ignores config.

    -b, --bulkUpdate
        Update all repositories under GHE owner organization. Can only be used with a GitHub Enterprise host.

    -f, --force
        Ignore user confirmation.

    -d, --deleteAllLabels
        Delete all existing labels in repository.

    -u, --uploadLabels
        Upload custom labels to repository. Skips already existing labels.

    -e, --emptyLabelsFile
        Remove every label from the labels.json file.

    -R, --resetLabelsFile
        Reset labels.json by overwriting labels.json with the default labels.

    -p, --path
        Return the path for labels.json file.

EXAMPLES
    Delete all labels from the repository and upload custom ones stored under labels.json to the repository:
        labeler -dur Labeler

    Same as above but without the confirmation questions:
        labeler -fdur Labeler

    Delete every label from labels.json and add new labels to it:
        labeler -en

    Using GitHub Enterprise hosts:
        labeler -dur Labeler -H github.yourhost.com

    Delete and upload all labels from a GHE organization:
        labeler -dub -H github.yourhost.com
```

I've tried my best to create a tool for everyone! If you prefer using flags, feel free to run `labeler -t [TOKEN] -o [OWNER] -r [REPOSITORY] -du`. If you fancy writing less, run `labeler -c` and save your values. Those will be your default ones (unless specified by a flag).

`labeler` comes with some predefined labels, but you can of course use your own. By running  `labeler -en`, you'll start a fresh new file. The `path` to the file will be in the terminal, in case you prefer to open and edit it with your editor of choice.

## Commands
#### `labeler -c`
Interactive CLI for the config. Most likely the first command to run. I recommend setting the `token` and the `owner`, as they rarely change usually. If you want to remove an entry, simply enter nothing when asked.

- **token**: Personal GitHub Access Token. Create one called "Labeler" [here](https://github.com/settings/tokens) with the following permissions: `repo` and `admin:org`.
- **owner**: Also known as the username. In [my case](https://github.com/Zebiano) it's `Zebiano` for example.
- **repository**: Name of the repository. As an example, this repo would be `labeler`. It is **not recommended** to set this setting as it may cause non-intentional deletions of labels.
- **host**: Custom host, useful for GitHub Enterprise Instances. For example `github.yourhost.com`.

In case you need to access a repository from another owner, simply run the `-o [OWNER]` flag and the one stored in the config will be ignored.

#### `labeler -n`
An interactive CLI to help you add new Labels to the `labels.json` file. You'll be asked wether you want to start a new file, or add labels to the already existing one. It also shows the `path`.
- **name**: Name of label.
  - *Example:* `Bug :beetle:`
- **description**: (Optional) Description of label.
  - *Example:* `This is a bug.`
- **color**: Hex color of label.
  - *Example:* `FC271E`

Alternatively, run `labeler -en`. This way, every label inside the `labels.json` file will be removed first. 

*Note:* Running `labeler -fn` will bypass the question, which defaults to "keep file as is".

#### `labeler -fdur [REPOSITORY]`
A very specific example, yet the one I think will be the most used. It's assumed that `token` and `owner` are set in the [config](#labeler--c)!
- `-f`: Ignore user confirmation
- `-d`: Delete all labels from repository
- `-u`: Upload custom labels to repository
- `-r`: Specify the repository

Example: `labeler -fdur Labeler`

#### `labeler -H [HOST]`
In case you're using a custom host (for example a GitHub Enterprise host), use this flag to specify it. You may as well save the host in the [config](#labeler--c).

Example: `labeler -fdur Labeler -H github.yourhost.com`

## `labels.json`
This is the file where all your custom labels are stored. Feel free to edit it. Run `labeler -p` to get the path. Just keep in mind it has to have the following structure:
```
{
    "labels": [
        {
            "name": "Label name",
            "color": "FC271E",
            "description": "Label Description."
        },
        ...
    ]
}
```
