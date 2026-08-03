// Sync the shared identity fields from package.json (the single source of
// truth) into the extension manifests. Run by the release pipeline and exposed
// as `pnpm run sync`.
//
// package.json owns: description, author, homepage, repository, license,
// keywords (mapped to the catalog `tags`). They are written into extension.yml
// and catalog.json. Catalog "name" / extension "id"/"name" are structural and
// NOT synced; pipeline-owned fields (version, download_url, requires, provides,
// timestamps) are left untouched.
//
// Usage:
//   node sync-metadata.mjs           # write synced values into the manifests
//   node sync-metadata.mjs --check   # exit non-zero if a manifest is out of
//                                    # sync (compares values, not formatting)

import { isMain } from "./lib/repo.mjs";
import { syncManifests } from "./lib/manifest.mjs";
import { format } from "./lib/format.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("sync-metadata");

export async function syncMetadata({ check = false } = {}) {
  const { drift, written } = syncManifests({ check });

  if (check) {
    if (drift.length) {
      log.fail(`out of sync with package.json: ${drift.join(", ")}`);
      log.fail("run `pnpm run sync` to fix");
      return false;
    }
    log.ok("all manifests in sync with package.json");
    return true;
  }

  if (written.length) {
    await format(...written);
    for (const f of written) log.ok(`synced ${f} from package.json`);
  } else {
    log.ok("manifests already in sync with package.json");
  }
  return true;
}

if (isMain(import.meta.url)) {
  const check = process.argv.includes("--check");
  const passed = await syncMetadata({ check });
  if (!passed) process.exit(1);
}
