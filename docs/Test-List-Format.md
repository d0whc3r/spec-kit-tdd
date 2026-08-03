# Test List Format

The two artifacts that carry a feature's TDD state. The canonical format ships as
[`templates/tdd-test-list-template.md`](../templates/tdd-test-list-template.md);
this page is the field reference.

The **test list** is the plan: every behavior the feature must exhibit, traced to the
criterion it serves. The **cycle log** is the evidence: what actually failed, what
made it pass, and what was refactored, cycle by cycle.

They are separate on purpose. The list is rewritten as the plan evolves; the log is
append only and is what the audit reads. A list without a log is a wish, and a log
without a list is a diary.

## Where they live

```
specs/<feature>/
├── spec.md                 (spec-kit core)
├── plan.md                 (spec-kit core)
├── tasks.md                (spec-kit core, reordered by /speckit.tdd.plan)
└── tdd/
    ├── test-list.md        the plan
    ├── cycle-log.md        append-only evidence
    └── verification.md     the audit report
```

`specs/<feature>/` is the usual layout, not a fixed path. The current feature comes
from spec-kit's own resolver: `FEATURE_DIR` out of
`.specify/scripts/bash/check-prerequisites.sh --json --paths-only`, which reads
`SPECIFY_FEATURE_DIRECTORY` first and `.specify/feature.json` second. Either can point
outside `specs/`, which is why the commands build every path from `FEATURE_DIR` instead
of assuming one. If neither is set, the command asks rather than guessing from the
branch name.

There is no index across features. A cross-feature sweep globs `tdd/test-list.md` under
whatever tree holds the resolved feature directory and reads frontmatter.

## Test list frontmatter

```yaml
---
feature: 003-user-auth # spec-kit feature directory name
loop: outside-in # outside-in | inside-out
profile: .specify/memory/tdd-profile.md # stack profile the commands must read
spec_criteria: 7 # acceptance criteria found in spec.md
planned_at: abc1234 # short SHA the list was derived from
updated_at: abc1234 # short SHA of the last change to this file
suite_baseline: green # green | red | unknown, at planning time
---
```

`loop: outside-in` is the default: the acceptance test for a criterion is written
before the units beneath it. `inside-out` is for work with no user-visible surface of
its own, such as a pure library or an internal algorithm.

`suite_baseline` records whether the suite was green when the list was written. A red
baseline does not block planning, but the loop will not start on top of one, and the
audit needs to know which failures predate the feature.

## Behavior ids

Stable, never reused, never renumbered, because the cycle log references them:

- `A1`, `A2`, ... acceptance behaviors (the outer loop), one per acceptance criterion.
- `U1`, `U2`, ... unit behaviors (the inner loop).
- Behaviors discovered mid-loop append at the end of their series. A gap in the
  numbers is normal once something is dropped.

## Behavior states

| State      | Meaning                                                                         |
| ---------- | ------------------------------------------------------------------------------- |
| `PENDING`  | On the list, no test written yet                                                |
| `RED`      | Test written, failing for the right reason, evidence in the cycle log           |
| `GREEN`    | Test passing, full suite passing, refactor step not finished                    |
| `DONE`     | Passing, suite green, refactor completed or explicitly judged unnecessary       |
| `BASELINE` | Characterization test capturing existing behavior, green against untouched code |
| `BLOCKED`  | Cannot proceed, with a one-line reason                                          |
| `DROPPED`  | Out of scope, with a one-line reason. Kept in the table as the record           |

`RED` is a working state, not a resting state. A list left with a `RED` behavior at
the end of a session is reported as an unfinished cycle.

## Behavior kinds

| Kind               | Use it for                                                        | Needs                        |
| ------------------ | ----------------------------------------------------------------- | ---------------------------- |
| `example`          | The default. One concrete case with a known expected result       | Nothing beyond the runner    |
| `property`         | An invariant across all inputs: round trip, idempotence, ordering | A property-based library     |
| `contract`         | A boundary shared with another team or repository                 | A contract-testing tool      |
| `approval`         | Large structured output where assertions would be unreadable      | An approval or snapshot tool |
| `characterization` | Capturing what untested existing code currently does              | Nothing beyond the runner    |

Anything other than `example` requires the matching tool in the stack profile. If it
is not there, the behavior is recorded differently and the list says so: an invariant
becomes several example tests at the boundaries, and it is marked as sampled rather
than proven.

## The list body

Four sections, in this order:

1. **Outer loop: acceptance behaviors.** One table, one row per criterion, each
   observable through the real entry point.
2. **Inner loop: unit behaviors.** One table per component from `plan.md`, under the
   component's file path as a subheading.
3. **Invariants and edge cases still to place.** Behaviors that belong to the feature
   but have no home component yet. Each must become a numbered row before the feature
   is done, or be dropped with a reason.
4. **Out of scope.** Things a reader would expect and the one-line reason they are
   absent.

Plus **Verification commands**, copied verbatim from the profile so the list is
readable without opening another file.

Each table row is `id | behavior | traces | kind | state | test`. The `traces` column
holds acceptance criterion or requirement ids from `spec.md`, and the audit checks
mechanically that each one resolves.

## Cycle log entries

Append only. Newest last. One entry per completed cycle, plus a baseline entry
written at planning time.

```markdown
## Cycle 2: U2 accepts a token expiring exactly at the current instant

- test: `src/auth/session.test.ts::accepts a token expiring now` (new)
- red: `pnpm vitest run src/auth/session.test.ts -t "accepts a token expiring now"`
  -> `AssertionError: expected 'expired' to be undefined` (1 failed)
- green: `src/auth/session.ts:31` changed `<` to `<=`. Suite -> 126 passed
- refactor: extracted `isExpired(claims, now)`; suite re-run green after extraction
- commit: `9c2b117` (behavior), `5ee0a30` (structure)
```

The four facts that matter are the ones the audit cannot reconstruct afterwards: the
command that produced the red, its real output, what made it green, and what the
refactor changed.

A **Notes and deviations** section at the end carries anything that does not fit a
cycle: a step that was split and re-run, a reverted attempt, a test-after admission,
a pre-existing failing test that was already red at baseline.

Never edit a past entry. A correction is a new entry that says what it corrects.

## Quality bar

Before the list is finished, `/speckit.tdd.plan` checks:

- Every acceptance criterion has at least one `A` behavior.
- Every `traces` value resolves to a real id in `spec.md`.
- Every row is one behavior, phrased as an observable result rather than a call to
  make.
- Boundaries appear on both sides, not just the happy path.
- Error paths name the specific expected failure, never "handles errors".
- Every non-`example` kind is backed by a tool in the profile.
- The verification commands are copied verbatim from the profile.
- Anything a reader would expect and not find is named in "Out of scope" with a
  reason.
