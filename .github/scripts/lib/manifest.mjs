// The manifest data layer: package.json is the single source of truth for the
// shared identity fields; this module reads it and propagates them into the
// extension manifests.
//
// Reads use YAML.parse / JSON.parse. Writes to extension.yml are targeted line
// edits so formatting and key order are preserved (the file has no comments but
// a full YAML round-trip would re-quote and reorder noisily). catalog.json is
// rewritten as JSON and formatted by the caller.

import { fs, YAML } from "zx";
import { fromRoot } from "./repo.mjs";

export const PATHS = {
  pkg: fromRoot("package.json"),
  extension: fromRoot("extension.yml"),
  catalog: fromRoot("catalog.json"),
};

// Identity fields owned by package.json and mirrored into the manifests.
// extension id/name are structural and intentionally NOT synced.
const IDENTITY_KEYS = ["description", "author", "homepage", "repository", "license", "tags"];

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

// --- JSON helpers ----------------------------------------------------------
export const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
export const writeJson = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");

export const readPkg = () => readJson(PATHS.pkg);

// package.json carries the repository as "git+https://….git"; the manifests
// use the plain browseable URL.
export const normalizeRepoUrl = (repo) =>
  String(repo?.url ?? repo ?? "")
    .replace(/^git\+/, "")
    .replace(/\.git$/, "");

export function identityFromPkg(pkg = readPkg()) {
  return {
    description: pkg.description,
    author: pkg.author,
    homepage: pkg.homepage,
    repository: normalizeRepoUrl(pkg.repository),
    license: pkg.license,
    tags: pkg.keywords ?? [],
  };
}

// --- extension.yml reads ---------------------------------------------------
export const readExtension = () => YAML.parse(fs.readFileSync(PATHS.extension, "utf8"));

// --- extension.yml targeted writes (preserve formatting) -------------------
// Scalar lines under the `extension:` block are indented two spaces.
export function setExtensionScalar(src, key, value, { quote = false } = {}) {
  const re = new RegExp(`^(  ${key}: ).*$`, "m");
  if (!re.test(src)) throw new Error(`extension.yml: '  ${key}:' not found`);
  return src.replace(re, `$1${quote ? `"${value}"` : value}`);
}

export const setExtensionVersion = (src, version) =>
  setExtensionScalar(src, "version", version, { quote: true });

// The top-level `tags:` list is the last block in the file.
export function setExtensionTags(src, tags) {
  const re = /^tags:\n(?:  - .*\n?)*/m;
  if (!re.test(src)) throw new Error("extension.yml: tags block not found");
  const block = "tags:\n" + tags.map((t) => `  - ${t}`).join("\n") + "\n";
  return src.replace(re, block);
}

// --- sync ------------------------------------------------------------------
// Returns { drift: string[], written: string[] }. In check mode nothing is
// written and `drift` lists the files that differ from package.json.
export function syncManifests({ check = false } = {}) {
  const want = identityFromPkg();
  const drift = [];
  const written = [];

  // catalog.json (JSON)
  const catalog = readJson(PATHS.catalog);
  if (!eq(pick(catalog, IDENTITY_KEYS), want)) {
    if (check) {
      drift.push("catalog.json");
    } else {
      Object.assign(catalog, want);
      writeJson(PATHS.catalog, catalog);
      written.push(PATHS.catalog);
    }
  }

  // extension.yml (YAML, targeted edits)
  let ext = fs.readFileSync(PATHS.extension, "utf8");
  const parsed = readExtension();
  const extActual = {
    ...pick(parsed.extension, IDENTITY_KEYS.slice(0, -1)),
    tags: parsed.tags,
  };
  if (!eq(extActual, want)) {
    if (check) {
      drift.push("extension.yml");
    } else {
      ext = setExtensionScalar(ext, "description", want.description, {
        quote: true,
      });
      ext = setExtensionScalar(ext, "author", want.author);
      ext = setExtensionScalar(ext, "repository", want.repository);
      ext = setExtensionScalar(ext, "homepage", want.homepage);
      ext = setExtensionScalar(ext, "license", want.license);
      ext = setExtensionTags(ext, want.tags);
      fs.writeFileSync(PATHS.extension, ext);
      written.push(PATHS.extension);
    }
  }

  return { drift, written };
}
