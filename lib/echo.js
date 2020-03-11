// Requires: Packages
const clear = require('clear')
const chalk = require('chalk')

/* --- Functions --- */
// Info
function info(msg, exit) {
    console.log(chalk.blue("[INFO] ") + msg)
    if (exit) process.exit()
}

// Tip
function tip(msg, exit) {
    console.log(chalk.green("[TIP] ") + msg)
    if (exit) process.exit()
}

// Success
function success(msg, exit) {
    console.log(chalk.green("[SUCCESS] ") + msg)
    if (exit) process.exit()
}

// Warning
function warning(msg, exit) {
    console.log(chalk.yellow("[WARNING] ") + msg)
    if (exit) process.exit()
}

// Error
function error(msg, exit) {
    console.log(chalk.red("[ERROR] ") + msg)
    if (exit) process.exit()
}

// Exports
module.exports = {
    info: info,
    success: success,
    warning: warning,
    error: error,
    tip: tip
}