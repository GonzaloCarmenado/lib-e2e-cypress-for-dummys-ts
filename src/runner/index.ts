import { startRunner, parseRunnerArgs } from './runner';

// CLI entry point (shipped as the package `bin`). Kept thin and side-effectful;
// the testable logic lives in ./runner.ts.
startRunner(parseRunnerArgs(process.argv.slice(2)));
