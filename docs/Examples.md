# Examples

One feature driven end to end. Every artifact below is committed in the repository's
[`examples/`](../examples/) folder, so you can read what the extension writes before
installing it.

The feature is `003-user-auth` in a TypeScript service: session expiry plus scoping the
order list to the requesting user. Three acceptance criteria, four functional
requirements, two components, eleven cycles.

| Artifact                                                                 | Written by            |
| ------------------------------------------------------------------------ | --------------------- |
| [`tdd-profile.md`](../examples/tdd-profile.md)                           | `/speckit.tdd.setup`  |
| [`test-list.md`](../examples/specs/003-user-auth/tdd/test-list.md)       | `/speckit.tdd.plan`   |
| [`cycle-log.md`](../examples/specs/003-user-auth/tdd/cycle-log.md)       | `/speckit.tdd.run`    |
| [`verification.md`](../examples/specs/003-user-auth/tdd/verification.md) | `/speckit.tdd.verify` |

The stack is TypeScript because an example has to be written in something. It costs you
nothing if you are not in TypeScript: the same feature under pytest, `go test`, JUnit,
or `cargo test` produces the same four files with the same sections, and three lines per
cycle differ. [Stack Profiles](Stack-Profiles.md#the-same-cycle-in-five-ecosystems) shows
that cycle side by side in five ecosystems, which is why this folder holds one language
instead of five near-identical copies.

## 1. The profile

`/speckit.tdd.setup` detected vitest, ran each candidate command, and recorded only
what worked:

```yaml
runner: vitest
single: 'pnpm vitest run {file} -t "{name}"'
suite: pnpm test
coverage: pnpm test --coverage
mutation: 'pnpm stryker run --mutate "{files}"'
acceptance: pnpm playwright test {file}
contract: null
verified: [single, file, suite, coverage, mutation, acceptance]
suite_baseline: green
suite_seconds: 34
```

The body records the conventions the loop has to match (test file naming, the
`vi.fn()` double style, factories in `src/testing/factories.ts`, the injected `Clock`
port) plus one exemplar test file to imitate per test kind and the helper files a new
test reuses instead of hand-rolling. It also records what is missing:
`packages/legacy` has no runner, so work there needs characterization tests and has no
single-test command.

## 2. The test list

`/speckit.tdd.plan` turned three acceptance criteria into three outer-loop behaviors and
nine inner-loop behaviors, each traced:

| id  | behavior                                                    | traces     | kind             | state    |
| --- | ----------------------------------------------------------- | ---------- | ---------------- | -------- |
| A2  | An expired session is rejected with a 401 and no order data | AC-2       | example          | DONE     |
| U1  | Rejects a token whose expiry is in the past                 | AC-2, FR-2 | example          | DONE     |
| U2  | Accepts a token expiring exactly at the current instant     | AC-2       | example          | DONE     |
| U3  | Round-trips any valid claim set through encode and decode   | FR-2       | property         | DONE     |
| U5  | Current listing behavior for a legacy customer record       | AC-1       | characterization | BASELINE |

Two things the plan phase caught before any code existed:

- **AC-2 needed two behaviors.** "Reject an expired session" split into `U1` and `U2`,
  because one test on one side of a threshold passes with both `<` and `<=`.
- **`repository.ts` had no tests.** `U5` was scheduled first, capturing what the code
  did for legacy records as a baseline, before `U6` changed the query underneath it.

## 3. The cycle log

One entry per cycle. The `red` line is the point:

```
## Cycle 3: U2 accepts a token expiring exactly at the current instant

- test: `src/auth/session.test.ts::accepts a token expiring now` (new)
- red: `pnpm vitest run src/auth/session.test.ts -t "accepts a token expiring now"`
  -> `AssertionError: expected 'expired' to be undefined` (1 failed)
- green: `src/auth/session.ts:31` changed `<` to `<=`. Suite -> 126 passed
- refactor: extracted `isExpired(claims, now)` from the inline comparison; suite
  re-run green after the extraction
- commit: `9c2b117` (behavior), `5ee0a30` (structure)
```

A real command, its real failure output, recorded before the fix existed. Behavior and
structure landed as separate commits, so a reviewer reads one for correctness and one
for shape.

Two cycles show the honest handling of a test that passes on its first run:

```
## Cycle 10: U9 preserves the existing sort order

- red: passed on the first run. Deliberate mutant applied: removed the `ORDER BY` at
  `src/orders/repository.ts:44`, re-ran -> `AssertionError: expected [b, a] to
  deeply equal [a, b]` (1 failed). Restored, suite re-run -> 133 passed
- green: no production change needed. The behavior existed and is now pinned against
  the refactor in cycle 11
```

No fabricated red. The log says exactly what happened, and the audit can tell the
difference.

The **Notes and deviations** section records a step that was too big: cycles 2 and 3
were originally one attempt whose red covered two behaviors, so it was reverted to the
last green and split.

## 4. The verification report

Verdict: `PASS_WITH_GAPS`. Discipline held, every criterion is covered end to end, no
test was weakened anywhere in the branch. Two gaps:

**Two behaviors are `LIKELY`, not `PROVEN`.** Their commits were amended, so git history
can no longer corroborate that the test came first. The log says it did; the audit will
not upgrade that on the log's word alone.

**One surviving mutant is a real finding:**

| Mutant                                                  | Behavior | Survived | Judgment                                                           |
| ------------------------------------------------------- | -------- | -------- | ------------------------------------------------------------------ |
| `session.ts:31` `<=` to `<`                             | U2       | No       | Caught by U2; the boundary is pinned                               |
| `repository.ts:41` predicate inverted on the empty path | U8       | Yes      | **Real gap.** U8 passes with the filter inverted: empty either way |
| `session.ts:44` changed a debug log string              | none     | Yes      | Equivalent mutant, no observable behavior                          |

`U8` asserts that no orders yields `[]` rather than `null`, which is correct, and it
passes even with the user filter inverted because the result is empty either way. The
line runs, so coverage is satisfied. Mutation testing is what found it.

That finding is the reason the audit exists: `U8` reads as a perfectly good test.

The report closes with **What was not audited**: `packages/legacy` (no runner), the
mutation scope (4 changed files, not the repository), concurrency (no criterion, no
test), clock skew, and load behavior. Stating this is not optional. A report that reads
as exhaustive when it was not is worse than no report.

## Reading order

1. [`tdd-profile.md`](../examples/tdd-profile.md) for what "language agnostic" means
   concretely.
2. [`test-list.md`](../examples/specs/003-user-auth/tdd/test-list.md) for the plan.
3. [`cycle-log.md`](../examples/specs/003-user-auth/tdd/cycle-log.md) for the evidence,
   top to bottom.
4. [`verification.md`](../examples/specs/003-user-auth/tdd/verification.md) for the
   grade.

Formats are documented in [Stack Profiles](Stack-Profiles.md),
[Test List Format](Test-List-Format.md), and [Test Quality](Test-Quality.md).
