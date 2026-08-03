# How to Use the TDD Extension

This document explains how to install the extension, what each command needs as
input, what it produces as output, and in what order to run them.

---

## Prerequisites

- Spec Kit `>=0.11.9` initialized in your project (`specify init`). That is the
  first release that both resolves the feature directory from `.specify/feature.json`
  and actually runs a mandatory hook, which `before_implement` depends on. The extension
  plugs into the core lifecycle (`/speckit.specify`, `/speckit.clarify`,
  `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`), so those must be
  available.
- A git repository. The audit reads history to corroborate that tests came first,
  and the loop commits per cycle.
- **A working test runner.** This is the one hard requirement the extension cannot
  create for you. `/speckit.tdd.setup` will tell you if the repository has none,
  and standing one up is a feature's worth of work, not a side effect of a TDD
  command.

---

## Install

Install directly from the latest release. This needs no catalog setup and is the
recommended path:

```bash
specify extension add tdd --from https://github.com/d0whc3r/spec-kit-tdd/releases/download/v1.1.0/tdd-1.1.0.zip
```

Change the version in the URL to pin a different release.

Prefer to install and update by name with `specify extension add tdd`? That
resolves the extension from Spec Kit's community catalog, which ships as discovery
only (`install_allowed: false`). Approve it once, then add and update by name:

```bash
specify extension catalog add https://raw.githubusercontent.com/github/spec-kit/main/extensions/catalog.community.json --name community --install-allowed
specify extension add tdd
specify extension update tdd
```

If `specify extension add tdd` fails with `installation is not allowed from that
catalog`, that is why.

After install, four slash commands become available in your assistant.

---

## The Commands

| Command               | Reads                                                          | Writes                                                         | Role                                                     |
| --------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| `/speckit.tdd.setup`  | manifests, scripts, CI config, test layout                     | `.specify/memory/tdd-profile.md`, constitution (with approval) | Make the stack explicit, once per repository             |
| `/speckit.tdd.plan`   | `spec.md`, `plan.md`, `tasks.md`, the profile                  | `tdd/test-list.md`, `tdd/cycle-log.md`, `tasks.md`             | Criteria become a test list, test tasks become mandatory |
| `/speckit.tdd.run`    | the test list, the profile, `tasks.md`, `spec.md`              | tests, source, `tdd/cycle-log.md`, the tasks it completed      | Drive red-green-refactor, one behavior per cycle         |
| `/speckit.tdd.verify` | the cycle log, git history, the tests and source as they stand | `tdd/verification.md`, remediation in `tasks.md`               | Grade the discipline and the strength of the tests, cold |

Paths in the Writes column are relative to the feature directory spec-kit resolves,
usually `specs/<feature>/`. `/speckit.tdd.run` is the only command that writes tests
or source. The other three read, plan, and grade. `verify` never fixes what it finds, on purpose: an
auditor that edits the code it grades cannot be trusted about it.

---

## Input and Output Flow

```
 spec-kit core                    the extension                         specs/<feature>/tdd/
 -------------                    -------------                         --------------------

 (once)                    ->  /speckit.tdd.setup   ->  detect + prove  ->  .specify/memory/tdd-profile.md

 /speckit.specify
 /speckit.plan
 /speckit.tasks            ->  /speckit.tdd.plan    ->  criteria to     ->  test-list.md (behaviors PENDING)
       |                          (after_tasks hook)     behaviors           cycle-log.md (baseline)
       |                                                                     tasks.md (tests mandatory, ordered)
       v
 /speckit.implement        ->  /speckit.tdd.run     ->  red -> green    ->  cycle-log.md (one entry per cycle)
   (waits for it)              (before_implement hook)  -> refactor          test-list.md (state -> DONE)
                                                        -> commit            tasks.md (behavioral tasks ticked)
                                                                             tests + source in the working tree

 /speckit.implement        ->  /speckit.tdd.verify  ->  evidence,       ->  verification.md (verdict)
   (after it finishes)         (after_implement hook)   smells,             tasks.md (remediation phase)
                                                        mutants
```

---

## Recommended Order

A typical feature, start to finish:

```
1. /speckit.tdd.setup                      (once per repository)
2. /speckit.specify, /speckit.clarify, /speckit.plan, /speckit.tasks
3. /speckit.tdd.plan                       (or accept the after_tasks hook)
4. Read <feature dir>/tdd/test-list.md     (it is meant to be reviewed)
5. /speckit.tdd.run                        (every behavior; /speckit.implement
                                            runs this first and waits for it)
6. /speckit.implement                      (whatever was not a behavior change)
7. /speckit.tdd.verify                     (or accept the after_implement hook)
8. Clear any remediation tasks, then re-run /speckit.tdd.verify
```

Steps 1 and 2 are independent: set up the stack whenever, the spec whenever. From
step 3 on, the order matters, because each command's precondition is the previous
one's output.

---

## Command Details

### `/speckit.tdd.setup`

Detects every stack in the repository, proves each command by running it, and
writes one profile. Also proposes the TDD principle for your project
constitution, which is what makes the discipline survive sessions where nobody
asks for it.

```text
/speckit.tdd.setup
/speckit.tdd.setup refresh              # re-detect and report what changed
/speckit.tdd.setup packages/api         # one subtree of a monorepo
/speckit.tdd.setup --no-constitution    # profile only
/speckit.tdd.setup --constitution-only  # principle only
```

The most valuable thing it does is negative: it tells you when the suite is
already red, when there is no way to run a single test, or when a package has no
runner at all. Each of those changes what you should do next.

### `/speckit.tdd.plan`

Reads `spec.md` and `plan.md` and writes the test list: one acceptance behavior
per acceptance criterion (the outer loop), plus the unit behaviors each component
owns (the inner loop), every line traced to the criterion or requirement it
serves. Then it edits `tasks.md`: test tasks stop being optional, each one is
placed before the implementation it covers, and every behavioral task carries its
behavior id (`[U3]`) so the loop can tick it later.

```text
/speckit.tdd.plan
/speckit.tdd.plan 003-user-auth   # a specific feature
/speckit.tdd.plan refresh         # re-derive against a changed spec, keeping ids
/speckit.tdd.plan outer-only      # acceptance behaviors only, plan.md not ready
/speckit.tdd.plan inside-out      # no user-visible surface, skip the outer loop
/speckit.tdd.plan --no-tasks      # leave tasks.md alone
```

Read the list before running the loop. This is the cheapest moment to catch a
missing boundary case or a criterion nobody can test.

### `/speckit.tdd.run`

The loop. One behavior per cycle: write one test, run it, confirm it fails for the
right reason, record the failure, make it pass with the smallest change, run the
full suite, refactor while green, tick the tasks that behavior covers, commit.

With no arguments it walks the whole list, because the `before_implement` hook
invokes it without arguments and one cycle out of twenty would leave the rest to be
written test-after.

```text
/speckit.tdd.run              # every PENDING behavior, one cycle each
/speckit.tdd.run all          # the same thing, spelled out
/speckit.tdd.run next         # stop after one cycle
/speckit.tdd.run U3 U4        # specific behaviors, in that order
/speckit.tdd.run outer        # the next acceptance behavior
/speckit.tdd.run resume       # continue an interrupted cycle
/speckit.tdd.run tcr          # test && commit || revert, stricter
/speckit.tdd.run --no-commit  # leave the changes uncommitted
```

It stops rather than improvising when the suite is red at baseline, an acceptance
criterion is ambiguous enough that two reasonable tests would contradict each
other, or going green would require changing a test it did not write. A blocked
loop with evidence is a good outcome.

It ticks a task's checkbox only when every behavior the task text names is `DONE`.
That is what `/speckit.implement` reads to decide what is left, so the two never
implement the same behavior twice.

### `/speckit.tdd.verify`

The audit, run from cold context because a loop cannot grade itself. Three
independent evidence sources: the cycle log (self-reported), git history (what
actually changed in what order), and the files as they stand (what is actually
asserted). Where they disagree, the report says so.

```text
/speckit.tdd.verify
/speckit.tdd.verify quick      # skip mutation, verdict capped at PASS_WITH_GAPS
/speckit.tdd.verify deep       # mutation across every changed file
/speckit.tdd.verify branch     # everything this branch changed, before a PR
/speckit.tdd.verify --no-tasks # report only, no remediation tasks
```

It fails closed. Missing evidence is a gap, never an assumption of compliance:
no recorded red means test-after, squashed history means unverifiable ordering,
and unmeasured mutation means unmeasured.

---

## The TDD Artifacts

Everything lives inside the feature directory spec-kit already created. That
directory comes from `SPECIFY_FEATURE_DIRECTORY` or `.specify/feature.json`, so
`specs/003-user-auth/` below is the usual layout rather than a fixed path:

```
specs/
└── 003-user-auth/
    ├── spec.md              (spec-kit core)
    ├── plan.md              (spec-kit core)
    ├── tasks.md             (spec-kit core, reordered by /speckit.tdd.plan)
    └── tdd/
        ├── test-list.md     the plan: behaviors, traces, states
        ├── cycle-log.md     append-only evidence, one entry per cycle
        └── verification.md  the audit report and its verdict
```

Plus one repository-level file, `.specify/memory/tdd-profile.md`, holding the
verified commands and the test conventions to match.

The **test list** carries a stable id per behavior (`A1`, `A2` for acceptance,
`U1`, `U2` for units), what it traces to, its kind (`example`, `property`,
`contract`, `approval`, `characterization`), its state (`PENDING`, `RED`, `GREEN`,
`DONE`, `BASELINE`, `BLOCKED`, `DROPPED`), and the test that covers it.

The **cycle log** is append only. Each entry records the red command and its real
failure output, what made it green, what the refactor changed, and the commit.
That record is the audit's primary evidence, which is why it is never edited after
the fact.

There is no index file across features. A cross-feature sweep globs
`tdd/test-list.md` under whatever tree holds the resolved feature directory and reads
frontmatter.

---

## Common Refusals

| Situation                                              | Behavior                                                                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| The suite is red before the first cycle                | The loop stops and reports the failing tests. No red it produces afterwards could be attributed to its change.       |
| A test passes the moment it is written                 | Deliberate-mutant check: break the code, confirm the test fails, restore. If it still passes, the test is rewritten. |
| Going green needs an existing test loosened or skipped | Refused. If a test is genuinely wrong, that is its own step with a stated reason, before the implementation.         |
| You ask `verify` to fix what it found                  | Declines and points at the remediation tasks it wrote. Grading and fixing stay separate.                             |
| No mutation tool in the ecosystem                      | Falls back to deliberate mutants on the highest-risk behaviors, and reports which were sampled.                      |
| A criterion has no testable observable result          | Raised as a question with a proposed proxy, rather than silently skipped.                                            |
| The stack profile is missing                           | `plan`, `run`, and `verify` stop and tell you to run `/speckit.tdd.setup`. They never guess a command.               |
