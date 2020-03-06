// Requires: Packages
const clear = require('clear')
const chalk = require('chalk')

// "You need to specify the " + key + "! You can also save it in the config to set it as default by running labeler -c."

/* --- Functions --- */
function success(msg) {
    console.log(msg)
}

function warning(msg) {
    console.log(msg)
}

function error(msg, exit) {
    console.log("ERROR: " + msg)
    if (exit) process.exit()
}

// Exports
module.exports = {
    success: success,
    warning: warning,
    error: error
}