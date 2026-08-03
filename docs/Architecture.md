# Architecture

What the extension is, and what happens when you run a command.

## What ships

The release zip contains Markdown and nothing else:

```
extension.yml                          the manifest: 4 commands, 2 hooks
README.md
LICENSE
commands/
  speckit.tdd.setup.md
  speckit.tdd.plan.md
  speckit.tdd.run.md
  speckit.tdd.verify.md
templates/
  tdd-loop-playbook.md                 the loop discipline
  tdd-test-list-template.md            the test list and cycle log formats
  tdd-stack-profile.md                 detection, profile format, constitution principle
  tdd-test-quality-rubric.md           the audit standard
```

There is no runtime, no binary, no daemon, and no network call. `specify extension add`
unpacks this into `.specify/extensions/tdd/` of your project and registers the four
commands. The host assistant resolves the slash command, reads the Markdown, and acts on
it.

That is the whole mechanism, and it explains an important property: the extension cannot
do anything your assistant cannot do. It runs your test commands, reads your files, and
writes the artifacts. Nothing is hidden in a tool.

## Command to template map

Each command reads only the references it needs, by absolute path under
`.specify/extensions/tdd/templates/`, preferring a project override at
`.specify/templates/overrides/<name>.md` where one exists:

| Command  | Reads                                                                       |
| -------- | --------------------------------------------------------------------------- |
| `setup`  | `tdd-stack-profile.md`                                                      |
| `plan`   | `tdd-test-list-template.md`, `tdd-loop-playbook.md`, `tdd-stack-profile.md` |
| `run`    | `tdd-loop-playbook.md`, `tdd-test-list-template.md`, `tdd-stack-profile.md` |
| `verify` | `tdd-test-quality-rubric.md`, `tdd-test-list-template.md`                   |

The split matters. The command file holds the workflow and the boundaries; the template
holds the standard. That way the discipline is one document rather than four
paraphrases of it, and the audit grades against the same text the loop follows.

## The state the commands share

Four files, and nothing else:

```
.specify/memory/tdd-profile.md          repository level: verified commands, conventions
specs/<feature>/tdd/test-list.md        feature level: the plan
specs/<feature>/tdd/cycle-log.md        feature level: append-only evidence
specs/<feature>/tdd/verification.md     feature level: the audit report
```

No database, no lock file, no index across features. Commands find state by globbing
`specs/*/tdd/test-list.md` and reading frontmatter. Every artifact is plain Markdown you
can read, edit, and diff, and all of it is committed alongside the code it describes.

The profile is the hard precondition. `plan`, `run`, and `verify` stop if it is missing
rather than guessing a test command, because a guessed command that silently runs nothing
is worse than no command at all.

## What happens on each run

**`/speckit.tdd.setup`** reads the manifests, the scripts they define, the CI config, the
test layout, and the lock file. Then it runs each candidate command, including the
single-test command twice (against a name that exists and a name that does not). It
writes the profile with only what it verified, and proposes the constitution principle.

**`/speckit.tdd.plan`** resolves the feature, reads `spec.md` and `plan.md`, derives the
outer-loop behaviors from the acceptance criteria and the inner-loop behaviors from the
components, runs the suite for a baseline, and writes the test list plus the cycle log's
baseline entry. Then it edits `tasks.md`: test tasks become mandatory and each one is
placed before the implementation it covers.

**`/speckit.tdd.run`** reads the profile, the test list, `spec.md`, and the exemplar test
file. Then per behavior: write one test, run only it, confirm and record the failure,
make it pass, run the suite, refactor on green, append the log entry, commit. It is the
only command that writes tests or source.

**`/speckit.tdd.verify`** reads the cycle log, the git history for the feature's commit
range, and every test and source file the branch touched. It classifies test-first
evidence, works the smell catalogue, runs mutation scoped to the changed files, maps
criteria to tests, assigns a verdict, writes the report, and appends remediation tasks.
It changes no test and no source, with one bounded exception: a deliberate mutant is
applied and restored, and the restore is verified by re-running the suite.

## The hooks

```yaml
hooks:
  after_tasks: speckit.tdd.plan
  after_implement: speckit.tdd.verify
```

Both are `optional: true`, so spec-kit prompts before running them and you can decline.
They exist because those are the two moments the discipline is most often skipped: right
after tasks are generated (when tests are still marked optional) and right after
implementation (when the suite is green and nobody wants to look closer).

`/speckit.tdd.run` is deliberately not hooked. It is the command you drive.

## Why the boundaries are split this way

Three separations do the real work:

**Planning is separate from doing.** The test list is derived from the specification
before any code is written. A list derived while implementing would just describe the
implementation.

**Doing is separate from grading.** `/speckit.tdd.verify` runs cold, ideally in a fresh
session, and never fixes what it finds. The session that wrote the tests fills every gap
from memory, so it is structurally unable to see the gaps that matter. An auditor that
edits the code it grades destroys the only thing that made the grade worth reading.

**Detection is separate from both.** The profile is written once, by running commands, so
the loop never has to guess and the audit can say exactly which capabilities were
available.

## What it does not do

- It does not generate a test suite from a spec in one pass. That is the opposite of the
  loop.
- It does not create a test framework, install a dependency, or modify test config.
- It does not push, merge, or commit to a shared branch.
- It does not fix its own findings.
- It does not know your language. Everything ecosystem-specific comes from the profile,
  which came from your repository.
