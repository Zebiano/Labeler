#!/bin/bash

# --- Variables --- #

# --- Functions --- #
# Shows the help "page"
function echoHelp() {
    echo "NAME"
    echo "  ./$(basename "$0") - Label manager for GitHub repositories."
    echo
    echo "SYNOPSIS"
    echo "  ./$(basename "$0") [OPTIONS]"
    echo
    echo "DESCRIPTION"
    echo "  Runs a script that manages labels in GitHub repositories."
    echo "  Runs a script that is able to create and delete labels in GitHub repositories."
    echo
    echo "OPTIONS"
    echo "  -d"
    echo "      Deletes all existing labels in repository."
    echo
    echo "  -h"
    echo "      Display this help page and exit."
    echo
    echo "  -l"
    echo "      Launches interactive cli to store a new lable locally."
    echo
    echo "  -r"
    echo "      Deletes every label in the repo and creates every label stored in labels.csv."
    echo
    echo "EXAMPLES"
    echo "  Run script with custom input and output file names:"
    echo "      ./langtexte.sh -i \"input.csv\" -o \"output.csv\""
    echo
}

# Gets every label
function getAll() {
    echo "hia"
}

# Gets one label
function getOne() {
    echo "hia"
}

# Creates one label
function createOne() {
    echo "hia"
}

# Deletes one label
function deleteOne() {
    getAll
    # delete them
}

# --- Script Start --- #
clear

# Checks if the script got executed with optional flags
while getopts "hd" "option"; do
    case "${option}" in
    'h')
        echoHelp
        exit
        ;;
    'd')
        deleteLabels
        ;;
    *)
        # Anything else
        echo
        echoHelp
        exit
        ;;
    esac
done
