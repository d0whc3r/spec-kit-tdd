// Bump extension.yml#extension.version and promote the CHANGELOG.md
// "Unreleased" section to a versioned, dated section. After this runs the
// working tree is dirty with a coherent set of changes ready to commit + tag.
//
// Usage: node bump-version.mjs <new_version>   (semver, no leading v)

import { fs } from "zx";
import { fromRoot, isMain } from "./lib/repo.mjs";
import { PATHS, readExtension, setExtensionVersion } from "./lib/manifest.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("bump-version");
const CHANGELOG = fromRoot("CHANGELOG.md");

export function bumpVersion(next) {
  if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(next ?? "")) {
    log.die(`not a valid semver: ${next}`);
  }
  if (!fs.existsSync(PATHS.extension) || !fs.existsSync(CHANGELOG)) {
    log.die("run from the repo root (extension.yml + CHANGELOG.md required)");
  }

  const current = readExtension().extension?.version;
  if (current === next) {
    log.die(`extension.yml already at ${next} (no-op)`);
  }

  const date = new Date().toISOString().slice(0, 10);

  const ext = fs.readFileSync(PATHS.extension, "utf8");
  fs.writeFileSync(PATHS.extension, setExtensionVersion(ext, next));

  const changelog = fs.readFileSync(CHANGELOG, "utf8");
  const needle = "## [Unreleased]";
  if (!changelog.includes(needle)) {
    log.die("'## [Unreleased]' section not found in CHANGELOG.md");
  }
  const replacement = `## [Unreleased]\n\n### Added\n\n- (none yet)\n\n## [${next}] - ${date}`;
  fs.writeFileSync(CHANGELOG, changelog.replace(needle, replacement));

  log.ok(`extension.yml -> ${next}, CHANGELOG promoted with date ${date}`);
}

if (isMain(import.meta.url)) {
  const [next] = process.argv.slice(2);
  if (!next) log.die("usage: bump-version.mjs <new_version>");
  bumpVersion(next);
}
