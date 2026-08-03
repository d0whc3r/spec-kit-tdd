---
name: "maintain-docs"
description: "Keep the user-facing extension docs (the wiki under docs/, the public website under web/, plus the root README and CHANGELOG) in sync with what the extension actually does. Invoke whenever someone asks to update the docs, sync the wiki, refresh the website, audit docs for drift, document a new command, or after any change under commands/, templates/, extension.yml, or catalog.json. Use it before merging structural changes, even if the user only said 'update the docs' in passing. It writes for the person who USES the extension: what each command does, how to run it, what it produces, and how the pieces fit together. It never documents how the repo is built or released; that lives in CONTRIBUTING.md."
compatibility: "Requires the spec-kit-tdd repo layout: extension.yml, catalog.json, commands/, templates/, docs/, web/."
metadata:
  author: "spec-kit-tdd"
  scope: "repo-local"
---

# Maintain User Docs

Keep the wiki under `docs/`, the public website under `web/`, and the
user-facing root markdown in sync with what the extension actually does for
the people who use it. The canonical truth lives in code-adjacent files
(`extension.yml`, `catalog.json`, `commands/`, `templates/`). The wiki and
the website are both derived, human-readable views of those files. Drift
between a derived view and a source is a bug.

The website (`web/`) is the short public front door; the wiki is the
long-form reference. They draw on the same canonical facts, so they must
agree with each other as well as with the sources.

This skill audits every side, reports the drift, and edits the docs and the
website. It never edits the canonical sources. If a doc and a source
disagree, the source wins.

## Who these docs are for

Everything this skill maintains is written for the **user of the
extension**: someone who has Spec Kit installed and wants the
implementation phase of a feature to be genuinely test-driven. They want to
know what a command does, how to run it, what it writes, what the artifacts
look like, and why a command stopped. They do not care how the repo is structured,
how a release is cut, or which CI job lints the templates.

That second audience (contributors) has its own home: `CONTRIBUTING.md` at
the repo root. Keeping the two separate is the whole point. A wiki page
that explains the release pipeline or the dev install is noise for the
99% of readers who just want to generate a spec, and it rots faster than
anyone notices because users never read it. So this skill keeps the wiki
about the extension and routes every contributor or tooling concern to
`CONTRIBUTING.md`.

## What is in scope

The user-facing pages this skill owns and keeps in sync:

```
canonical layer                          user-facing layer (this skill owns)
─────────────                            ───────────────────────────────────
extension.yml      ┐                     docs/Home.md
catalog.json       │                     docs/Getting-Started.md
commands/*.md      │  ──> drift  ──>     docs/Commands.md
templates/*.md     ┘   detector          docs/Workflow.md
                                         docs/The-Loop.md
                                         docs/Test-List-Format.md
                                         docs/Test-Quality.md
                                         docs/Stack-Profiles.md
                                         docs/Examples.md
                                         docs/Troubleshooting.md
                                         docs/FAQ.md
                                         docs/Architecture.md  (how it works, not how it ships)
                                         docs/_Sidebar.md
                                         docs/_Footer.md
                                         README.md      (front door)
                                         WORKFLOW.md    (long-form usage narrative)
                                         CHANGELOG.md   (version coherence only)
                                         web/index.html (public landing site)
```

The website under `web/` is a single page whose content is hand-authored in
`index.html` (styling and behaviour live in `web/src/`, built with Vite) and
deployed to GitHub Pages. This skill owns its
**content**, not its visual design: keep the command list, the Command /
What it does / Writes facts, the install and usage snippets, the
version pin, the artifact paths, the example file paths the "View full
file" buttons fetch, and the repo and wiki links in step with the canonical
sources and the wiki. Do not redesign the
layout or restyle it; touch only the text that drifted. `web/README.md`
explains the folder and is maintained like `docs/README.md`.

`docs/README.md` is a repo-only meta-doc about the `docs/` folder itself
(it is excluded from the published wiki). Maintain only its reading-order
link list so it stays consistent with the pages that exist. Do not turn it
into a tooling guide.

## What is out of scope

Do not write any of the following into the user-facing pages, and if you
find it already there, remove it and point the reader to `CONTRIBUTING.md`
instead:

- The release pipeline, `semantic-release`, Conventional Commits, version
  bumping, tagging, the catalog submission flow.
- Anything under `.github/` (workflows, actions, scripts), CI, linting
  tooling, `pnpm`, build/zip, `.extensionignore`.
- The contributor repo layout (the source tree, where `commands/` and
  `templates/` live as files to edit), dev install
  (`specify extension add --dev`), branch naming.
- Assistant names as maintainers, and the repo governance in `AGENTS.md`
  (renames as breaking changes, the "change these files together"
  coupling).
- `CONTRIBUTING.md` and `AGENTS.md`/`CLAUDE.md` themselves. They are the
  contributor home and the agent-behavior file. This skill does not edit
  them. When a user-facing page needs to hand a reader off to contributor
  material, link to `CONTRIBUTING.md` with an absolute repo URL.

The line to hold: a user-facing page may say *what the extension does and
why* (including runtime behavior, the per-command write boundaries, and the
loop invariants, because those shape what the user gets). It must not say *how the repo
produces or ships the extension*.

`docs/Architecture.md` is the page most prone to crossing this line. Keep
it to how the extension works at runtime: what it is (text, no runtime),
how a command resolves and what it reads and writes, and the per-command
write boundaries (only `/speckit.tdd.run` writes tests or source; only
`/speckit.tdd.verify` grades, and it never fixes).
The repo tree, the release pipeline, and repo governance do not belong
on it.

## The workflow

Follow these phases in order.

### Phase 1: Inventory the canonical layer

Read these and build a picture of what the extension actually does:

1. `extension.yml` — id, name, version, description, `requires`,
   `provides.commands[]`, `tags[]`, `homepage`, `repository`.
2. `catalog.json` — must match `extension.yml` on version, description,
   tags, requires, and the `provides` counts.
3. `commands/speckit.tdd.*.md` — each filename maps 1:1 to a command name
   (`speckit.tdd.run.md` → `/speckit.tdd.run`). Capture what each reads,
   what it writes, the stop conditions, and **every modifier it
   recognizes**. These shape the user-visible behavior, so they are
   user-facing facts, not contributor detail.
4. `templates/*.md` — the canonical headings each template defines (the
   loop playbook, the test list format, the stack profile guide, the test
   quality rubric). `.github/scripts/lint-content.mjs` holds the required
   heading list; the wiki pages that paraphrase a template must not
   contradict it. Also capture the closed vocabularies the templates
   define: behavior states, behavior kinds, evidence classes, smell
   severities, and verdicts.
   Cross-check against what the command prompts claim to produce.
5. `CHANGELOG.md` — top entry version should equal
   `extension.yml.extension.version` (modulo an open `[Unreleased]`
   block).

Open each file with `Read`. Do not trust grep alone for structure.

Output: a coverage map you carry in your head of the form:

```
Commands actually shipped:
  /speckit.tdd.setup   detects + proves the stack   writes .specify/memory/tdd-profile.md
  /speckit.tdd.plan    criteria -> test list        writes tdd/test-list.md, tasks.md
  /speckit.tdd.run     the loop                     writes tests, source, tdd/cycle-log.md
  /speckit.tdd.verify  the cold audit               writes tdd/verification.md, tasks.md
Hooks declared: after_tasks -> plan (optional), before_implement -> run
                (mandatory), after_implement -> verify (optional)
Version: <extension.yml version>  Requires: <requires.speckit_version>
```

### Phase 2: Inventory the user-facing layer

Read the pages in the in-scope list above. For each page note which
canonical artifacts it describes and what specific claims it makes that
can drift (command list, version strings, install URLs, file paths,
status values, refusal conditions, output section lists, example
snippets).

See `references/coverage-map.md` for the page-by-page list of which
canonical sources each page is responsible for. Read it now.

While reading, also watch for **scope drift**: a user-facing page that has
drifted into describing the release pipeline, CI, the repo tree, or dev
setup. That is its own drift class (see Phase 3), separate from factual
staleness.

### Phase 3: Detect drift

Run the drift script from the repo root:

```bash
bash .agents/skills/maintain-docs/scripts/detect_drift.sh
```

It prints a machine-readable report of common drift classes: command
count mismatch, command names missing from `docs/Commands.md` or
`web/index.html`, hook list mismatch between `extension.yml` and the docs,
version mismatch across `extension.yml` / `catalog.json` / `CHANGELOG.md` /
install URLs (including the website install URL), em dash characters, and
broken intra-wiki links.

After the script, do a second-pass semantic audit it cannot do:

1. For each command in Phase 1, confirm its section in `docs/Commands.md`
   exists and lists the same reads, writes, audience, output sections,
   and refusal conditions as the canonical command file and its template.
   For the audit command, confirm the modifiers (`quick`/`deep`, focus
   category, `branch`, `next`, `--issues`) are documented in
   `docs/Commands.md` and `WORKFLOW.md` the way the command file defines
   them.
2. For each refusal condition in a `commands/*.md`, confirm the Refusal
   summary in `docs/Commands.md` and `docs/Troubleshooting.md` describe it
   with the same meaning.
3. For each install path in `README.md`, confirm `docs/Getting-Started.md`
   has the same paths and version pin.
4. Confirm `docs/_Sidebar.md` lists every page that exists under `docs/`
   and nothing else.
5. Confirm the "Command / What it does / Writes" table in `README.md` and
   `docs/Home.md` agrees on the four rows and their write paths. The same
   commands appear in `web/index.html` as an HTML table; it is not
   byte-equivalent there, but it must list the same names and write paths.
6. Confirm every excerpt in `docs/Examples.md` still matches the committed
   file under `examples/` it quotes, and that every path it references
   exists. This page quotes real artifacts, so a stale quote is a factual
   error.
7. Confirm the pages that paraphrase a shipped template
   (`docs/The-Loop.md`, `docs/Test-List-Format.md`, `docs/Test-Quality.md`,
   `docs/Stack-Profiles.md`) still match it on every closed vocabulary:
   states, kinds, evidence classes, smell names and severities, verdicts
   and their conditions. A paraphrased verdict condition is drift, not
   style.
8. Confirm `web/index.html` agrees with the wiki on the install and usage
   snippets, the version pin and `requires.speckit_version` badge, the
   artifact paths, the `data-md-full` example paths, and the hero and FAQ
   claims. It is a short subset of the wiki, so it need not cover every
   page, but nothing it states may contradict the canonical sources.
9. **Scope audit.** Scan every in-scope page for out-of-scope content
   (release pipeline, CI, `.github/`, dev install, repo tree, repo
   governance). Flag each occurrence. The
   fix is to remove it and, if a reader genuinely needs that information,
   leave a single link to `CONTRIBUTING.md`.

Write the drift report as a short bullet list grouped by file. Do not
write it to disk unless the user asked for a report-only run.

### Phase 4: Propose the change set

Before editing, summarize for the user: the drift found per file, the
planned edits in order, and the pages with no drift. If a drift has more
than one reasonable resolution, ask once, then proceed.

### Phase 5: Apply edits

Edit in place with `Edit` (preferred) or `Write` (only when rewriting a
whole page). Apply one change at a time so each edit is reviewable.

Style rules every edit must obey (full list in
`references/style-rules.md`; the em dash and plain-English rules are also
enforced by `scripts/check_style.sh` and the repo's
`.github/scripts/lint-content.mjs`):

- No em dash characters. Use a hyphen, comma, or period.
- Plain English. Short sentences. No marketing voice.
- Match the existing voice of the page you are editing.
- Write for the user, not the contributor. If you reach for a sentence
  about how the repo works, stop: it belongs in `CONTRIBUTING.md`.
- Preserve the templates' exact tokens for states, kinds, evidence classes,
  and verdicts. Never soften one into prose.
- File references use `[Page Name](Page-Name.md)` so they work in the
  repo and on the wiki. Links to contributor material use an absolute
  repo URL to `CONTRIBUTING.md`.
- Command names in prose are wrapped in backticks.
- The "Command / What it does / Writes" table lists the same four commands
  and the same write paths in `README.md` and `docs/Home.md`. The wording
  of the middle column may differ between them; the rows and the paths may
  not. The same facts appear in `web/index.html` as HTML; keep them in
  step, but it is HTML markup, not a byte copy.
- The website is content-only for this skill. Edit the text inside
  `web/index.html`; do not restyle `web/src/styles.css` or rewrite
  the TypeScript under `web/src/`.

When you add a new wiki page, also add it to `docs/_Sidebar.md` (correct
order), the start-here table on `docs/Home.md` if it belongs there, and
the reading-order list in `docs/README.md`. A new command also needs a
card or table row on `web/index.html`.

When the version bumps, the touch points are the install URL line in
`README.md`, the pinned-version snippet in `docs/Getting-Started.md`, and
the pinned install URL plus the "Requires Spec Kit" badge in
`web/index.html`. `catalog.json` and `extension.yml` are canonical and the
release pipeline owns them; do not edit them here.

### Phase 6: Verify

Rerun the drift script and the style check:

```bash
bash .agents/skills/maintain-docs/scripts/detect_drift.sh
bash .agents/skills/maintain-docs/scripts/check_style.sh
```

Both should report clean. If anything remains, loop back to Phase 4.

If the user gave a commit range to react to, cross-check it:

```bash
git diff --name-only <base>..HEAD -- commands/ templates/ extension.yml catalog.json
```

Every file in that diff should have a corresponding doc edit, or an
explicit note that no user-facing change was needed (e.g. "the
`extension.yml` description tweak was cosmetic").

### Phase 7: Report

End with a short summary the user can paste into a PR description: which
pages were updated, which were no-ops, and that the drift and style
checks are clean. Do not commit; the user controls commits.

## Modes

- **Audit only.** "audit the docs" / "what's drifted". Stop after Phase 3
  and print the report. Do not edit.
- **Scoped sync.** User points at a specific change ("after my last
  commit"). Run the full workflow but prioritize drift implied by the
  diff in Phase 3.
- **Full sync.** No scope given. Run all phases. This is the default.
- **New page.** "add a docs page for X". Treat as a Phase 5 edit with the
  drift report skipped, but still run Phase 6.

## What this skill must not do

- Do not edit `commands/`, `templates/`, `extension.yml`, `catalog.json`,
  the workflows under `.github/`, or `.specify/memory/constitution.md`.
  They are canonical.
- Do not edit `CONTRIBUTING.md` or `AGENTS.md`/`CLAUDE.md`. They are the
  contributor and agent-behavior homes.
- Do not add release, CI, dev-install, repo-tree, or governance content
  to a user-facing page. Route it to `CONTRIBUTING.md`.
- Do not "improve" prose adjacent to a fix. Touch only the lines that
  drifted.
- Do not edit the artifacts under `specs/*/tdd/` or the files under
  `examples/`. They are outputs, not docs. When an example drifts from a
  template, report it; regenerating it is a separate, explicit task.
- Do not rename a wiki page without updating `docs/_Sidebar.md`,
  `docs/README.md`, and every inbound link in the same batch.
- Do not paraphrase a closed vocabulary (states, kinds, verdicts, evidence
  classes). Quote the template's exact tokens.
- Do not introduce em dashes.

## References

- `references/coverage-map.md` — which canonical file each user-facing
  page is responsible for. Read in Phase 2.
- `references/edit-patterns.md` — before/after examples of common doc
  edits (new command, version bump, renamed file, new page, removing
  out-of-scope content). Read before editing.
- `references/style-rules.md` — the full style rule list. Read when in
  doubt.

## Scripts

- `scripts/detect_drift.sh` — machine-readable drift report. Run in
  Phase 3 and again in Phase 6.
- `scripts/check_style.sh` — em dash and basic style lint over `docs/`
  and root `*.md`. Run in Phase 6.
