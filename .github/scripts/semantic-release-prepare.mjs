// Called by semantic-release (@exec prepareCmd). Orchestrates the release
// preparation by combining the specialized modules:
//   1. bump extension.yml + package.json versions
//   2. sync identity fields from package.json into the manifests
//   3. bump the pinned release URL across docs + website, and the header badge
//   4. build the deterministic zip
//   5. update catalog.json
//
// Usage: node semantic-release-prepare.mjs <version>

import { $, fs } from "zx";
import { repoRoot, fromRoot, downloadUrl, isMain } from "./lib/repo.mjs";
import { PATHS, setExtensionVersion } from "./lib/manifest.mjs";
import { syncMetadata } from "./sync-metadata.mjs";
import { buildZip } from "./build-zip.mjs";
import { updateCatalog } from "./update-catalog.mjs";
import { format } from "./lib/format.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("semantic-release-prepare");

// Pinned release archive URL: …/releases/download/vX.Y.Z/tdd-X.Y.Z.zip
const PINNED_URL =
  /https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/download\/v\d+\.\d+\.\d+\/tdd-\d+\.\d+\.\d+\.zip/g;
const PINNED_URL_FILES = [
  "README.md",
  "WORKFLOW.md",
  "docs/Getting-Started.md",
  "docs/FAQ.md",
  "docs/Troubleshooting.md",
  "web/index.html",
];
// Website header badge: <span class="brand-version">vX.Y.Z</span>
const BADGE = /(<span class="brand-version">v)\d+\.\d+\.\d+(<\/span>)/g;

export async function prepare(version) {
  if (!version) log.die("version argument required");
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) log.die("GITHUB_REPOSITORY not set");
  const url = downloadUrl(repo, version);

  // extension.yml version (targeted edit, keeps formatting)
  const ext = fs.readFileSync(PATHS.extension, "utf8");
  fs.writeFileSync(PATHS.extension, setExtensionVersion(ext, version));
  log.ok(`extension.yml version -> ${version}`);

  // package.json version (pnpm keeps the file formatted)
  await $({ cwd: repoRoot })`pnpm pkg set version=${version}`;
  log.ok(`package.json version -> ${version}`);

  // identity fields (description, author, homepage, repository, license, tags)
  await syncMetadata();

  // pinned release URL across docs + website
  for (const rel of PINNED_URL_FILES) {
    const file = fromRoot(rel);
    const src = fs.readFileSync(file, "utf8");
    if (src.match(PINNED_URL)) {
      fs.writeFileSync(file, src.replace(PINNED_URL, url));
      log.ok(`${rel} direct-install URL -> ${url}`);
    } else {
      log.warn(`${rel} no pinned URL found, skipped`);
    }
  }

  // website header version badge
  const indexPath = fromRoot("web/index.html");
  const index = fs.readFileSync(indexPath, "utf8");
  if (index.match(BADGE)) {
    fs.writeFileSync(indexPath, index.replace(BADGE, `$1${version}$2`));
    log.ok(`web/index.html header badge -> v${version}`);
  } else {
    log.warn("web/index.html no header version badge found, skipped");
  }

  // keep the version-bumped package.json formatted alongside the rest
  await format(PATHS.pkg);

  // build the deterministic zip, then update the catalog
  await buildZip();
  await updateCatalog({ version, downloadUrl: url });
}

if (isMain(import.meta.url)) {
  const [version] = process.argv.slice(2);
  await prepare(version);
}
