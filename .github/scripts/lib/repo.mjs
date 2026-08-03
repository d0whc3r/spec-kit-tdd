// Repository location and release-URL helpers shared by the pipeline scripts.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "zx";

// This file lives at <root>/.github/scripts/lib/repo.mjs, so the repo root is
// three directories up.
export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// Absolute path to a repo-relative file.
export const fromRoot = (rel) => path.join(repoRoot, rel);

// owner/repo slug. Prefers GITHUB_REPOSITORY (set in CI); falls back to the
// `origin` git remote so the scripts also work locally. Accepts both
// git@host:owner/repo(.git) and https://host/owner/repo(.git).
export async function resolveRepoSlug() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const url = (await $({ cwd: repoRoot })`git remote get-url origin`.nothrow()).stdout.trim();
  if (!url) {
    throw new Error("GITHUB_REPOSITORY not set and no git remote 'origin' found");
  }
  return url.replace(/\.git$/, "").replace(/^.*[:/]([^/]+\/[^/]+)$/, "$1");
}

// Canonical release download URL for a given version + tag.
export function downloadUrl(slug, version, tag = `v${version}`) {
  return `https://github.com/${slug}/releases/download/${tag}/tdd-${version}.zip`;
}

// True when the module at `metaUrl` is the process entrypoint (run directly via
// `node x.mjs`), false when it was imported by another module. Lets each script
// export its main() yet still run standalone.
export const isMain = (metaUrl) =>
  Boolean(process.argv[1]) && path.resolve(process.argv[1]) === fileURLToPath(metaUrl);
