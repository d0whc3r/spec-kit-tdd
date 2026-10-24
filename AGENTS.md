# AGENTS.md

This repository is the TDD extension for [Spec Kit](https://github.com/github/spec-kit). The extension adds a red-green-refactor loop to the Spec Kit lifecycle. It ships four commands, four templates, and four hooks. The repository root is the extension root.

## Commands

Use Node 24 (`.nvmrc`) and pnpm 12 (`packageManager` in `package.json`).

| Command              | What it does                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm install`       | Installs the tools and the husky pre-commit hook. The hook runs oxfmt on staged files.                            |
| `pnpm check`         | Runs `validate`, `sync:check`, `lint`, and `lint:content`. CI runs it on every pull request and before a release. |
| `pnpm format`        | Formats all files with oxfmt.                                                                                     |
| `pnpm sync`          | Copies the identity fields from `package.json` into `extension.yml` and `catalog.json`.                           |
| `pnpm web:build`     | Copies `examples/` into `web/public/examples/` and builds the site into `web/dist/`.                              |
| `pnpm build`         | Builds `dist/tdd-<version>.zip` and validates the unpacked copy. It needs `zip` and `unzip`.                      |
| `pnpm catalog:issue` | Writes `upstream-catalog-issue-v<version>.md` for the upstream catalog. Never file or post it yourself.           |

Before you finish a change, run `pnpm check` and `pnpm web:build`. Both must pass.

## Layout

| Path                             | Contents                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `commands/speckit.tdd.<verb>.md` | The four command prompts. Each command has one copy only.                                                           |
| `templates/tdd-*.md`             | Reference files that the commands read at run time.                                                                 |
| `extension.yml`                  | The manifest: commands, hooks, `category`, `effect`, and `requires.speckit_version`.                                |
| `catalog.json`                   | The catalog entry. The release pipeline writes `version`, `download_url`, `sha256`, `requires`, and the timestamps. |
| `package.json`                   | The source of `description`, `author`, `homepage`, `repository`, `license`, and `keywords` (the catalog `tags`).    |
| `docs/`                          | The wiki source. `sync-wiki.yml` publishes it on every push to `main`.                                              |
| `web/`                           | The GitHub Pages site (Vite and TypeScript). `web/public/examples/` is generated. Do not edit it.                   |
| `examples/`                      | Real artifacts from a full loop. The site shows them.                                                               |
| `.github/scripts/`               | The pipeline scripts (zx): validate, sync, lint, build, release, wiki, and catalog issue.                           |
| `.agents/skills/`                | The repository skills. `.claude/skills` links here. `skills-lock.json` pins the external skills.                    |

The release zip contains only `extension.yml`, `README.md`, `LICENSE`, `commands/`, and `templates/`. `.extensionignore` gives `specify extension add --dev` the same set. Keep it in sync with `INCLUDE` in `.github/scripts/build-zip.mjs`.

## Rules

1. Keep one copy of each command, at `commands/speckit.tdd.<verb>.md`.
2. Change related files together. A command change touches the command file, `provides.commands` in `extension.yml`, the `provides.commands` count in `catalog.json`, and `REQUIRED` in `.github/scripts/validate-manifest.mjs`. A hook change touches `hooks` in `extension.yml` and the `provides.hooks` count in `catalog.json`.
3. Treat a renamed or removed command as a breaking change. Use a `BREAKING CHANGE:` footer. The release preset (angular) ignores a `feat!:` header.
4. When you add or rename a template, update the `TEMPLATES` table in `.github/scripts/lint-content.mjs` and the command that reads the template.
5. Keep the write boundaries of each command. They are the product:
   - `setup` writes `.specify/memory/tdd-profile.md`. It writes `.specify/memory/constitution.md` only after the user approves.
   - `plan` writes `<FEATURE_DIR>/tdd/test-list.md`, the baseline entry of a new `<FEATURE_DIR>/tdd/cycle-log.md`, and `<FEATURE_DIR>/tasks.md`. When the test list exists, it runs as `refresh` and keeps every behavior id, state, and cycle-log entry.
   - `run` is the only command that writes tests or source code. It also writes the test list, the cycle log, and the checkboxes of the `tasks.md` tasks whose behaviors are `DONE`. `/speckit.implement` reads only the checkboxes, so an unticked task gets a second, test-after implementation.
   - `verify` writes `<FEATURE_DIR>/tdd/verification.md` and a remediation section in `tasks.md`. It never fixes what it finds.
6. Keep two invariants in every command. A test is never weakened, skipped, deleted, or filtered out to reach green. Red evidence is recorded only for a run that happened.
7. Write shipped content (commands and templates) in plain English with no em dashes. `pnpm lint:content` checks this and the heading order of each template.
8. In a command, write each Spec Kit command name as a token in backticks, such as `` `__SPECKIT_COMMAND_TDD_PLAN__` ``. At install time, Spec Kit replaces it with `/speckit.tdd.plan` for slash-command agents or `/speckit-tdd-plan` for skills agents. Templates keep plain names, because Spec Kit copies them without changes. `pnpm lint:content` rejects a literal `/speckit.` name in a command.

## Gotchas

- Keep `before_implement` at `optional: false`. Spec Kit waits only for a mandatory hook. With an optional pre-hook, `/speckit.implement` writes the feature test-after in the same run.
- The Spec Kit minimum (`>=0.12.17`) is the first release that resolves the command tokens for skills agents. It appears in `extension.yml`, `catalog.json`, `README.md`, `WORKFLOW.md`, `docs/Getting-Started.md`, `docs/Troubleshooting.md`, and `web/index.html`. `pnpm validate` compares only the first two. Update the others by hand.
- Keep `after_converge` pointed at `plan`. `/speckit.converge` appends tasks with no behavior ids, and without the hook `/speckit.implement` builds them test-after.
- Do not edit versions or the pinned release URLs by hand. semantic-release sets them from Conventional Commits through `.github/scripts/semantic-release-prepare.mjs`.
- oxfmt turns a token outside backticks into bold text (`**SPECKIT_COMMAND_TDD_PLAN**`). Keep each token inside backticks.
- User docs (`README.md`, `WORKFLOW.md`, `docs/`, `web/`) use the dot form (`/speckit.tdd.plan`). Each page also shows the hyphen form of skills agents (`/speckit-tdd-plan`) where a command name first appears.
- Renovate (`renovate.json`) is the only dependency updater. Every update uses the `chore` type, because no npm dependency ships in the zip.
- oxfmt formats Markdown and indents list continuation lines. Run `pnpm format` before `pnpm check`.

<!-- CODEGRAPH_START -->

## CodeGraph

`.mcp.json` configures the CodeGraph MCP server. Use `codegraph_explore` first for questions about the code in `.github/scripts/` and `web/src/`. Use grep for literal text in the Markdown content.

<!-- CODEGRAPH_END -->
