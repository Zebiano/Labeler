// Require: Packages
const chalk = require('chalk')
const chalkRainbow = require('chalk-rainbow')

/* --- Functions --- */
// Info
function info(msg, exit) {
    console.log(chalk.blue.bold("Info: ") + msg)
    if (exit) process.exit()
}

// Tip
function tip(msg, exit) {
    console.log(chalk.green.bold("Tip: ") + msg)
    if (exit) process.exit()
}

// Success
function success(msg, exit) {
    console.log(chalk.green.bold("Success: ") + msg)
    if (exit) process.exit()
}

// Warning
function warning(msg, exit) {
    console.log(chalk.yellow.bold("Warning: ") + msg)
    if (exit) process.exit()
}

// Abort
function abort(msg, exit) {
    console.log(chalk.red.bold("Abort: ") + msg)
    if (exit) process.exit()
}

// Error
function error(msg, exit) {
    console.log(chalk.red.bold("Error: ") + msg)
    if (exit) process.exit()
}

// Upload
function upload(msg, exit) {
    console.log(chalk.greenBright.bold("Upload: ") + msg)
    if (exit) process.exit()
}

// Delete
function remove(msg, exit) {
    console.log(chalk.red.bold("Delete: ") + msg)
    if (exit) process.exit()
}

// Skip
function skip(msg, exit) {
    console.log(chalk.blue.bold("Skip: ") + msg)
    if (exit) process.exit()
}

// Owner
function owner(msg, exit) {
    console.log(chalk.blue.bold("Owner: ") + msg)
    if (exit) process.exit()
}

// Repository
function repository(msg, exit) {
    console.log(chalk.blue.bold("Repository: ") + msg)
    if (exit) process.exit()
}

// Rainbow
function rainbow() {
    console.log(chalkRainbow("https://media.giphy.com/media/10hO3rDNqqg2Xe/giphy.gif?YouActuallyFoundOut=ThatsAmazing!?LetMeKnowYoureSpecial=http://discordapp.com/users/241655863616471041"))
    process.exit()
}

// Exports
module.exports = {
    info: info,
    success: success,
    warning: warning,
    error: error,
    tip: tip,
    abort: abort,
    upload: upload,
    remove: remove,
    skip: skip,
    owner: owner,
    repository: repository,
    rainbow: rainbow
}
