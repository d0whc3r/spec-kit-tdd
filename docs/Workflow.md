# Workflow

Where the loop sits in the spec-kit lifecycle, and what it leaves behind.

## The lifecycle with TDD in it

```
 spec-kit core                       the extension                       artifacts
 -------------                       -------------                       ---------

 (once per repo)             ->  /speckit.tdd.setup      ->  .specify/memory/tdd-profile.md
                                 detect + prove              constitution principle (with approval)

 /speckit.specify
 /speckit.clarify
 /speckit.plan
 /speckit.tasks              ->  /speckit.tdd.plan       ->  specs/<feature>/tdd/test-list.md
                                 (after_tasks hook)          specs/<feature>/tdd/cycle-log.md (baseline)
                                                             specs/<feature>/tasks.md (tests mandatory)

 /speckit.implement          ->  /speckit.tdd.run        ->  tests + source in the working tree
   (waits for it)                (before_implement hook)     cycle-log.md (one entry per cycle)
                                 red -> green -> refactor    test-list.md (states -> DONE)
                                 one commit per cycle        tasks.md (behavioral tasks ticked)

 /speckit.implement          ->  /speckit.tdd.verify     ->  specs/<feature>/tdd/verification.md
   (after it finishes)           (after_implement hook)      tasks.md (remediation phase)
```

`setup` is independent of any feature. Everything from `plan` onward is per feature,
and each command's precondition is the previous one's output.

## Two ways to run the implementation phase

**Drive the loop directly.** `/speckit.tdd.run` walks the whole test list, one behavior
per cycle, and is the tightest form of the discipline. Use it when the feature is
mostly behavior: rules, calculations, validation, state transitions. When it finishes,
every behavioral task is ticked and the remaining tasks are the ones that never
belonged in a red-green cycle.

**Run `/speckit.implement`.** The `before_implement` hook runs the loop first, waits for
it, and only then lets the core command work through what is left. That is not a
suggestion the hook prints: spec-kit waits for a hook only when it is not optional, so
this one is mandatory. Use this path when the feature carries a lot of scaffolding,
configuration, or wiring alongside the behavior.

The two paths meet at the checkboxes. `/speckit.implement` decides what to implement
from `[X]` in `tasks.md` and nothing else, so the loop ticks each task once every
behavior its text names (`[U3]`) is `DONE`. Without that, the same behavior would be
written twice, the second time test-after over freshly test-driven code.

Either way, `/speckit.tdd.verify` grades the result the same way, and it reports a task
ticked against a behavior that is not `DONE`.

## The double loop

The outer loop is the feature's acceptance criteria. The inner loop is the
components beneath them.

```
outer loop (hours)                      inner loop (minutes)

pick the next acceptance behavior
  write the acceptance test  --> RED
                                  |
                                  +--> pick the next unit behavior
                                  |      write one unit test   --> RED
                                  |      smallest change       --> GREEN
                                  |      refactor while green  --> GREEN
                                  |      commit
                                  |    repeat until the acceptance test can pass
                                  v
  acceptance test           --> GREEN
  refactor across units     --> GREEN
  commit, mark the behavior done
```

The acceptance test is written first and stays red for as long as the feature is
incomplete. That red is expected. Its value is that it is the only test that fails
when every unit is individually correct and the composition is wrong, which is the
failure mode unit tests structurally cannot see.

## The artifacts

Everything lives inside the feature directory spec-kit already created, plus one
repository-level profile:

```
.specify/memory/tdd-profile.md          verified commands + test conventions

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

**The test list** is the plan and is rewritten as the plan evolves. Each behavior has
a stable id (`A1`, `A2` for acceptance, `U1`, `U2` for units), what it traces to, its
kind, its state, and the test that covers it.

**The cycle log** is the evidence and is append only. Each entry holds the red
command and its real failure output, what made it green, what the refactor changed,
and the commit. Nothing is ever edited after the fact, because that record is what
the audit checks.

**The verification report** is overwritten on each run; git history keeps the old
ones.

`specs/003-user-auth/` is the usual location, not a requirement. The commands read the
feature directory from spec-kit (`SPECIFY_FEATURE_DIRECTORY`, then
`.specify/feature.json`) and build every path from it, so a feature configured outside
`specs/` still works. There is no index file across features: a cross-feature sweep globs
`tdd/test-list.md` under whatever tree holds the resolved feature directory and reads the
frontmatter.

Full field reference in [Test List Format](Test-List-Format.md).

## Behavior states

```
PENDING  ->  RED  ->  GREEN  ->  DONE
                                  ^
BASELINE (characterization, green against untouched code)
BLOCKED  (with a reason)
DROPPED  (out of scope, kept as the record)
```

`RED` is a working state, not a resting state. A list left with a `RED` behavior at
the end of a session is reported as an unfinished cycle.

## Commit shape

One commit per completed cycle, at green, containing the test and the implementation
that makes it pass. Structural refactors are their own commits with the suite
unchanged, so a reviewer reads a structural commit for shape and a behavioral commit
for correctness.

The loop never commits on red, never pushes, never merges, and never commits to a
shared branch. Whether it commits at all follows your repository's convention, and
it asks once if that is unclear.

This shape is also what makes the audit's history check work: interleaved test and
source commits per behavior are exactly the pattern a disciplined loop leaves
behind, and a squashed branch loses it.

## Re-running

- `/speckit.tdd.setup refresh` when the stack changes: new runner, new package, CI
  command changed.
- `/speckit.tdd.plan refresh` when `spec.md` changes: new criteria append new
  behaviors, removed criteria become `DROPPED`, and ids are never reused.
- `/speckit.tdd.run resume` after an interrupted session, to re-establish state from
  the tests themselves before continuing.
- `/speckit.tdd.verify` after clearing remediation tasks, to confirm the verdict
  moved.
