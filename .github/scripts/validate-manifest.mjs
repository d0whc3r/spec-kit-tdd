// Pipeline gate: validate an extension root's extension.yml.
//
// Asserts:
//   - schema_version present
//   - extension.id === "tdd"
//   - extension.version present, and equals the release version on a tag run
//     (RELEASE_VERSION env, or a refs/tags/v* GITHUB_REF)
//   - all required runtime files exist and are non-empty
//
// Usage:
//   node validate-manifest.mjs                 # validate the repo root
//   node validate-manifest.mjs --root <path>   # validate another root (an
//                                              # unpacked zip, say)

import path from "node:path";
import { fs, YAML, argv } from "zx";
import { repoRoot, isMain } from "./lib/repo.mjs";
import { readJson } from "./lib/manifest.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("validate-manifest");

// CHANGELOG.md lives at the repo root for release notes but is excluded from
// the zip, so it is not required here.
const REQUIRED = [
  "extension.yml",
  "README.md",
  "LICENSE",
  "commands/speckit.tdd.setup.md",
  "commands/speckit.tdd.plan.md",
  "commands/speckit.tdd.run.md",
  "commands/speckit.tdd.verify.md",
  "templates/tdd-loop-playbook.md",
  "templates/tdd-test-list-template.md",
  "templates/tdd-stack-profile.md",
  "templates/tdd-test-quality-rubric.md",
];

// Returns true on success, false on any failure (logging each problem).
export function validateManifest({ root = repoRoot } = {}) {
  const manifestPath = path.join(root, "extension.yml");
  if (!fs.existsSync(manifestPath)) {
    log.fail(`${manifestPath} not found`);
    return false;
  }

  const manifest = YAML.parse(fs.readFileSync(manifestPath, "utf8"));
  let ok = true;

  if (!manifest.schema_version) {
    log.fail("schema_version missing");
    ok = false;
  }

  const id = manifest.extension?.id;
  if (id !== "tdd") {
    log.fail(`extension.id must be "tdd", got "${id ?? ""}"`);
    ok = false;
  }

  const version = manifest.extension?.version;
  if (!version) {
    log.fail("extension.version missing");
    ok = false;
  }

  // Tag/version equality — only when an explicit version is provided or the
  // workflow runs from a version tag. RELEASE_VERSION is used where
  // GITHUB_REF_NAME (a GitHub Actions built-in) cannot be overridden.
  const ref = process.env.RELEASE_VERSION || process.env.GITHUB_REF_NAME || "";
  const isTagRun =
    Boolean(process.env.RELEASE_VERSION) ||
    (process.env.GITHUB_REF || "").startsWith("refs/tags/v");
  if (isTagRun && version) {
    const expected = ref.replace(/^v/, "");
    if (version !== expected) {
      log.fail(`version mismatch: tag ${ref}, manifest ${version}`);
      ok = false;
    }
  }

  for (const rel of REQUIRED) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) {
      log.fail(`required file missing: ${file}`);
      ok = false;
    } else if (fs.statSync(file).size === 0) {
      log.fail(`required file empty: ${file}`);
      ok = false;
    }
  }

  // Cross-check catalog.json against extension.yml when present. catalog.json
  // is excluded from the release zip, so this runs for the repo root but is
  // skipped when validating an unpacked archive (which has no catalog.json).
  const catalogPath = path.join(root, "catalog.json");
  if (fs.existsSync(catalogPath)) {
    const catalog = readJson(catalogPath);

    if (catalog.version !== version) {
      log.fail(`catalog.json version ${catalog.version} != extension.yml version ${version}`);
      ok = false;
    }

    const cmdCount = manifest.provides?.commands?.length ?? 0;
    if (catalog.provides?.commands !== cmdCount) {
      log.fail(
        `catalog.json provides.commands ${catalog.provides?.commands} != extension.yml command count ${cmdCount}`,
      );
      ok = false;
    }

    // hooks are a top-level mapping keyed by lifecycle event, and an event may
    // carry either one hook mapping or a list of them, so count entries rather
    // than keys.
    const hookCount = Object.values(manifest.hooks ?? {}).reduce(
      (total, entry) => total + (Array.isArray(entry) ? entry.length : 1),
      0,
    );
    if (catalog.provides?.hooks !== hookCount) {
      log.fail(
        `catalog.json provides.hooks ${catalog.provides?.hooks} != extension.yml hook count ${hookCount}`,
      );
      ok = false;
    }

    const catalogSpeckit = catalog.requires?.speckit_version;
    const extSpeckit = manifest.requires?.speckit_version;
    if (catalogSpeckit !== extSpeckit) {
      log.fail(
        `catalog.json requires.speckit_version ${catalogSpeckit} != extension.yml ${extSpeckit}`,
      );
      ok = false;
    }
  }

  if (ok) log.ok(`id=${id} version=${version} root=${root}`);
  return ok;
}

if (isMain(import.meta.url)) {
  const root = argv.root ? path.resolve(argv.root) : repoRoot;
  if (!validateManifest({ root })) process.exit(1);
}
