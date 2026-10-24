// Pipeline: update catalog.json on every successful release.
//
// Updates only the pipeline-owned fields: version, download_url, sha256 (of
// the release zip; Spec Kit verifies it before install),
// requires.speckit_version, updated_at, and created_at (only when empty).
// Identity fields are owned by sync-metadata.mjs and left untouched here.
//
// Usage: node update-catalog.mjs <version> <download_url> [zip]
//   zip defaults to dist/tdd-<version>.zip

import { createHash } from "node:crypto";
import { fs } from "zx";
import { PATHS, readJson, writeJson, readExtension } from "./lib/manifest.mjs";
import { format } from "./lib/format.mjs";
import { fromRoot, isMain } from "./lib/repo.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("update-catalog");

// UTC ISO timestamp without milliseconds (matches the existing entries).
const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

export async function updateCatalog({ version, downloadUrl, zipPath }) {
  if (!version || !downloadUrl || !zipPath) {
    throw new Error("updateCatalog requires { version, downloadUrl, zipPath }");
  }

  const speckitVersion = readExtension().requires?.speckit_version;
  if (!speckitVersion) {
    throw new Error("requires.speckit_version missing from extension.yml");
  }

  const sha256 = createHash("sha256").update(fs.readFileSync(zipPath)).digest("hex");
  const catalog = readJson(PATHS.catalog);
  const now = nowIso();

  catalog.version = version;
  catalog.download_url = downloadUrl;
  catalog.requires = { ...catalog.requires, speckit_version: speckitVersion };
  catalog.updated_at = now;
  if (!catalog.created_at) catalog.created_at = now;

  // Keep sha256 right after download_url, where the upstream catalog puts it.
  const entries = Object.entries(catalog).filter(([key]) => key !== "sha256");
  const at = entries.findIndex(([key]) => key === "download_url") + 1;
  entries.splice(at, 0, ["sha256", sha256]);

  writeJson(PATHS.catalog, Object.fromEntries(entries));
  await format(PATHS.catalog);
  log.ok(`version=${version} download_url=${downloadUrl} sha256=${sha256}`);
}

if (isMain(import.meta.url)) {
  const [version, downloadUrl, zip] = process.argv.slice(2);
  if (!version || !downloadUrl) {
    log.die("usage: update-catalog.mjs <version> <download_url> [zip]");
  }
  const zipPath = zip ?? fromRoot(`dist/tdd-${version}.zip`);
  await updateCatalog({ version, downloadUrl, zipPath });
}
