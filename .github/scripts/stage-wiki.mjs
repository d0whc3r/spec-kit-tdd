// Stage docs/ for GitHub Wiki publication.
//
// Copies every top-level docs/*.md (except README.md, a repo-only meta-doc)
// into a staging directory and rewrites markdown links so they resolve inside
// the wiki:
//   [Page](Page.md)        -> [Page](Page)
//   [Page](Page.md#anchor) -> [Page](Page#anchor)
//   [File](../File.md)     -> [File](https://github.com/<repo>/blob/main/File.md)
//
// Usage: node stage-wiki.mjs [source-dir] [staging-dir]
//   defaults: source-dir=docs, staging-dir=.wiki-staging

import path from "node:path";
import { fs, glob } from "zx";
import { repoRoot, resolveRepoSlug, isMain } from "./lib/repo.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("stage-wiki");

export async function stageWiki({ sourceDir = "docs", stagingDir = ".wiki-staging" } = {}) {
  const source = path.resolve(repoRoot, sourceDir);
  const staging = path.resolve(repoRoot, stagingDir);

  if (!fs.existsSync(source)) log.die(`source dir not found: ${sourceDir}`);

  const repoBlob = `https://github.com/${await resolveRepoSlug()}/blob/main`;

  fs.removeSync(staging);
  fs.ensureDirSync(staging);

  const pages = (await glob("*.md", { cwd: source, onlyFiles: true }))
    .filter((name) => name !== "README.md")
    .sort();

  for (const name of pages) {
    const body = fs
      .readFileSync(path.join(source, name), "utf8")
      // 1. ../FILE escapes the wiki -> absolute repo URL.
      .replace(/\]\(\.\.\/([^)]+)\)/g, `](${repoBlob}/$1)`)
      // 2. Drop .md from intra-wiki links, preserving an optional #anchor.
      .replace(
        /\]\(([A-Za-z][A-Za-z0-9_-]*)\.md(#[A-Za-z0-9_-]+)?\)/g,
        (_, page, anchor) => `](${page}${anchor ?? ""})`,
      );
    fs.writeFileSync(path.join(staging, name), body);
  }

  log.ok(`${pages.length} pages staged in ${stagingDir} for the wiki`);
  return staging;
}

if (isMain(import.meta.url)) {
  const [sourceDir, stagingDir] = process.argv.slice(2);
  await stageWiki({ sourceDir, stagingDir });
}
