// Pipeline: build the deterministic release zip.
//
// Produces dist/tdd-<version>.zip containing only the extension's runtime
// surface (extension.yml, README.md, LICENSE, commands/**, templates/**), with
// entries sorted and timestamped to the tagged commit (or SOURCE_DATE_EPOCH)
// for reproducibility. Then unpacks the zip and re-validates it.
//
// Usage: node build-zip.mjs

import path from "node:path";
import { $, fs, os, glob } from "zx";
import { repoRoot, isMain } from "./lib/repo.mjs";
import { readExtension } from "./lib/manifest.mjs";
import { validateManifest } from "./validate-manifest.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("build-zip");

// Only these paths belong in the extension zip.
const INCLUDE = ["extension.yml", "README.md", "LICENSE", "commands/**/*", "templates/**/*"];

async function reproducibleEpoch() {
  if (process.env.SOURCE_DATE_EPOCH) return Number(process.env.SOURCE_DATE_EPOCH);
  const ct = (await $({ cwd: repoRoot })`git log -1 --format=%ct`.nothrow()).stdout.trim();
  return ct ? Number(ct) : Math.floor(Date.now() / 1000);
}

export async function buildZip() {
  const version = readExtension().extension?.version;
  if (!version) log.die("could not read extension.version");

  const epoch = await reproducibleEpoch();
  const mtime = new Date(epoch * 1000);
  const tsIso = mtime.toISOString().slice(0, 19);

  const distDir = path.join(repoRoot, "dist");
  fs.ensureDirSync(distDir);
  const zipPath = path.join(distDir, `tdd-${version}.zip`);
  fs.removeSync(zipPath);

  // Stage the included files, preserving their relative paths.
  const files = (await glob(INCLUDE, { cwd: repoRoot, onlyFiles: true, dot: false })).sort();
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-zip-"));
  try {
    for (const rel of files) {
      const dest = path.join(stage, rel);
      fs.ensureDirSync(path.dirname(dest));
      fs.copySync(path.join(repoRoot, rel), dest);
      fs.utimesSync(dest, mtime, mtime);
    }

    // zip -X drops the platform extra-fields; passing the sorted list as args
    // fixes entry order. Both are required for a byte-stable archive.
    await $({ cwd: stage })`zip -X -q ${zipPath} ${files}`;

    if (!fs.existsSync(zipPath)) log.die(`zip not produced at ${zipPath}`);

    // Re-validate against the unpacked archive.
    const verify = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-verify-"));
    try {
      await $({ cwd: verify })`unzip -q ${zipPath}`;
      if (!validateManifest({ root: verify })) {
        log.die("packaged manifest failed validation");
      }
    } finally {
      fs.removeSync(verify);
    }
  } finally {
    fs.removeSync(stage);
  }

  log.ok(`${path.relative(repoRoot, zipPath)} (version=${version}, mtime=${tsIso} UTC)`);
  return zipPath;
}

if (isMain(import.meta.url)) {
  await buildZip();
}
