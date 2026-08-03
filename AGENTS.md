# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan

<!-- SPECKIT END -->

## Agent Boundaries

This repository ships the TDD Extension for Spec Kit: a language-agnostic
red-green-refactor loop for the spec-kit lifecycle. It exposes four commands
(`/speckit.tdd.setup`, `/speckit.tdd.plan`, `/speckit.tdd.run`,
`/speckit.tdd.verify`) and two lifecycle hooks (`after_tasks` runs `plan`,
`after_implement` runs `verify`).

| Agent         | Skill Surface                           | Notes                                         |
| ------------- | --------------------------------------- | --------------------------------------------- |
| Spec Kit core | `commands/speckit.tdd.*.md` (canonical) | Shipped in the release zip with `templates/`. |

Rules:

1. Canonical command files live at `commands/speckit.tdd.<verb>.md`. There is no second copy of a command anywhere in this repo.
2. Changing the command surface requires updating in lockstep: the canonical file, `extension.yml` `provides.commands`, the `catalog.json` `provides.commands` count, and the `REQUIRED` list in `.github/scripts/validate-manifest.mjs`. Changing the hook surface requires the same lockstep across `extension.yml` `hooks` and the `catalog.json` `provides.hooks` count.
3. Renaming or removing a command is a breaking change and requires a `feat!:` or `BREAKING CHANGE:` commit.
4. Adding or renaming a shipped template requires updating the `TEMPLATES` table in `.github/scripts/lint-content.mjs` with its canonical headings, and the command that references it. A template no command reads is dead weight and the lint will not catch it for you.
5. **The per-command write boundaries are the product and are non-negotiable:**
   - `setup` writes `.specify/memory/tdd-profile.md`, and `.specify/memory/constitution.md` only with explicit user approval.
   - `plan` writes `specs/<feature>/tdd/test-list.md`, the baseline entry of `specs/<feature>/tdd/cycle-log.md`, and `specs/<feature>/tasks.md`.
   - `run` is the only command that writes tests or source code, and only under the loop discipline: test first, red observed and recorded, smallest green, refactor on green.
   - `verify` writes `specs/<feature>/tdd/verification.md` and a remediation section in `tasks.md`. It never fixes what it finds. An auditor that edits the code it grades is worthless, and any change that blurs this is a breaking change to the extension's contract.
6. Two invariants hold across every command and must survive every edit: a test is never weakened, skipped, deleted, or filtered out to reach green; and red-phase evidence is only ever recorded for a run that actually happened.
7. Shipped content (commands, templates) uses plain English and no em dashes; `.github/scripts/lint-content.mjs` enforces this along with the canonical heading order of every template.

<!-- CODEGRAPH_START -->

## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question                                                       | Tool                                         |
| -------------------------------------------------------------- | -------------------------------------------- |
| "How does X work? / trace X / explain a system / architecture" | `codegraph_explore` (seed with symbol names) |
| "Where is X defined?" / "Find symbol named X"                  | `codegraph_search`                           |
| "What calls function Y?"                                       | `codegraph_callers`                          |
| "What does Y call?"                                            | `codegraph_callees`                          |
| "What would break if I changed Z?"                             | `codegraph_impact`                           |
| "Show me Y's signature / source / docstring"                   | `codegraph_node`                             |
| "Give me focused context for a task/area"                      | `codegraph_context`                          |
| "What files exist under path/"                                 | `codegraph_files`                            |
| "Is the index healthy?"                                        | `codegraph_status`                           |

### Rules of thumb

- **`codegraph_explore` is the workhorse for understanding questions** ("how does X work", "trace…", "explain the Y system"). Feed it the key symbol/file names and read its output (line-numbered source from many files in one call). If the question names nothing concrete, do one quick `codegraph_search`/`codegraph_context` to surface the names, then explore with them. Fill gaps with `codegraph_node`/Read — don't grep-and-read your way through; that's the loop explore replaces.
- **Delegating exploration to a subagent?** Tell it to call `codegraph_explore` first and trust the result. A generic "explore"-style agent defaults to grep+Read and treats codegraph as just a search index, throwing away the token savings.
- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: _"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"_

<!-- CODEGRAPH_END -->
