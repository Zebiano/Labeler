// Import: Packages
import Chalk from 'chalk'

/* --- Functions --- */
// Info
export function info(msg, exit) {
  console.log(Chalk.blue.bold("Info: ") + msg)
  if (exit) process.exit()
}

// Tip
export function tip(msg, exit) {
  console.log(Chalk.green.bold("Tip: ") + msg)
  if (exit) process.exit()
}

// Success
export function success(msg, exit) {
  console.log(Chalk.green.bold("Success: ") + msg)
  if (exit) process.exit()
}

// Warning
export function warning(msg, exit) {
  console.log(Chalk.yellow.bold("Warning: ") + msg)
  if (exit) process.exit()
}

// Abort
export function abort(msg, exit) {
  console.log(Chalk.red.bold("Abort: ") + msg)
  if (exit) process.exit()
}

// Error
export function error(msg, exit) {
  console.log(Chalk.red.bold("Error: ") + msg)
  if (exit) process.exit()
}

// Upload
export function upload(msg, exit) {
  console.log(Chalk.greenBright.bold("Upload: ") + msg)
  if (exit) process.exit()
}

// Delete
export function remove(msg, exit) {
  console.log(Chalk.red.bold("Delete: ") + msg)
  if (exit) process.exit()
}

// Skip
export function skip(msg, exit) {
  console.log(Chalk.blue.bold("Skip: ") + msg)
  if (exit) process.exit()
}

// Owner
export function owner(msg, exit) {
  console.log(Chalk.blue.bold("Owner: ") + msg)
  if (exit) process.exit()
}

// Repository
export function repository(msg, exit) {
  console.log(Chalk.blue.bold("Repository: ") + msg)
  if (exit) process.exit()
}
