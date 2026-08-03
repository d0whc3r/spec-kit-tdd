# Style Rules

The voice and formatting rules every wiki page and root-level markdown
file follows. The dash rules are enforced by `scripts/check_style.sh`
(and, for the shipped templates, by the repo's
`.github/scripts/lint-content.mjs`); the rest are judgment calls but
consistent across the repo.

## Mechanical rules

`scripts/check_style.sh` enforces rules 1 and 2 (plus trailing
whitespace, tabs, and heading-level jumps). Rules 3 and 4 are applied by
hand; `scripts/detect_drift.sh` reports broken local links.

1. **No em dash character.** The codepoint `U+2014` (`—`) is forbidden
   in `docs/` and root `*.md`. Use a hyphen, comma, parenthesis, or
   period instead. See `references/edit-patterns.md` §6 for examples.
2. **No en dash in prose.** `U+2013` (`–`) is fine in numeric ranges
   (`2024–2026`) but not in prose. Prefer a hyphen.
3. **English only.** No mixed-language pages. Code identifiers and
   command names are fine.
4. **Markdown links to local pages use `Page-Name.md`.** The same link
   must work on the rendered repo and on GitHub Wiki. Anchor links
   inside a page use lowercase, no punctuation: `#speckittddrun`.

## Voice rules (apply by hand)

1. **Plain English. Short sentences.** Prefer 15 words. Tolerate 25.
   Split anything longer.
2. **No marketing voice.** No "powerful", "seamless", "robust",
   "best-in-class", "delight", "unleash". Just describe what the
   extension does.
3. **Active voice over passive.** "The command writes the prompt file",
   not "the prompt file is written by the command".
4. **Imperative for instructions.** "Run `/speckit.tdd.run`",
   not "You should run `/speckit.tdd.run`".
5. **Concrete over abstract.** Use real paths, real filenames, real
   command outputs. Avoid placeholder phrasing like "the appropriate
   file".
6. **Tables for parallel structure.** When you list more than three
   parallel items with the same fields (command, what it does, writes),
   use a table.
7. **Code fences for code.** Bash in `bash` blocks, command lines in
   `text` blocks, JSON in `json` blocks. Specify the language; the
   wiki and the repo both render it.
8. **Backticks for symbols in prose.** Command names, file paths,
   environment variable names, and config keys all go in backticks.

## Conventions specific to this project

1. **Refer to commands with the leading slash.** `/speckit.tdd.run`,
   not `speckit.tdd.run` or `run`. The slash makes the
   command shape clear and matches how a user invokes it.
2. **Refer to output by its real path.** The stack profile is
   `.specify/memory/tdd-profile.md`. The per-feature artifacts are
   `specs/<feature>/tdd/test-list.md`, `cycle-log.md`, and
   `verification.md`. Use `<feature>` for the spec-kit feature directory
   name, never `<spec>` and never an invented name.
3. **Always distinguish the three per-feature artifacts by role.** The
   test list is the plan, the cycle log is the append-only evidence, and
   the verification report is the grade. A sentence that says "the TDD
   file" is wrong.
4. **Behavior ids, states, and verdicts are written exactly as the
   templates define them.** `A1`/`U1`, `PENDING`/`RED`/`GREEN`/`DONE`/
   `BASELINE`/`BLOCKED`/`DROPPED`, and `PASS`/`PASS_WITH_GAPS`/`FAIL`/
   `BLOCKED`. Uppercase, in backticks, never paraphrased ("mostly
   passing" is not a verdict).
5. **Use the phrase "host AI agent" or "host agent"** when referring
   to Claude Code, Copilot, Codex, or any Spec Kit-aware assistant
   running the command prompt. Avoid "AI", "LLM", or "the model" in
   prose.
6. **Use the phrase "the extension"** for the TDD extension itself.
   Avoid "the plugin", "the product", or "this tool".
7. **Capitalize Spec Kit as two words.** Lowercase `specify` only when
   it is literally the CLI binary name (in code blocks).
8. **Governance and contributor rules live in `AGENTS.md` and
   `CONTRIBUTING.md`.** User pages link to them by absolute URL; they do
   not quote or restate them.

## Conventions for tables

1. **Pad cells.** The repo's existing tables are padded so the columns
   align in plain text. Mimic the existing padding when adding rows;
   do not realign the whole table.
2. **Header column order is fixed.** The "Command / What it does /
   Writes" table appears in `README.md` and `docs/Home.md`. The columns
   are always in that order.
3. **Anchor links from the table use the section header form** with
   punctuation stripped: `/speckit.tdd.run` →
   `#speckittddrun`.

## Headings

1. **One H1 per page**, matching the page title.
2. **Use sentence case for headings.** "Getting started", not
   "Getting Started" in body text. The page titles themselves are
   title-cased to match the filename convention used by GitHub Wiki
   (`Getting-Started.md` → "Getting Started" page title).
3. **No emoji in headings or body.** Use plain text. The wiki renders
   the same in repo and on GitHub Wiki, where emoji can break layout
   in `_Sidebar.md`.

## Code blocks

1. **Bash blocks** show what the user types. Do not include the shell
   prompt (`$`) unless distinguishing input from output.
2. **Output blocks** are `text`. Do not invent output. If you need to
   show fictional output, mark it (`# example output, your version
   may differ`).
3. **JSON / YAML blocks** are formatted to fit ~80 columns. If a real
   file exceeds that, show only the keys that matter for the point
   being made and elide the rest with `... `.

## What to avoid

1. Avoid "we" and "you" interchangeably in the same page. Pick one.
   `README.md` and `docs/Home.md` use "you" (addressing the reader).
   `docs/Architecture.md` is neutral and avoids both.
2. Avoid future tense for current behavior. "The command writes" not
   "The command will write".
3. Avoid hedging. "Probably", "might", "should" weaken instructions.
   If a behavior is conditional, name the condition.
4. Avoid links that depend on the rendered location. A link to
   `../README.md` works in the repo but not on GitHub Wiki. Use either
   an absolute URL (`https://github.com/...`) or a same-folder
   relative link (`Home.md`).
5. Avoid filenames in headings unless the page is specifically about
   the file. Mention the file in the first sentence of the section
   body instead.
