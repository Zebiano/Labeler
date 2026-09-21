// Import: Packages
import { blue, bold, green, greenBright, red, yellow } from 'yoctocolors'

/* --- Functions --- */
// Each function takes an optional 'exit'. Passing true ends the process, so the
// overloads below type that call as 'never' and let callers narrow after it.
// process.exit() is always called without a code, so that it honours process.exitCode.

// Info
export function info(msg: string, exit: true): never
export function info(msg: string, exit?: boolean): void
export function info(msg: string, exit?: boolean): void {
  console.log(bold(blue("Info: ")) + msg)
  if (exit) process.exit()
}

// Tip
export function tip(msg: string, exit: true): never
export function tip(msg: string, exit?: boolean): void
export function tip(msg: string, exit?: boolean): void {
  console.log(bold(green("Tip: ")) + msg)
  if (exit) process.exit()
}

// Success
export function success(msg: string, exit: true): never
export function success(msg: string, exit?: boolean): void
export function success(msg: string, exit?: boolean): void {
  console.log(bold(green("Success: ")) + msg)
  if (exit) process.exit()
}

// Warning
export function warning(msg: string, exit: true): never
export function warning(msg: string, exit?: boolean): void
export function warning(msg: string, exit?: boolean): void {
  console.log(bold(yellow("Warning: ")) + msg)
  if (exit) process.exit()
}

// Abort
export function abort(msg: string, exit: true): never
export function abort(msg: string, exit?: boolean): void
export function abort(msg: string, exit?: boolean): void {
  console.log(bold(red("Abort: ")) + msg)
  if (exit) process.exit()
}

// Error
// Marks the run as failed, so the process exits with 1 however it ends. Most errors are
// followed by a tip that does the exiting, and a failed label lets the rest carry on
export function error(msg: string, exit: true): never
export function error(msg: string, exit?: boolean): void
export function error(msg: string, exit?: boolean): void {
  console.log(bold(red("Error: ")) + msg)
  process.exitCode = 1
  if (exit) process.exit()
}

// Upload
export function upload(msg: string, exit: true): never
export function upload(msg: string, exit?: boolean): void
export function upload(msg: string, exit?: boolean): void {
  console.log(bold(greenBright("Upload: ")) + msg)
  if (exit) process.exit()
}

// Delete
export function remove(msg: string, exit: true): never
export function remove(msg: string, exit?: boolean): void
export function remove(msg: string, exit?: boolean): void {
  console.log(bold(red("Delete: ")) + msg)
  if (exit) process.exit()
}

// Skip
export function skip(msg: string, exit: true): never
export function skip(msg: string, exit?: boolean): void
export function skip(msg: string, exit?: boolean): void {
  console.log(bold(blue("Skip: ")) + msg)
  if (exit) process.exit()
}

// Owner
export function owner(msg: string, exit: true): never
export function owner(msg: string, exit?: boolean): void
export function owner(msg: string, exit?: boolean): void {
  console.log(bold(blue("Owner: ")) + msg)
  if (exit) process.exit()
}

// Repository
export function repository(msg: string, exit: true): never
export function repository(msg: string, exit?: boolean): void
export function repository(msg: string, exit?: boolean): void {
  console.log(bold(blue("Repository: ")) + msg)
  if (exit) process.exit()
}
