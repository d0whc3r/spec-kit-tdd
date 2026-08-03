// Pipeline: update catalog.json on every successful release.
//
// Updates only the pipeline-owned fields: version, download_url,
// requires.speckit_version, updated_at, and created_at (only when empty).
// Identity fields are owned by sync-metadata.mjs and left untouched here.
//
// Usage: node update-catalog.mjs <version> <download_url>

import { PATHS, readJson, writeJson, readExtension } from "./lib/manifest.mjs";
import { format } from "./lib/format.mjs";
import { isMain } from "./lib/repo.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("update-catalog");

// UTC ISO timestamp without milliseconds (matches the existing entries).
const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

export async function updateCatalog({ version, downloadUrl }) {
  if (!version || !downloadUrl) {
    throw new Error("updateCatalog requires { version, downloadUrl }");
  }

  const speckitVersion = readExtension().requires?.speckit_version;
  if (!speckitVersion) {
    throw new Error("requires.speckit_version missing from extension.yml");
  }

  const catalog = readJson(PATHS.catalog);
  const now = nowIso();

  catalog.version = version;
  catalog.download_url = downloadUrl;
  catalog.requires = { ...catalog.requires, speckit_version: speckitVersion };
  catalog.updated_at = now;
  if (!catalog.created_at) catalog.created_at = now;

  writeJson(PATHS.catalog, catalog);
  await format(PATHS.catalog);
  log.ok(`version=${version} download_url=${downloadUrl}`);
}

if (isMain(import.meta.url)) {
  const [version, downloadUrl] = process.argv.slice(2);
  if (!version || !downloadUrl) {
    log.die("usage: update-catalog.mjs <version> <download_url>");
  }
  await updateCatalog({ version, downloadUrl });
}
