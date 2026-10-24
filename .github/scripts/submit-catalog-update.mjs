// Render a ready-to-file [Extension Submission] issue for github/spec-kit. The
// release pipeline uploads it as an artifact so a maintainer can file the issue
// manually (automatic issue creation against the upstream repo proved
// unreliable).
//
// Flow:
//   1. Look up the current entry in upstream catalog.community.json.
//        present -> title "[Extension]: Update <name> to vX.Y.Z"
//        absent  -> title "[Extension]: Add <name>"
//   2. Render the issue body from catalog.json and extension.yml. Its `###`
//      headings match the upstream issue form labels, which the upstream
//      catalog workflow parses.
//   3. Write the body to <OUTPUT_FILE minus .md>.body.md (for
//      `gh issue create --body-file`) and the filing steps plus the body to
//      OUTPUT_FILE.
//
// Env: UPSTREAM_REPO (default github/spec-kit), OUTPUT_FILE (default
//      upstream-catalog-issue-v<version>.md), GITHUB_REPOSITORY (else derived
//      from the origin remote).
//
// Usage: node submit-catalog-update.mjs [version] [release_type] [git_tag]
//   version defaults to catalog.json .version; release_type to "release";
//   git_tag to "v<version>".

import { fs, fetch } from "zx";
import { PATHS, readJson, readExtension } from "./lib/manifest.mjs";
import { resolveRepoSlug, downloadUrl, isMain } from "./lib/repo.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("submit-catalog-update");

// Per-command and per-hook bullets from extension.yml (the canonical lists;
// catalog.json only carries the counts). An event may hold one hook or a list.
function keyFeatures(fallbackCount, docs) {
  const ext = readExtension();
  const commands = (ext.provides?.commands ?? []).map((c) => `- \`/${c.name}\`: ${c.description}`);
  const hooks = Object.entries(ext.hooks ?? {}).flatMap(([event, list]) =>
    [list]
      .flat()
      .map((h) => `- \`${event}\` hook${h.optional ? " (optional)" : ""}: ${h.description}`),
  );
  const bullets = [...commands, ...hooks].join("\n");
  return bullets || `- ${fallbackCount} command(s) under \`/speckit.tdd.*\`. See ${docs}.`;
}

// The upstream community catalog entry for this extension, or null.
async function upstreamEntry(upstreamRepo, id) {
  const url = `https://raw.githubusercontent.com/${upstreamRepo}/main/extensions/catalog.community.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return json.extensions?.[id] ?? null;
  } catch {
    return null;
  }
}

export async function renderCatalogIssue({
  version,
  releaseType = "release",
  gitTag,
  outputFile,
} = {}) {
  const catalog = readJson(PATHS.catalog);
  const v = version || catalog.version;
  if (!v) throw new Error("version required (and catalog.json .version empty)");
  const tag = gitTag || `v${v}`;
  const out = outputFile || `upstream-catalog-issue-v${v}.md`;
  const bodyOut = out.replace(/\.md$/, ".body.md");
  const upstreamRepo = process.env.UPSTREAM_REPO || "github/spec-kit";

  const slug = await resolveRepoSlug();
  const url = downloadUrl(slug, v, tag);

  const id = catalog.id;
  const name = catalog.name;
  const docs = catalog.documentation ?? "";
  const homepage = catalog.homepage ?? "";
  const repo = catalog.repository;

  const prev = await upstreamEntry(upstreamRepo, id);
  const action = prev ? "Update" : "Add";
  const title = prev ? `[Extension]: Update ${name} to v${v}` : `[Extension]: Add ${name}`;
  const newIssueUrl = `https://github.com/${upstreamRepo}/issues/new/choose`;
  const titleQuery = title.replaceAll(" ", "+");
  const lead = prev
    ? `> **Update to an existing catalog entry.** The \`${id}\` entry in \`extensions/catalog.community.json\` is at ${prev.version}. This request moves it to ${v}. Please keep the existing \`created_at\`, \`downloads\`, and \`stars\`.`
    : `> **New catalog entry** for \`${id}\` v${v}.`;

  // The maintainers own created_at, downloads, stars, and verified. On an
  // update, propose the values the catalog already holds.
  const proposedEntry = JSON.stringify(
    {
      [id]: {
        ...catalog,
        version: v,
        download_url: url,
        verified: prev?.verified ?? false,
        downloads: prev?.downloads ?? 0,
        stars: prev?.stars ?? 0,
        created_at: prev?.created_at ?? catalog.created_at,
      },
    },
    null,
    2,
  );

  const features = keyFeatures(catalog.provides?.commands, docs);

  // Same shape as the upstream form placeholder: "- node (>=22.0.0) - required".
  const tools =
    (catalog.requires?.tools ?? [])
      .map(
        (t) =>
          `- ${t.name}${t.version ? ` (${t.version})` : ""} - ${t.required ? "required" : "optional"}`,
      )
      .join("\n") || "None. The extension adds no tool or runtime dependency beyond Spec Kit.";

  const body = `${lead}

### Extension ID

${id}

### Extension Name

${name}

### Version

${v}

### Description

${catalog.description}

### Author

${catalog.author}

### Repository URL

${repo}

### Download URL

${url}

### License

${catalog.license}

### Homepage (optional)

${homepage}

### Documentation URL (optional)

${docs}

### Changelog URL (optional)

${catalog.changelog ?? ""}

### Required Spec Kit Version

${catalog.requires?.speckit_version}

### Required Tools (optional)

${tools}

### Number of Commands

${catalog.provides?.commands}

### Number of Hooks (optional)

${catalog.provides?.hooks}

### Tags

${(catalog.tags ?? []).join(", ")}

### Key Features

${features}

### Testing Checklist

- [x] Extension installs successfully via download URL
- [x] All commands execute without errors
- [x] Documentation is complete and accurate
- [x] No security vulnerabilities identified
- [x] Tested on at least one real project

### Submission Requirements

- [x] Valid \`extension.yml\` manifest included
- [x] README.md with installation and usage instructions
- [x] LICENSE file included
- [x] GitHub release created with version tag
- [x] All command files exist and are properly formatted
- [x] Extension ID follows naming conventions (lowercase-with-hyphens)

### Testing Details

**Tested by the \`${repo}\` release pipeline (\`${releaseType}\`):**

- Manifest validation (\`pnpm run validate\`) confirms \`extension.yml\` and \`catalog.json\` agree on version, command count, and hook count.
- Content lint (\`pnpm run lint:content\`) enforces the output style rules every command must follow.
- The release archive \`${id}-${v}.zip\` is built and attached to the GitHub release at tag \`${tag}\`. The proposed entry carries its \`sha256\`.

**Install check:** before filing, the archive at the download URL above was installed into a new Spec Kit project with \`specify extension add ${id} --from <download URL>\`.

**Test project:** the committed \`examples/\` artifacts (a test list, a cycle log, and a verification report) come from running the full loop on a real codebase.

### Example Usage

\`\`\`bash
# Install the extension from the release archive
specify extension add ${id} --from ${url}

# Once per repository: detect and verify the test stack
/speckit.tdd.setup

# Per feature, after /speckit.tasks: derive the test list
/speckit.tdd.plan

# Drive the red-green-refactor loop, one behavior per cycle
/speckit.tdd.run
/speckit.tdd.run all

# Audit the discipline and the strength of the tests from cold context
/speckit.tdd.verify
\`\`\`

### Proposed Catalog Entry

\`\`\`json
${proposedEntry}
\`\`\`

### Additional Context

Full user documentation lives on the project website (${homepage}) and the project wiki, with reference docs at ${docs}. Source repository: ${repo}.

A complete, real worked example (a test list, the cycle log with its recorded red output, and the verification report) is committed at ${repo}/tree/main/examples so reviewers and users can see exactly what each command reads and writes.
`;

  const doc = `# Upstream catalog issue — ${action} ${name} v${v}

> Generated by the \`${repo}\` release pipeline. File this issue manually
> on the upstream Spec Kit repo.

## How to file this issue

1. Check that no open issue has the same title:
   https://github.com/${upstreamRepo}/issues?q=is%3Aissue+is%3Aopen+in%3Atitle+${titleQuery}
2. Install the release into a new Spec Kit project and confirm the commands
   appear. The body states that this install works.

   \`\`\`bash
   specify init catalog-check --integration claude --non-interactive
   cd catalog-check && specify extension add ${id} --from ${url}
   \`\`\`

3. File the issue from the repo root. \`${bodyOut}\` holds the **Issue body**
   section below.

   \`\`\`bash
   gh issue create --repo ${upstreamRepo} --title "${title}" --body-file ${bodyOut}
   \`\`\`

   Without the GitHub CLI, open ${newIssueUrl}, pick **Extension Submission**,
   set the title, and copy each \`###\` section into its form field.

---

## Issue body

${body}`;

  fs.writeFileSync(bodyOut, body);
  fs.writeFileSync(out, doc);
  log.ok(`wrote ${action} v${v} document to ${out} and body to ${bodyOut}`);
  return out;
}

if (isMain(import.meta.url)) {
  const [version, releaseType, gitTag] = process.argv.slice(2);
  await renderCatalogIssue({
    version,
    releaseType,
    gitTag,
    outputFile: process.env.OUTPUT_FILE,
  });
}
