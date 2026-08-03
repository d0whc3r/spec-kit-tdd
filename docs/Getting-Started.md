# Getting Started

Zero to your first recorded red-green cycle. Budget five minutes for the setup and
one cycle, longer if your suite is slow.

## Prerequisites

- Spec Kit `>=0.2.0` initialized in the project (`specify init`).
- A git repository.
- **A working test runner.** The extension detects and uses whatever is there. It
  will not create one for you: standing up a test framework is a feature's worth of
  work and its own decision.

## 1. Install

Install directly from the latest release. No catalog setup, and this is the only
way to pin a version:

```bash
specify extension add tdd --from https://github.com/d0whc3r/spec-kit-tdd/releases/download/v1.1.0/tdd-1.1.0.zip
```

Confirm it registered:

```bash
cat .specify/extensions/.registry   # 'tdd' entry present
ls .specify/extensions/tdd          # extension files present
```

Prefer `specify extension add tdd` by name? That needs the community catalog
approved once. See [Troubleshooting](Troubleshooting.md#installation-errors).

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

It writes `specs/<feature>/tdd/test-list.md`: one acceptance behavior per
acceptance criterion (the outer loop), the unit behaviors each component owns (the
inner loop), each traced to what it serves. It also edits `tasks.md` so test tasks
are no longer optional and each one sits before the implementation it covers.

**Read the list now.** This is the cheapest moment in the whole feature to catch a
missing boundary case, an error path phrased as "handles errors", or a criterion
nobody can actually test. Fixing it here costs a sentence; fixing it after the loop
costs a rewrite.

## 5. Run the loop

```text
/speckit.tdd.run
```

One cycle on the next pending behavior: write one test, run it, confirm it fails
for the right reason, record the failure, make it pass with the smallest change,
run the full suite, refactor while green, commit.

Read the cycle log entry it produced (`specs/<feature>/tdd/cycle-log.md`). That
entry, with the real failure message in it, is the evidence the audit will check
later.

When you are happy with the rhythm, let it continue:

```text
/speckit.tdd.run all
```

It will stop and report rather than improvise if the suite goes red for an
unrelated reason, a criterion turns out ambiguous, or going green would require
changing a test it did not write.

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
`specs/<feature>/tdd/verification.md` with one verdict: `PASS`,
`PASS_WITH_GAPS`, `FAIL`, or `BLOCKED`.

On a `FAIL`, it appends remediation tasks to `tasks.md`. Clear them, then re-run
the audit.

## The five-minute version

```text
/speckit.tdd.setup          # once per repository
/speckit.tdd.plan           # after /speckit.tasks
/speckit.tdd.run all        # the loop
/speckit.tdd.verify         # fresh session, cold audit
```

## What to read next

- [Commands](Commands.md) for every modifier.
- [The Loop](The-Loop.md) for what the loop refuses to do, and why.
- [Examples](Examples.md) for the three artifacts, filled in.
