# Edit Patterns

Concrete before/after examples for the doc edits that come up most
often. Reach for the closest pattern when you are about to make an
edit and want to keep voice and shape consistent across the wiki.

## 1. New command added

A new file `commands/speckit.tdd.<verb>.md` exists. The canonical
side (`extension.yml`, `catalog.json`, the integration manifests) is owned
by the release pipeline and contributors; this skill does not touch it.
The user-facing side to update:

- `README.md` and `docs/Home.md` command table (one new row).
- `docs/Commands.md` (one new section).
- `docs/Workflow.md` (mention in the recommended order if relevant).
- `docs/Troubleshooting.md` (a refusal row if the command can refuse).
- `docs/Architecture.md` (add to the runtime flow if relevant).
- `docs/_Sidebar.md` (no change unless a new top-level page was added).
- `web/index.html` (one new command card or table row).

### Before (excerpt of `docs/Home.md`)

```markdown
| Command             | What it does                                                    | Writes                                            |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| `/speckit.tdd.run`  | Drives the loop: one failing test, smallest green, refactor.     | tests, source, `specs/<feature>/tdd/cycle-log.md` |
```

### After

```markdown
| Command              | What it does                                                | Writes                                            |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `/speckit.tdd.run`   | Drives the loop: one failing test, smallest green, refactor. | tests, source, `specs/<feature>/tdd/cycle-log.md` |
| `/speckit.tdd.watch` | Re-runs the affected tests as files change.                 | nothing                                           |
```

Then add a section body to `docs/Commands.md` modeled on the existing
per-command sections. Always include: a one-paragraph summary,
**Reads** / **Writes** lines, every modifier the command file recognizes,
and any stop condition the command defines. Then add the modifiers to the
modifier summary table at the bottom of the page; a modifier documented in
one place and not the other is the most common drift on that page.

## 2. Version bump

`extension.yml.extension.version` and `catalog.json.version` were bumped
by the release pipeline. The version appears in three user-facing places,
each with a pinned install URL:

- `README.md` install snippet.
- `docs/Getting-Started.md` "pin a specific version" snippet.
- `web/index.html` install snippet and the "Requires Spec Kit" badge area.

Each URL contains the literal version twice (in the path and in the zip
filename). Update both occurrences in each file.

### Before

```bash
specify extension add tdd --from https://github.com/d0whc3r/spec-kit-tdd/releases/download/v0.1.0/tdd-0.1.0.zip
```

### After

```bash
specify extension add tdd --from https://github.com/d0whc3r/spec-kit-tdd/releases/download/v0.1.1/tdd-0.1.1.zip
```

Do not touch the catalog install path; it does not pin a version.

## 3. Renamed file

`AGENTS.md` treats command renames as breaking changes. The doc side of a
rename is straightforward but must be done in lockstep.

If `commands/speckit.tdd.<old-verb>.md` is renamed to
`commands/speckit.tdd.<new-verb>.md`:

- Rename the section header in `docs/Commands.md`.
- Update the in-page anchor link in the table.
- Update every mention of `/speckit.tdd.<old-verb>` to
  `/speckit.tdd.<new-verb>` in `README.md`, `docs/Home.md`,
  `docs/Getting-Started.md`, `docs/Workflow.md`, `docs/The-Loop.md`,
  `docs/Test-List-Format.md`, `docs/Test-Quality.md`,
  `docs/Stack-Profiles.md`, `docs/Examples.md`, `docs/Troubleshooting.md`,
  `docs/Architecture.md`, `WORKFLOW.md`, `web/index.html`,
  `CHANGELOG.md` (the new entry).

When in doubt, do a project-wide search for the old name before
finishing (substitute the real verb):

```bash
git grep -l 'speckit.tdd.<old-verb>\b' -- '*.md' ':!CHANGELOG.md'
```

If any file still references the old name after your edits, you missed
one.

## 4. New wiki page

The user added `docs/Examples-Advanced.md` (for example) or you are
adding it as part of a sync. Touch these:

- `docs/_Sidebar.md` (add a bullet in the correct reading position).
- `docs/Home.md` (add a row to the start-here table if it belongs there;
  otherwise mention it in prose).
- `docs/README.md` (the reading-order list).
- `README.md` (the wiki page table at the top) if the page belongs in the
  main entry-point list.

The new page itself must start with a single `# H1` (matching the
filename's human form) and follow the voice rules in
`references/style-rules.md`.

## 5. Description change

A short sentence describing the extension exists in several places:

- `extension.yml.extension.description` (canonical, do not edit).
- `catalog.json.description` (canonical, the release pipeline owns it).
- `README.md` opening paragraph.
- `docs/Home.md` opening paragraph.

The README and Home page paragraphs are derived; they may expand on the
manifest description with one or two extra sentences but the lead line
should not contradict the manifest. When the manifest description
changes, rewrite the lead sentence in `README.md` and `docs/Home.md` to
match.

## 6. Em dash creep

The lint catches them but it is worth knowing the fix patterns. An em
dash (`—`) usually wants one of:

- A hyphen (`-`) for parenthetical asides.
- A comma for soft pauses.
- A period when the second clause stands on its own.

### Before

```
The audit reads three evidence sources — the log, git history, the files — and cross-checks them.
```

### After

```
The audit reads three evidence sources (the log, git history, the files) and cross-checks them.
```

or

```
The audit reads three evidence sources: the cycle log, git history, and the files as they stand.
```

Pick the form that reads cleanest in context.

## 7. Stale link

Relative wiki links break when a page is renamed. Run
`scripts/detect_drift.sh` after a rename; it lists broken links. Fix by
updating the link target, not the link text.

## 8. Long-form vs short-form workflow doc

`WORKFLOW.md` (root) and `docs/Workflow.md` are a long/short pair, both
written for the user running the commands. When they drift:

- Update `docs/Workflow.md` first (it is the wiki entry point).
- Mirror the structural changes in `WORKFLOW.md` while keeping its
  fuller narrative. Do not collapse `WORKFLOW.md` into
  `docs/Workflow.md`; the long form has room for more context.

If a fact appears in both files (a filename, a command name, a status
value), make sure they match byte-for-byte.

## 9. Removing out-of-scope content

A user-facing page has drifted into contributor or tooling territory: it
describes the release pipeline, a CI workflow, the dev install
(`specify extension add --dev`), the repo source tree, or repo
governance. This content is correct but misplaced; it belongs in
`CONTRIBUTING.md`, and on a user page it is noise that rots unread.

The fix is to cut it. If a reader might genuinely need the contributor
information, leave a single pointer rather than the content itself.

### Before (`docs/FAQ.md`)

```markdown
Shipped content uses plain English and no em dashes.
`.github/scripts/lint-content.mjs` in the release pipeline enforces this
on the templates.
```

### After

```markdown
Shipped content uses plain English and no em dashes.
```

### Before (a hand-off at the bottom of a page)

```markdown
See [Contributing](Contributing.md) for the full release coupling.
```

### After

```markdown
Contributors: see [CONTRIBUTING.md](https://github.com/d0whc3r/spec-kit-tdd/blob/main/CONTRIBUTING.md).
```

Do not leave a dangling link to a wiki `Contributing` page; that page is
not part of the user-facing wiki. Point at the repo-root `CONTRIBUTING.md`
by absolute URL so it resolves from both the repo and the wiki.
