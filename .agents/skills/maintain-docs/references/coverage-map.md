# Coverage Map

For each user-facing page, the canonical sources it documents and the
specific facts it asserts. Use this in Phase 2 of `maintain-docs` to
figure out which sources to re-check when a page is suspected of drift.

The reverse direction (canonical file → which pages depend on it) is at
the bottom.

Only user-facing pages appear here. Contributor and tooling docs
(`CONTRIBUTING.md`, `AGENTS.md`/`CLAUDE.md`) are out of this skill's
scope and are intentionally absent.

## Wiki pages

### `docs/Home.md`

Documents: the extension purpose, the four commands at a glance, the
reading order, the hard rules.

Asserts:

- Extension purpose paragraph (matches `README.md` lead and
  `extension.yml.extension.description`).
- The "Command / What it does / Writes" table (must agree with the same
  table in `README.md`; wording may differ, the four rows and their write
  paths may not).
- The hard rules list, matching the invariants the command files enforce.
- The links to every other wiki page.

Re-check whenever: a command is added or removed; the description in
`extension.yml` changes; a wiki page is added or removed; an invariant in
a command file changes.

### `docs/Getting-Started.md`

Documents: install, the once-per-repository setup, and the first cycle.

Asserts:

- Spec Kit version requirement (must match `extension.yml.requires.speckit_version`).
- Install URL with pinned version (must match
  `extension.yml.extension.version` and `catalog.json.version`).
- The prerequisite that a working test runner must already exist, and that
  the extension will not create one.
- The four-step order: `setup`, then the core lifecycle, then `plan`,
  `run`, `verify`.
- The artifact paths the steps produce.

Scope rule: this page covers the user install paths (catalog install and
pinned-version install). It does not cover the dev install
(`specify extension add --dev`); that is a contributor step and lives in
`CONTRIBUTING.md`.

Re-check whenever: version bumps; install paths change; a command's
reads/writes change; the recommended order changes.

### `docs/Commands.md`

Documents: every command in full.

Asserts:

- One section per command file in `commands/`, plus the summary table at
  the top and the modifier summary table at the bottom.
- Each section's reads and writes must match the command file body and the
  per-command write boundaries in `AGENTS.md`.
- Every modifier each command file recognizes, with no invented ones. The
  modifier summary table must list exactly the union of them.
- All three hooks, which command each runs, and each one's `optional` flag,
  matching `extension.yml.hooks`. `before_implement` is not optional on
  purpose: spec-kit only waits for a hook whose flag is false, so a page that
  describes it as a prompt is wrong.

Re-check whenever: any file under `commands/` or `templates/` changes.

### `docs/Workflow.md`

Documents: where the loop sits in the lifecycle and what it leaves behind.

Asserts:

- The lifecycle diagram: `setup` once, `plan` after `/speckit.tasks`, the
  loop, `verify` after `/speckit.implement`.
- The two ways to run the implementation phase (drive `run`, or run
  `/speckit.implement` against the reordered task list).
- The double-loop diagram, matching `templates/tdd-loop-playbook.md`.
- The artifact layout: `.specify/memory/tdd-profile.md` plus
  `specs/<feature>/tdd/{test-list,cycle-log,verification}.md`, and that
  there is no index file across features.
- The behavior state machine and the commit shape.

Re-check whenever: a command is added; the artifact layout changes; the
state list in `templates/tdd-test-list-template.md` changes.

### `docs/The-Loop.md`

Documents: the discipline itself, as the user-facing tour of
`templates/tdd-loop-playbook.md`.

Asserts:

- The five steps, in the playbook's order and with its names.
- What counts as a valid red and the response to each invalid one.
- The deliberate-mutant check.
- Step-size guidance and `tcr` mode.
- The test-double guidance and its hard limits.
- The brownfield path (characterization then approval).
- The forbidden shortcuts list and the escape hatches, which must not
  contradict the playbook or be shorter than its list.

Re-check whenever: `templates/tdd-loop-playbook.md` changes in any way.
This page is the closest paraphrase of a shipped template in the wiki, so
it drifts first.

### `docs/Test-List-Format.md`

Documents: the test list and cycle log, field by field.

Asserts:

- The frontmatter field list and their meanings.
- The behavior id series (`A`, `U`), the state table, and the kind table,
  matching `templates/tdd-test-list-template.md`.
- The list body's four sections plus the verification commands block.
- The cycle log entry shape and the append-only rule.
- The quality bar checklist.

Re-check whenever: `templates/tdd-test-list-template.md` changes.

### `docs/Test-Quality.md`

Documents: the audit standard, as the user-facing tour of
`templates/tdd-test-quality-rubric.md`.

Asserts:

- The five questions, in order.
- The three evidence sources and their failure modes.
- The test-first classification table.
- The smell catalogue names grouped by severity (the full definitions stay
  in the template; the names and severities must match).
- The mutation procedure and the deliberate-mutant fallback.
- The verdict table and its conditions, exactly as the template states
  them. A verdict condition documented loosely here is worse than absent.

Re-check whenever: `templates/tdd-test-quality-rubric.md` changes.

### `docs/Stack-Profiles.md`

Documents: how the extension stays language agnostic.

Asserts:

- The six capabilities and which are required.
- The detection order.
- The double check on the single-test command (a name that exists, and a
  name that matches nothing).
- The ecosystem reference table, matching
  `templates/tdd-stack-profile.md`. Tool names must not be invented here.
- The profile frontmatter shape and the explicit-`null` rule.
- The degradation table for a missing capability.

Re-check whenever: `templates/tdd-stack-profile.md` changes; a tool in the
ecosystem table is renamed or replaced.

### `docs/Examples.md`

Documents: the worked example, as a narrated read of the files under
`examples/`.

Asserts:

- Every file path it references exists under `examples/`.
- Every excerpt it quotes matches the committed file. This page quotes
  real artifacts, so a quote that has drifted is a factual error, not a
  wording nit.
- The artifact shapes match the current templates: frontmatter fields,
  table columns, section names.

Re-check whenever: any file under `examples/` changes; a template changes
shape.

### `docs/Troubleshooting.md`

Documents: refusals, common breakages, and install errors.

Asserts:

- Each refusal or stop condition the command files can produce (missing
  profile, red baseline, unverifiable single-test command, no runner, a
  test that passes first run, an existing test that would need changing,
  the audit refusing to fix findings).
- The installation-errors section (the catalog `install_allowed: false`
  case), matching the install paths in `README.md`.
- The feature-resolution rule and the `--no-tasks` escape.

Re-check whenever: a command file adds or renames a stop condition; the
install paths change.

### `docs/FAQ.md`

Documents: conceptual questions and design rationale, from the user's
point of view.

Asserts:

- Rationale that may reference the loop invariants, the separation between
  doing and grading, or the language-agnostic design.
- The "composes with" table of other Spec Kit extensions. Extension ids
  and descriptions there must match the upstream community catalog; an
  extension that has been renamed or removed upstream makes this table
  wrong.

Re-check whenever: the behavior the FAQ describes changes; the upstream
catalog changes an extension named in the composition table; a frequently
asked question surfaces in issues that is not yet covered.

### `docs/Architecture.md`

Documents: how the extension works at runtime, for a user who wants to
understand what happens when they run a command.

Scope rule: this page is "how it works", not "how it ships". It covers
what the extension is (text, no runtime), the command-to-template map,
the shared state, and the per-command boundaries. It does **not** cover
the repo source tree, the release pipeline, `semantic-release`, CI, or
repo governance. Those are contributor concerns in `CONTRIBUTING.md`. It
also does not name specific assistants; refer generically to "the host
agent" when needed.

Asserts:

- The shipped file list, matching the `INCLUDE` list in
  `.github/scripts/build-zip.mjs`.
- The command-to-template map, matching the Templates section of each
  command file.
- The four shared-state files.
- The hook declarations, matching `extension.yml.hooks`.
- The three separations (planning from doing, doing from grading,
  detection from both) and the "what it does not do" list.

Re-check whenever: a command's read/write behavior changes; a template is
added or renamed; the zip `INCLUDE` list changes.

### `docs/_Sidebar.md`

Documents: wiki navigation.

Asserts: one bullet per wiki page that exists, in reading order, plus
external links (Repo / Issues / Discussions, and a Contributing link that
points to `CONTRIBUTING.md` at the repo root by absolute URL).

Re-check whenever: a wiki page is added or removed; the repo URL changes.

### `docs/_Footer.md`

Documents: a footer line for the wiki.

Asserts: copyright and a link back to the repo. Rarely changes.

### `docs/README.md`

Repo-only meta-doc about the `docs/` folder (excluded from the published
wiki). Maintain only its reading-order link list so it matches the pages
that exist, and its editing voice rules. The wiki-publishing mechanics
(the sync workflow, the staging script) are tooling and live in
`CONTRIBUTING.md`, not here.

Re-check whenever: a wiki page is added or removed.

## Root markdown

### `README.md`

Documents: the same things `docs/Home.md` documents plus install and the
composition note. The repo's front door.

Asserts:

- Description paragraph (must match `extension.yml.extension.description`
  in intent).
- The "Command / What it does / Writes" table (must agree with
  `docs/Home.md` on the four rows and their write paths).
- The "What it enforces" list, matching the invariants in the command
  files and `AGENTS.md`.
- Install paths and pinned version (must match `extension.yml.extension.version`).
- Links to every `docs/*.md` page that exists (as wiki URLs).
- A single Contributing pointer to `CONTRIBUTING.md` at the repo root.

Re-check whenever: command count changes; version bumps; a wiki page is
added; an invariant changes.

### `WORKFLOW.md`

Documents: the canonical usage narrative. Longer-form than
`docs/Workflow.md`, still written for the user running the commands.

Asserts: same flow as `docs/Workflow.md` but with more context, plus the
per-command invocation examples and the "Common Refusals" table. Treat
`WORKFLOW.md` and `docs/Workflow.md` as a long/short pair: when one
updates, check the other.

Re-check whenever: `docs/Workflow.md` changes; commands or modifiers are
added.

### `CHANGELOG.md`

Documents: per-version change log.

Asserts: top entry version matches `extension.yml.extension.version`
(unless an `[Unreleased]` block is open).

Re-check whenever: the version bumps. The release pipeline edits this
file; the skill only verifies the top entry version is consistent and
does not edit it unless explicitly asked.

## Website

### `web/index.html`

Documents: the public, short front door to the extension. A single page
covering the purpose, the four commands, getting started, the flow, and a
FAQ subset. Deployed to GitHub Pages.

Asserts:

- The hero paragraph (matches `extension.yml.extension.description` and
  the `README.md` lead).
- The hero badges: command count, the `Requires Spec Kit >= <floor>` value from
  `extension.yml.requires.speckit_version`, license.
- The four commands, with the same names and write paths as
  `docs/Home.md` (HTML form, not byte-equivalent).
- The hook names and the modifier list.
- The install snippets and the pinned release URL (must match the version
  in `README.md` and `docs/Getting-Started.md`).
- The artifact paths and the example file paths under `examples/`, which
  the "View full file" buttons fetch by path. A renamed example file
  breaks the viewer silently.
- The FAQ entries (a subset of `docs/FAQ.md`; must not contradict it).
- The repository, wiki, issues, and discussions links.

Edit content only. Do not restyle `web/src/styles.css` or rewrite the
TypeScript under `web/src/`. `web/README.md` is a repo-only meta-doc about
the folder, maintained like `docs/README.md`.

Re-check whenever: a command is added or removed; the description in
`extension.yml` changes; the version bumps; a file under `examples/` is
renamed; an FAQ answer in `docs/FAQ.md` changes in a way the website
echoes.

## Out of scope (do not maintain as user docs)

- `CONTRIBUTING.md` — the contributor home: repo layout, dev install,
  pipeline checks, release procedure, catalog submission, style coupling,
  branch naming. User-facing pages link here for contributor questions;
  the skill does not edit it.
- `AGENTS.md` / `CLAUDE.md` — agent behavioral guidelines and the
  per-command write boundaries. Repo governance, not user docs.
- `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md` — standard repo
  files. Leave alone unless explicitly asked.

## Canonical sources → pages that depend on them

Use this when you know which source changed and want to find every
user-facing page that might need a touch.

| Canonical file                          | Pages to re-check                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `extension.yml` (commands/version)      | `README.md`, `docs/Home.md`, `docs/Commands.md`, `docs/Getting-Started.md`, `docs/Architecture.md`, `CHANGELOG.md`, `web/index.html`  |
| `extension.yml.extension.description`   | `README.md`, `docs/Home.md`, `web/index.html`                                                                                        |
| `extension.yml.hooks`                   | `docs/Commands.md`, `docs/Workflow.md`, `docs/Architecture.md`, `web/index.html`                                                      |
| `catalog.json` (version, counts)        | `README.md`, `docs/Getting-Started.md`, `web/index.html`                                                                             |
| `commands/speckit.tdd.setup.md`         | `docs/Commands.md`, `docs/Stack-Profiles.md`, `docs/Getting-Started.md`, `docs/Troubleshooting.md`, `docs/Architecture.md`            |
| `commands/speckit.tdd.plan.md`          | `docs/Commands.md`, `docs/Test-List-Format.md`, `docs/Workflow.md`, `docs/Troubleshooting.md`, `docs/Architecture.md`                 |
| `commands/speckit.tdd.run.md`           | `docs/Commands.md`, `docs/The-Loop.md`, `docs/Workflow.md`, `docs/Troubleshooting.md`, `docs/Architecture.md`                         |
| `commands/speckit.tdd.verify.md`        | `docs/Commands.md`, `docs/Test-Quality.md`, `docs/Troubleshooting.md`, `docs/Architecture.md`                                         |
| `templates/tdd-loop-playbook.md`        | `docs/The-Loop.md` (closest paraphrase), `docs/Workflow.md` (double loop), `docs/Commands.md`                                         |
| `templates/tdd-test-list-template.md`   | `docs/Test-List-Format.md`, `docs/Workflow.md` (states), `docs/Examples.md` (artifact shape)                                          |
| `templates/tdd-stack-profile.md`        | `docs/Stack-Profiles.md`, `docs/Getting-Started.md`, `docs/Troubleshooting.md`                                                        |
| `templates/tdd-test-quality-rubric.md`  | `docs/Test-Quality.md`, `docs/Commands.md` (verify section), `docs/Examples.md` (report shape)                                        |
| `examples/**`                           | `docs/Examples.md` (quoted excerpts), `web/index.html` (viewer paths)                                                                 |
| `docs/FAQ.md` (echoed answers)          | `web/index.html` (FAQ subset)                                                                                                        |
| New file at `docs/<Page>.md`            | `docs/Home.md`, `docs/_Sidebar.md`, `docs/README.md`, `README.md` (if linked there)                                                   |
