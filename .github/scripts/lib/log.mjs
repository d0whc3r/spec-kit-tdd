// Consistent, scoped logging for the pipeline scripts.
//
//   const log = logger("validate-manifest");
//   log.ok("everything checks out");   // -> stdout: [validate-manifest] OK: …
//   log.die("missing manifest");        // -> stderr: [validate-manifest] FAIL: … + exit 1
//
// Diagnostics go to stderr; OK/info go to stdout, matching the bash scripts
// these replaced (renderers write their real output to files, never stdout).

import { chalk } from "zx";

export function logger(scope) {
  const tag = `[${scope}]`;
  return {
    ok: (msg) => console.log(`${chalk.green(tag)} OK: ${msg}`),
    info: (msg) => console.log(`${tag} ${msg}`),
    warn: (msg) => console.error(`${chalk.yellow(tag)} WARN: ${msg}`),
    fail: (msg) => console.error(`${chalk.red(tag)} FAIL: ${msg}`),
    die: (msg) => {
      console.error(`${chalk.red(tag)} FAIL: ${msg}`);
      process.exit(1);
    },
  };
}
