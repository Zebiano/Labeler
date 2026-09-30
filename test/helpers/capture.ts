// Import: Packages
import { inspect, stripVTControlCharacters } from 'node:util'

/* --- Types --- */
/** What a captured run printed, and how it ended */
export interface Run {
  /** One entry per console.log call, with colour codes stripped */
  lines: string[]
  /** The same output as one string */
  text: string
  /** Whether the run called process.exit() */
  exited: boolean
  /** The exit code the run left behind */
  exitCode: number | undefined
}

/** Thrown in place of process.exit, which would otherwise end the test runner */
class ExitSignal extends Error { }

/* --- Functions --- */
/**
 * Runs an action with console.log and process.exit captured.
 * @param action What to run
 * @returns Its output and exit
 */
export async function capture(action: () => unknown): Promise<Run> {
  const lines: string[] = []
  const log = console.log
  const exit = process.exit
  const previousCode = process.exitCode
  let exited = false
  let codeAtExit: typeof process.exitCode

  /* Anything printed after the exit is an artefact of the stub below, since the real
     process.exit would have ended the run there */
  console.log = (...args: unknown[]): void => {
    if (exited) return
    const line = args.map(arg => typeof arg == 'string' ? arg : inspect(arg)).join(' ')
    lines.push(stripVTControlCharacters(line))
  }

  /* Throwing is the closest a stub can get to a call that never returns. Code that catches
     broadly, such as the request helper in lib/github.ts, swallows it and carries on, which is
     why the exit is recorded here rather than inferred from the output */
  process.exit = ((): never => {
    if (!exited) {
      exited = true
      codeAtExit = process.exitCode
    }
    throw new ExitSignal()
  }) as typeof process.exit

  try {
    await action()
  } catch (error) {
    if (!(error instanceof ExitSignal)) throw error
  } finally {
    console.log = log
    process.exit = exit
  }

  /* The runner reports its own failures through process.exitCode, so put back whatever it had
     rather than clearing it */
  const exitCode = exited ? codeAtExit : process.exitCode
  process.exitCode = previousCode
  return { lines, text: lines.join('\n'), exited, exitCode: typeof exitCode == 'number' ? exitCode : undefined }
}
