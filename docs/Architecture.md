# Architecture

What the extension is, and what happens when you run a command.

## What ships

The release zip contains Markdown and nothing else:

```
extension.yml                          the manifest: 4 commands, 3 hooks
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

Each command reads only the references it needs, resolved through spec-kit's own
template stack (first match wins): `.specify/templates/overrides/<name>.md`, then
`.specify/presets/<preset-id>/templates/<name>.md`, then the extension's own copy at
`.specify/extensions/tdd/templates/<name>.md`. Presets sit above extensions on
purpose, so a team preset can tighten this extension's discipline without forking
it:

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
<FEATURE_DIR>/tdd/test-list.md          feature level: the plan
<FEATURE_DIR>/tdd/cycle-log.md          feature level: append-only evidence
<FEATURE_DIR>/tdd/verification.md       feature level: the audit report
```

`<FEATURE_DIR>` is whatever spec-kit resolves for the current feature, from
`SPECIFY_FEATURE_DIRECTORY` or `.specify/feature.json`. It is usually
`specs/<feature>/`, and the commands never assume it: they read it from
`check-prerequisites.sh --json --paths-only` and build every path from it, because a
feature configured elsewhere would otherwise be planned in one tree and read from
another.

No database, no lock file, no index across features. A cross-feature sweep globs
`tdd/test-list.md` under the tree that holds the resolved feature directory and reads
frontmatter. Every artifact is plain Markdown you can read, edit, and diff, and all of
it is committed alongside the code it describes.

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

**`/speckit.tdd.run`** reads the profile, the test list, `tasks.md`, `spec.md`, and the
exemplar test file. Then per behavior: write one test, run only it, confirm and record the
failure, make it pass, run the suite, refactor on green, append the log entry, tick the
tasks that behavior covers, commit. It is the only command that writes tests or source.

**`/speckit.tdd.verify`** reads the cycle log, the git history for the feature's commit
range, and every test and source file the branch touched. It classifies test-first
evidence, works the smell catalogue, runs mutation scoped to the changed files, maps
criteria to tests, assigns a verdict, writes the report, and appends remediation tasks.
It changes no test and no source, with one bounded exception: a deliberate mutant is
applied and restored, and the restore is verified by re-running the suite.

## The hooks

```yaml
hooks:
  after_tasks: speckit.tdd.plan # optional: true
  before_implement: speckit.tdd.run # optional: false
  after_implement: speckit.tdd.verify # optional: true
```

They sit at the three moments the discipline is most often skipped:

- **`after_tasks`.** Tasks have just been generated with tests still marked optional. This
  is where the test list gets derived and the optionality removed. Optional, because
  nothing runs after it: `/speckit.tasks` prints the offer and stops, so you can accept it
  whenever you like.
- **`before_implement`.** The next step writes code, so this is the only hook that has to
  run before its caller continues. Mandatory for a mechanical reason: spec-kit waits for a
  hook only when `optional: false`. An optional pre-hook prints its offer and
  `/speckit.implement` carries straight on to write the whole feature in the same run,
  which is the exact failure the hook exists to prevent. It runs `/speckit.tdd.run` with
  no arguments, which is why the loop's default is `all`.
- **`after_implement`.** The suite is green and nobody wants to look closer. This is where
  the audit runs. Optional, same reason as `after_tasks`.

**How the two implementation paths avoid doing the work twice.** `/speckit.implement`
decides what to implement from the `[X]` checkboxes in `tasks.md` and nothing else, so the
loop ticks the tasks it completes. `/speckit.tdd.plan` puts the behavior id in the task
text (`[U3]`), `/speckit.tdd.run` ticks a task once every behavior it names is `DONE`, and
`/speckit.implement` then covers only what is left: the scaffolding, configuration, and
wiring that never belonged in a red-green cycle. `/speckit.tdd.verify` checks the coupling
from the other side and reports a task ticked against a behavior that is not `DONE`.

Do not want the loop in front of every `/speckit.implement`? Set `enabled: false` on the
hook in `.specify/extensions.yml`; spec-kit filters disabled hooks out before it reads the
`optional` flag. The loop is then yours to run by hand.

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

## Why four commands and not fewer

Four is the floor, not a preference. Each merge that looks tempting breaks one of the
three separations above or breaks a hook:

- **`plan` into `run`.** The list would then be derived by the same pass that writes the
  code, which is the failure mode the extension exists to fix, and `after_tasks` would have
  no command to offer at the moment tests are still marked optional.
- **`verify` into `run`.** An auditor that graded its own work would fill every gap from
  memory. This is the one separation that cannot be traded for convenience.
- **`setup` into `plan`.** Detection runs the suite and proves each command. Doing that per
  feature would either be paid on every plan or, worse, skipped and guessed. It is
  repository state, not feature state, and it changes only when the stack does.

What could be cut instead is surface, not commands: the modifiers. They are each one line
in a command file, and they exist because a real loop gets interrupted (`resume`), audited
in a hurry (`quick`), or run under a stricter contract (`tcr`).

## What it does not do

- It does not generate a test suite from a spec in one pass. That is the opposite of the
  loop.
- It does not create a test framework, install a dependency, or modify test config.
- It does not push, merge, or commit to a shared branch.
- It does not fix its own findings.
- It does not know your language. Everything ecosystem-specific comes from the profile,
  which came from your repository.
