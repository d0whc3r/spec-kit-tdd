// Run oxfmt over files a script just wrote, so pipeline-generated files stay
// formatted even when the husky pre-commit hook is disabled (CI sets HUSKY=0).

import path from "node:path";
import { $ } from "zx";
import { repoRoot } from "./repo.mjs";

const oxfmt = path.join(repoRoot, "node_modules/.bin/oxfmt");

export async function format(...files) {
  if (files.length === 0) return;
  await $({ cwd: repoRoot })`${oxfmt} --write ${files}`;
}
