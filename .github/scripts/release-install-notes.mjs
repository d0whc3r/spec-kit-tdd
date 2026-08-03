// Prepends an "Install v<version>" block to the GitHub release that
// semantic-release just published. CHANGELOG.md keeps only the commit-based
// notes; the install instructions live solely on the release page.
//
// Everything comes from catalog.json, which prepare bumped and the release
// commit already carries: version, download_url, description,
// requires.speckit_version, homepage, documentation.
//
// Runs after semantic-release publishes (CI step); needs gh + GITHUB_TOKEN.
//
// Usage: node release-install-notes.mjs

import { $, fs } from "zx";
import { repoRoot, fromRoot, isMain } from "./lib/repo.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("release-install-notes");

export function installBlock(catalog) {
  return [
    `## Install v${catalog.version}`,
    "",
    catalog.description,
    "",
    `Add it to your Spec Kit project (requires Spec Kit \`${catalog.requires.speckit_version}\`):`,
    "",
    "```bash",
    `specify extension add tdd --from ${catalog.download_url}`,
    "```",
    "",
    `Then run \`/speckit.tdd.setup\` once, and \`/speckit.tdd.plan\` on your current feature. Docs: ${catalog.homepage} | Wiki: ${catalog.documentation}`,
  ].join("\n");
}

export async function addInstallNotes() {
  const catalog = JSON.parse(fs.readFileSync(fromRoot("catalog.json"), "utf8"));
  const tag = `v${catalog.version}`;

  const block = installBlock(catalog);
  const current = (
    await $({ cwd: repoRoot })`gh release view ${tag} --json body --jq .body`
  ).stdout.trimEnd();
  const body = current ? `${block}\n\n---\n\n${current}` : block;

  await $({ cwd: repoRoot })`gh release edit ${tag} --notes ${body}`;
  log.ok(`prepended install block to ${tag}`);
}

if (isMain(import.meta.url)) {
  await addInstallNotes();
}
