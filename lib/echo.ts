// Import: Packages
import { blue, bold, green, greenBright, red, yellow } from 'yoctocolors'

/* --- Types --- */
/**
 * Prints a message, and ends the process when 'exit' is true. That call is typed as 'never' so
 * callers can narrow after it, which only works while every export below is annotated.
 */
type Printer = {
  (msg: string, exit: true): never
  (msg: string, exit?: boolean): void
}

/* --- Helpers --- */
/**
 * Builds a printer. It exits without a code, so that process.exitCode is honoured.
 * @param label Coloured prefix put before every message
 * @param failure Whether printing marks the run as failed
 * @returns The printer
 */
function printer(label: string, failure = false): Printer {
  return ((msg: string, exit?: boolean) => {
    console.log(label + msg)
    if (failure) process.exitCode = 1
    if (exit) process.exit()
  }) as Printer
}

/* --- Printers --- */
export const info: Printer = printer(bold(blue('Info: ')))
export const tip: Printer = printer(bold(green('Tip: ')))
export const success: Printer = printer(bold(green('Success: ')))
export const warning: Printer = printer(bold(yellow('Warning: ')))
export const abort: Printer = printer(bold(red('Abort: ')))
/** Marks the run as failed, so it exits with 1 however it ends, even through a later tip */
export const error: Printer = printer(bold(red('Error: ')), true)
export const upload: Printer = printer(bold(greenBright('Upload: ')))
export const remove: Printer = printer(bold(red('Delete: ')))
export const skip: Printer = printer(bold(blue('Skip: ')))
export const owner: Printer = printer(bold(blue('Owner: ')))
export const repository: Printer = printer(bold(blue('Repository: ')))
