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
  <!-- <a href="#usage" alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Passing-green.svg"></img></a> -->
  <!-- <a alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Partial-orange.svg"></img></a> -->
  <!-- <a alt="CLI Status"><img src="https://img.shields.io/badge/CLI-Failing-red.svg"></img></a> -->
</div>

> [!IMPORTANT]
> Labeler has been ported to TypeScript and has undergone various changes with the v6 release, some of them breaking! Please refer to the changelog for more details, including instructions on how to migrate.

## Why?

Because I was sick of always deleting the default labels and uploading my own ones.

## How?

By storing custom labels in a `labels.json` file, deleting the default ones from the repository and uploading those from said file.

## Installation

`labeler` requires Node.js 22 (22.13.0 or newer), 24 or 26.

```sh
npm install --global labeler
```

## Usage

```text
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

    -v, --version
        Display the version number.

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
```

I've tried my best to create a tool for everyone! If you prefer using flags, feel free to run `labeler -t [TOKEN] -o [OWNER] -r [REPOSITORY] -du`. If you fancy writing less, run `labeler -c` and save your values. Those will be your default ones (unless overridden by a flag).

`labeler` comes with some predefined labels, but you can of course use your own. By running  `labeler -en`, you'll start a fresh new file. The `path` to the file will be in the terminal, in case you prefer to open and edit it with your editor of choice.

## Authentication

`labeler` works on GitHub on your behalf, so it needs a personal access token. Use a fine-grained token, which you can limit to the repositories and permissions `labeler` actually needs:

1. Open the [fine-grained token form](https://github.com/settings/personal-access-tokens/new?name=Labeler&description=Manages+repository+labels+with+labeler&issues=write). It fills in the name and the permission for you.
   1. On GitHub Enterprise Server (3.17 or newer), that link won't work. Open `https://<YOUR-HOST>/settings/personal-access-tokens/new` instead and follow the same steps.
2. Set "Permissions -> Issues" to "Read and write".
3. Customize other fields to your liking.
   1. If the repositories belong to an organization, choose it as "Resource owner". A token only works for one owner.
   2. Bulk updates (`-b`) change every repository in the organization, so they need "All repositories".
4. Generate the token, then save it with `labeler -c` or pass it with `-t`.

If you prefer, you can also make use of "Tokens (classic)", but they can't be limited to specific repositories. [Create one](https://github.com/settings/tokens/new) called "Labeler" with a single scope:

- `public_repo` if every repository you want to label is public.
- `repo` if any of them is private.

If the repositories belong to an organization that uses SAML single sign-on, [authorize the token](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-single-sign-on/authorizing-a-personal-access-token-for-use-with-single-sign-on) for it afterwards.

<details>
<summary>Why these permissions?</summary>

These are all the requests `labeler` makes:

| What `labeler` does                        | Request                                      | Fine-grained permission | Classic scope                                     |
| ------------------------------------------ | -------------------------------------------- | ----------------------- | ------------------------------------------------- |
| Read a repository's labels (`-d`)          | `GET /repos/{owner}/{repo}/labels`           | Issues: read            | `public_repo`, or `repo` for private repositories |
| Create labels (`-u`)                       | `POST /repos/{owner}/{repo}/labels`          | Issues: write           | `public_repo`, or `repo` for private repositories |
| Delete labels (`-d`)                       | `DELETE /repos/{owner}/{repo}/labels/{name}` | Issues: write           | `public_repo`, or `repo` for private repositories |
| List an organization's repositories (`-b`) | `GET /orgs/{org}/repos`                      | Metadata: read          | None, or `repo` to include private repositories   |

</details>

## Commands
### `labeler -c`

Interactive CLI for the config. I recommend running this as your first command and setting the `token` and `owner`, as they will probably not change that often. If you want to remove an entry, simply enter nothing when asked.

- **token**: Personal access token. See "[Authentication](#authentication)" for which kind to create and the permissions it needs.
- **owner**: Also known as the username. In [my case](https://github.com/Zebiano) it's `Zebiano` for example.
- **repository**: Name of the repository. As an example, this repo would be `labeler`. It is **not recommended** to set this setting as it may cause non-intentional deletions of labels.
- **host**: Custom host, useful for GitHub Enterprise Instances. For example `github.yourhost.com`.
- **apiVersion**: GitHub REST API version to use for github.com. You should rarely need this, as Labeler already uses the latest stable version, for example `2026-03-10`.
- **enterpriseApiVersion**: GitHub REST API version to use for GitHub Enterprise hosts. Defaults to `2022-11-28`, which every supported GitHub Enterprise Server release understands. If your instance runs 3.22 or newer, you can set it to `2026-03-10`.

In case you need to access a repository from another owner, simply run the `-o [OWNER]` flag and the one stored in the config will be ignored.

### `labeler -n`

An interactive CLI to help you add new Labels to the `labels.json` file. You'll be asked wether you want to start a new file, or add labels to the already existing one. It also shows the `path`.
- **name**: Name of label.
  - *Example:* `Bug :beetle:`
- **description**: (Optional) Description of label.
  - *Example:* `This is a bug.`
- **color**: Hex color of label.
  - *Example:* `FC271E`

Alternatively, run `labeler -en`. This way, every label inside the `labels.json` file will be removed first.

*Note:* Running `labeler -fn` will bypass the question, which defaults to "keep file as is".

### `labeler -fdur [REPOSITORY]`

A very specific example, yet the one I think will be the most used. It's assumed that `token` and `owner` are set in the [config](#labeler--c)!
- `-f`: Ignore user confirmation
- `-d`: Delete all labels from repository
- `-u`: Upload custom labels to repository
- `-r`: Specify the repository

Example: `labeler -fdur Labeler`

### `labeler -H [HOST]`

In case you're using a custom host (for example a GitHub Enterprise host), use this flag to specify it. You may as well save the host in the [config](#labeler--c).

Example: `labeler -fdur Labeler -H github.yourhost.com`

## `labels.json`

This is the file where all your custom labels are stored. Feel free to edit it. Run `labeler -p` to get the path. Just keep in mind it has to have the following structure:

```json
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
