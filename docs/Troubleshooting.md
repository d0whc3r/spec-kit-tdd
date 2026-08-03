# Troubleshooting

## Installation errors

### `installation is not allowed from that catalog`

```
Error: 'tdd' is available in the 'community' catalog but installation
is not allowed from that catalog.

To enable installation, add 'tdd' to an approved catalog
(install_allowed: true) in .specify/extension-catalogs.yml.
```

Expected behavior, not a broken release. Spec Kit ships the community catalog as
discovery only, so the CLI can list community extensions but will not install one until
you opt in. Two ways forward.

**Direct install (recommended).** No catalog config, always works, and the only way to
pin a version:

```bash
specify extension add tdd --from https://github.com/d0whc3r/spec-kit-tdd/releases/download/v1.1.1/tdd-1.1.1.zip
```

**Approve the community catalog once**, if you want to install and update by name:

```bash
specify extension catalog add https://raw.githubusercontent.com/github/spec-kit/main/extensions/catalog.community.json --name community --install-allowed
specify extension add tdd
```

Community extensions are author-maintained and not reviewed by Spec Kit. Read the source
before approving a catalog.

### The commands do not appear

Check the extension registered and the files are there:

```bash
cat .specify/extensions/.registry   # 'tdd' entry present
ls .specify/extensions/tdd          # extension.yml, commands/, templates/
```

Then restart or reload your assistant so it re-reads the command set. If the registry
entry exists and the files do not, re-run the install.

### The hooks never fire

Three hooks ship: `after_tasks` runs `plan`, `before_implement` runs `run`, and
`after_implement` runs `verify`. `after_tasks` and `after_implement` are `optional: true`,
so they prompt rather than run silently. If nothing prompts, check `auto_execute_hooks` in
`.specify/extensions.yml` and that the `tdd` entry is listed under `installed`. You can
always run all four commands by hand; the hooks are a convenience, not a requirement.

Hooks also need a recent Spec Kit. Before 0.11.9, spec-kit printed a mandatory hook's
directive without actually invoking it, which is why this extension requires `>=0.11.9`.

### `/speckit.implement` wrote the feature without running the loop

Check that `before_implement` in `.specify/extensions.yml` still reads `optional: false`.
spec-kit waits for a hook only when the flag is false; an optional pre-hook prints its
offer and the same run carries on to implement every unchecked task, test-after. If the
flag is right and the loop still did not run, you are on a Spec Kit older than 0.11.9.

### You want `/speckit.implement` without the loop in front of it

Set `enabled: false` on the `before_implement` hook in `.specify/extensions.yml`. spec-kit
filters disabled hooks before it reads the `optional` flag. Run `/speckit.tdd.run`
yourself when you want the loop.

### `/speckit.implement` re-implemented a behavior the loop already drove

The loop ticks a task only when it can read a behavior id from the task text, so an
unmarked behavioral task looks like open work to `/speckit.implement`. Re-run
`/speckit.tdd.plan refresh` to put the ids back on the open tasks, and check the loop's
report: it lists both the tasks it ticked and the open tasks with no marker.

## Profile problems

### `plan`, `run`, or `verify` stops asking for the profile

They refuse to guess a test command, because a guessed command that silently runs nothing
turns every red into a false green. Run `/speckit.tdd.setup` first.

### The profile is stale after a stack change

New runner, new package, changed CI command. Re-run:

```text
/speckit.tdd.setup refresh
```

It re-detects from scratch and reports every line that moved, rather than overwriting a
working command with a new guess.

### `setup` says the single-test command cannot be verified

It ran your candidate against a test name that matches nothing and the runner exited
successfully without saying so. That command is unusable for the loop. `setup` records
`single: null`, and the loop runs whole test files instead. Reds stay valid, they are just
slower to read.

If your runner has a strict mode or a "fail on no tests" flag, add it to the invocation
and re-run `setup refresh`. For vitest and jest that is usually
`--passWithNoTests=false`; for pytest, `--strict-markers` plus checking the exit code for
"no tests ran".

### A monorepo package uses the wrong commands

Each stack must have its own entry with its own `cwd`. Running the suite from the wrong
directory is the most common cause of a false green. Re-run scoped to that subtree:

```text
/speckit.tdd.setup packages/api
```

## The loop will not start

### The suite is red at baseline

The loop stops, on purpose. If the suite is already failing, no red it produces afterwards
can be attributed to its own change, and the audit cannot separate the two.

Fix the existing failures first, or if they are known and permanently excluded, make the
exclusion explicit in the runner config so the suite is genuinely green. Do not have the
loop work around it: excluding a test to make the baseline green is one of the edits the
audit reports as a `FAIL`.

### The suite is too slow to run every cycle

`setup` records the wall time and says when a per-cycle run is impractical. The answer is a
fast subset for the inner loop plus a full run before every commit. The loop asks for
agreement on that split before starting rather than silently narrowing what it runs.

### There is no test runner at all

`setup` reports it and stops. Standing up a test framework is a feature's worth of work
and its own decision, so the extension will not do it as a side effect of a TDD command.
Set the runner up, add one passing test, then re-run `setup`.

## Cycle problems

### A test passes the moment it is written

Expected sometimes, and handled. The loop applies a deliberate mutant: it breaks the
implementation in the smallest way that should violate the behavior, confirms the test now
fails, then restores the code exactly.

If the test still passes with the mutant in place, the test is worthless and gets
rewritten. If the behavior genuinely already existed, the list item is marked covered with
the existing test named, and the log says the red was a deliberate mutant rather than a
natural failure.

### The red is a syntax error, not an assertion failure

Not a valid red. It says the test is broken, not that the code is missing the behavior.
Fix the test and re-run for a real red. The exception is a language that needs the symbol
to exist before the test compiles: add the minimal declaration, re-run, and record the
resulting assertion failure.

### A behavior has been red for a long time

The step was too big. Revert to the last green, split the behavior into two list items,
and take the smaller one. Signals: more than one new production file was needed, the test
needs many lines of setup, or the implementation grew a branch the test does not exercise.

The cycle log's notes section records the split, which is what the audit reads to
understand why the ids are not contiguous.

### Going green would require changing an existing test

The loop stops and reports rather than doing it. Either the existing test encodes a rule
this feature changes, in which case the change needs its own list item, its own red, and a
note about which baseline moved. Or the new test is wrong. `spec.md` decides which.

### A characterization test fails immediately

A characterization test asserts what the code currently does, so a failure means the
assertion is wrong, not the code. Read the actual behavior again and correct the
assertion. If the code is genuinely broken, that is a finding to report, not something to
capture as a baseline.

### The cycle was interrupted mid-flight

```text
/speckit.tdd.run resume
```

It re-establishes state by re-running the tests rather than trusting the list's recorded
state, then continues that cycle.

## Audit problems

### Behaviors come back as `TEST_AFTER` and you did write the test first

Two usual causes.

**No red was recorded.** The audit cannot distinguish an unrecorded red from no red. If
the loop ran outside `/speckit.tdd.run`, add the evidence to the cycle log honestly (what
command, what output) or accept the classification.

**History shows the source landing first.** Check whether an earlier commit touched the
implementation for an unrelated reason. The audit reports what it sees; if the
interpretation is wrong, the report is the place to say so, not the classification.

### Everything comes back `LIKELY` instead of `PROVEN`

Your branch was squashed or rebased, so git history no longer shows the ordering. That is
not a failure and does not block a pass, but it caps the verdict at `PASS_WITH_GAPS`.

If you want `PROVEN`, keep the per-cycle commits until after the audit and squash on merge
instead.

### A surviving mutant inside a `DONE` behavior

This is the audit's most valuable finding: the test executes the line and would not notice
if the line were wrong. Read the mutant, then strengthen the assertion so it distinguishes
the two cases. The usual shapes are asserting a value but not the query that produced it,
or asserting a collection is empty without asserting why.

Do not raise the mutation threshold or exclude the file. The audit reports that as a
`FAIL`.

### Mutation testing times out or takes too long

Scope it. The audit already limits the run to the files the feature changed. If that is
still too slow, use `quick` for the per-feature audit and run mutation in CI on a
schedule. `quick` caps the verdict at `PASS_WITH_GAPS` by construction, which is honest:
strength was not measured.

### The audit says it was not independent

It was run by the same session that wrote the tests. That is a real limitation and it says
so rather than hiding it. Re-run it in a fresh session for a trustworthy grade.

### `verify` refuses to fix its findings

By design. Findings become remediation tasks in `tasks.md`, ordered with the blocking ones
first. Clear them with `/speckit.tdd.run` or by hand, then re-run the audit to confirm the
verdict moved.

## Feature resolution and task file problems

### The wrong feature was used

Resolution is spec-kit's, not the extension's. The commands read `FEATURE_DIR` from
`.specify/scripts/bash/check-prerequisites.sh --json --paths-only`, which resolves
`SPECIFY_FEATURE_DIRECTORY` first, then `.specify/feature.json`. If the wrong feature came
out, that is the state to fix: set `SPECIFY_FEATURE_DIRECTORY`, or re-run
`/speckit.specify` so `feature.json` points where you expect. Pass the directory name
explicitly to override for one call:

```text
/speckit.tdd.plan 003-user-auth
/speckit.tdd.verify 003-user-auth
```

### `tasks.md` edits conflict with your own

`/speckit.tdd.plan` preserves existing task ids, checkbox states, and formatting, inserts
and reorders only what is still open, and reports every change. If you would rather manage
the task file yourself:

```text
/speckit.tdd.plan --no-tasks
/speckit.tdd.verify --no-tasks
```

The test list is still written, so the loop and the audit work as normal.

### `refresh` renumbered a behavior

It should not have. Behavior ids are never reused or renumbered, because the cycle log
references them, and a criterion removed from `spec.md` becomes `DROPPED` with a reason
rather than being deleted. If ids moved, that is a bug worth
[reporting](https://github.com/d0whc3r/spec-kit-tdd/issues).

## Still stuck

Open an issue with the extension version (`grep version extension.yml`), the Spec Kit
version, the command you ran, the relevant part of `.specify/memory/tdd-profile.md`, and
the refusal or the difference between what you expected and what you got.
