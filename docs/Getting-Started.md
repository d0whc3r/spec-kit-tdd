# Getting Started

Zero to your first recorded red-green cycle. Budget five minutes for the setup and
one cycle, longer if your suite is slow.

## Prerequisites

- Spec Kit `>=0.12.17` initialized in the project (`specify init`). That is the first release that resolves the command names in the extension's commands for skills agents. It also resolves the feature directory from `.specify/feature.json`, and it runs a mandatory hook, which the `before_implement` hook depends on.
- A git repository.
- **A working test runner.** The extension detects and uses whatever is there. It
  will not create one for you: standing up a test framework is a feature's worth of
  work and its own decision.

## 1. Install

Install directly from the latest release:

```bash
specify extension add tdd --from https://github.com/d0whc3r/spec-kit-tdd/releases/download/v2.0.0/tdd-2.0.0.zip
```

Spec Kit shows the source URL and asks you to confirm. Change the version in the URL to pin a different release.

To update later, run the install command with a newer release URL and add `--force`:

```bash
specify extension add tdd --from <newer-release-zip-url> --force
```

Confirm it registered:

```bash
specify extension list              # 'tdd' listed, enabled
ls .specify/extensions/tdd          # extension files present
```

Spec Kit's community catalog is a discovery source. `specify extension search tdd` and `specify extension info tdd` show the extension and its release archive. Install from the archive URL as shown above. See [Troubleshooting](Troubleshooting.md#installation-errors).

This guide uses the dot form of the command names, which slash-command agents use, such as `/speckit.tdd.setup`. Skills agents use hyphens: type `/speckit-tdd-setup` in Claude Code and `$speckit-tdd-setup` in Codex.

## 2. Set up the stack, once

```text
/speckit.tdd.setup
```

This detects every stack in the repository, then **runs each candidate command** to
prove it works before recording it. It writes `.specify/memory/tdd-profile.md` and
offers a TDD principle for your project constitution.

Read the report before moving on. The useful part is usually negative:

- **The suite is already red.** Fix that first. No red the loop produces afterwards
  could be attributed to its own change.
- **No way to run a single test.** The loop will run whole files instead. Slower,
  still valid.
- **A package has no runner.** Work there needs characterization tests first, which
  `/speckit.tdd.plan` will schedule.
- **No mutation tool.** The audit will use deliberate mutants on a sample instead.

Accepting the constitution principle is what makes the discipline hold in later
sessions, when nobody remembers to ask for tests. It is optional and it is your
document, so it is only applied with your approval.

## 3. Specify the feature as usual

Nothing changes here. Use the core lifecycle:

```text
/speckit.specify <what you want to build>
/speckit.clarify
/speckit.plan
/speckit.tasks
```

## 4. Derive the test list

```text
/speckit.tdd.plan
```

If you left hooks enabled, `/speckit.tasks` already offered this and asked first.

It writes `tdd/test-list.md` inside the feature directory: one acceptance behavior
per acceptance criterion (the outer loop), the unit behaviors each component owns
(the inner loop), each traced to what it serves. It also edits `tasks.md` so test
tasks are no longer optional, each one sits before the implementation it covers, and
each behavioral task carries its behavior id (`[U3]`) so the loop can tick it later.

**Read the list now.** This is the cheapest moment in the whole feature to catch a
missing boundary case, an error path phrased as "handles errors", or a criterion
nobody can actually test. Fixing it here costs a sentence; fixing it after the loop
costs a rewrite.

## 5. Run the loop

Start with a single cycle so you can see one from end to end:

```text
/speckit.tdd.run next
```

Write one test, run it, confirm it fails for the right reason, record the failure,
make it pass with the smallest change, run the full suite, refactor while green,
tick the tasks that behavior covers, commit.

Read the cycle log entry it produced (`tdd/cycle-log.md` in the feature directory).
That entry, with the real failure message in it, is the evidence the audit will
check later.

When you are happy with the rhythm, let it walk the rest of the list, which is what
it does with no arguments:

```text
/speckit.tdd.run
```

It will stop and report rather than improvise if the suite goes red for an
unrelated reason, a criterion turns out ambiguous, or going green would require
changing a test it did not write.

If you left hooks enabled, `/speckit.implement` runs this for you and waits for it
before writing anything itself. The loop ticks the tasks it drove, so
`/speckit.implement` then covers only the work that is not a behavior change:
scaffolding, configuration, wiring.

## 6. Audit it

```text
/speckit.tdd.verify
```

Best run in a **fresh session**. The audit's whole value is that it has no memory
of the loop, so it reads what the tests actually say instead of what they were
meant to say.

It cross-checks three sources (the cycle log, git history, the files as they
stand), works through the test-smell rubric, runs mutation testing on the changed
files, and maps every acceptance criterion to a test. Then it writes
`tdd/verification.md` in the feature directory with one verdict: `PASS`,
`PASS_WITH_GAPS`, `FAIL`, or `BLOCKED`.

On a `FAIL`, it appends remediation tasks to `tasks.md`. Clear them, then re-run
the audit.

## The five-minute version

```text
/speckit.tdd.setup          # once per repository
/speckit.tdd.plan           # after /speckit.tasks
/speckit.tdd.run            # the loop, every behavior on the list
/speckit.implement          # whatever was not a behavior change
/speckit.tdd.verify         # fresh session, cold audit
```

## What to read next

- [Commands](Commands.md) for every modifier.
- [The Loop](The-Loop.md) for what the loop refuses to do, and why.
- [Examples](Examples.md) for the three artifacts, filled in.
