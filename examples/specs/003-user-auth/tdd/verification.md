---
feature: 003-user-auth
verdict: PASS_WITH_GAPS
verified_at: 9f3a1c2
behaviors: 12
proven: 9
likely: 2
test_after: 0
no_test: 0
high_smells: 0
criteria_total: 3
criteria_covered: 3
mutation_score: 87 # scope: 4 changed files, StrykerJS 9.2.0
mutants_survived: 3 # 2 equivalent, 1 real finding
suite: 133 passed, 0 failed, 41s
---

# TDD Verification: Session expiry and scoped order listing

**Verdict: PASS_WITH_GAPS.** The discipline holds, every acceptance criterion is
covered end to end, and no test was weakened anywhere in the branch. Two behaviors
could not be corroborated against git history because those commits were amended, and
one surviving mutant points at a real gap in an otherwise good test.

Audited from cold context at `9f3a1c2`. All three evidence sources were read: the
cycle log, `git log --stat` over `4f9c2e1..9f3a1c2`, and every test and source file the
branch touched.

## Test-first evidence

| Behavior | Class          | Evidence                                                                |
| -------- | -------------- | ----------------------------------------------------------------------- |
| A1, A3   | PROVEN         | cycle 11 red recorded; `8e02da5` adds the tests before the route change |
| A2       | PROVEN         | cycle 1 red recorded; `a1c04de` is the acceptance test alone            |
| U1       | PROVEN         | cycle 2 red recorded; `d41f8a2` adds test and source together           |
| U2       | PROVEN         | cycle 3 red recorded; `9c2b117` behavior, `5ee0a30` structure           |
| U3       | PROVEN         | cycle 4 red recorded with the failing seed; `71ad4e9`                   |
| U4       | LIKELY         | cycle 6 red recorded; `c9017f4` was amended, ordering not verifiable    |
| U6       | PROVEN         | cycle 8 red recorded; `0fa63b1`                                         |
| U7       | PROVEN         | cycle 5 records a deliberate mutant instead of a natural red, correctly |
| U8       | LIKELY         | cycle 9 red recorded; `2d4b7ff` was amended, ordering not verifiable    |
| U9       | PROVEN         | cycle 10 records a deliberate mutant; `6c1e93b` is the test alone       |
| U5       | NOT_APPLICABLE | characterization baseline, green against untouched code by definition   |

**Existing tests:** the branch diff removes no assertion, loosens no predicate, adds no
skip, and lowers no threshold. `src/orders/route.ts`'s existing tests were touched only
by the `requireSession()` extraction in `9f3a1c2`, and their assertions are byte
identical before and after.

## Findings

| #   | Severity | Finding                                                                                                                                                 | Evidence                               |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1   | MED      | `repository.test.ts::empty list` asserts the value is `[]` but not that the query ran with the user filter; the surviving mutant below slips through it | `src/orders/repository.test.ts:78`     |
| 2   | MED      | `session.test.ts::injected clock` asserts the clock was called but not what the session did with the value                                              | `src/auth/session.test.ts:64`          |
| 3   | LOW      | The expiry window literal `900` is repeated in four tests with no named constant                                                                        | `src/auth/session.test.ts:12,34,51,77` |
| 4   | LOW      | `U5`'s captured baseline returns orders for archived customers, which looks like a bug rather than a rule                                               | `src/orders/repository.test.ts:96`     |

Finding 4 is out of this feature's scope. It is recorded so the behavior is not
mistaken for an intended rule later, and it belongs in the next spec revision.

## Mutation results

Scope: the 4 files the feature changed. Tool: StrykerJS 9.2.0. Score: 87.

| Mutant                                                  | Behavior | Survived | Judgment                                                                                                   |
| ------------------------------------------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `session.ts:31` `<=` to `<`                             | U2       | No       | Caught by U2; the boundary is pinned                                                                       |
| `session.ts:48` removed the empty-subject guard         | U7       | No       | Caught by U7                                                                                               |
| `session.ts:44` changed a debug log string              | none     | Yes      | Equivalent mutant, no observable behavior                                                                  |
| `repository.ts:41` removed the user predicate           | U6       | No       | Caught by U6                                                                                               |
| `repository.ts:47` `[]` to `null`                       | U8       | No       | Caught by U8                                                                                               |
| `repository.ts:41` predicate inverted on the empty path | U8       | Yes      | **Real gap.** Finding 1: U8's test passes with the filter inverted, because the result is empty either way |
| `repository.ts:52` removed a redundant assignment       | none     | Yes      | Equivalent mutant                                                                                          |

The one real survivor is why the verdict is not a clean `PASS` on strength alone: U8's
test is correct about the return value and blind about the query. Finding 1 has the
remediation task.

## Traceability

| Criterion | Behaviors and tests | End to end              |
| --------- | ------------------- | ----------------------- |
| AC-1      | A1, U5, U6          | Yes                     |
| AC-2      | A2, U1, U2          | Yes                     |
| AC-3      | A3, U8              | Yes                     |
| FR-1      | U6                  | via AC-1                |
| FR-2      | U1, U3, U4, U7      | via AC-2                |
| FR-3      | U8                  | via AC-3                |
| FR-4      | U9                  | no criterion, unit only |

Untested criteria: none. Tests tracing to nothing: none. Every `traces` value in the
test list resolves to a real id in `spec.md`, and every named test exists and runs.

Coverage on the 4 changed files: 96 percent of lines, 91 percent of branches. The two
uncovered branches are the legacy path in `repository.ts:64`, which `U5` captures as a
baseline rather than exercising exhaustively.

## What was not audited

- `packages/legacy` was out of scope: no runner is configured, so nothing there is
  verified either way. `/speckit.tdd.setup` reported this as work of its own.
- Mutation was scoped to the 4 changed files, not the repository. A whole-repo run
  takes about 20 minutes and belongs in CI.
- Concurrency behavior (two simultaneous refreshes of one session) has no acceptance
  criterion and therefore no test. The test list raises it under "Invariants still to
  place".
- Clock skew between nodes: no requirement, no test, not assessed.
- Performance and load: no criterion, not assessed.
