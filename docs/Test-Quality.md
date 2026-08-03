# Test Quality

What `/speckit.tdd.verify` grades against, and why a green suite is not the same as a
tested feature. The canonical rubric ships as
[`templates/tdd-test-quality-rubric.md`](../templates/tdd-test-quality-rubric.md).

## The problem this solves

Tests generated in the same pass as the code they check tend to pass while proving
very little. The recurring patterns are well documented and they all read as
reasonable tests at a glance:

- Asserting that a double returns what the test configured it to return.
- Re-implementing the production calculation inside the test, so both are wrong
  together.
- Stubbing the very unit the test claims to verify.
- Calling the code and asserting nothing, or only that it did not throw.
- Asserting truthiness where a specific value is required.
- Mocking every dependency, so the test passes with a completely wrong
  implementation.

Coverage does not catch any of these, because every one of them executes the line.
Coverage counts execution; the question that matters is whether a bug would have been
caught.

## The five questions

The audit works through them in order, and says which stage failed:

1. **Did the tests come first?** Is there recorded evidence that each behavior's test
   existed and failed before the code that satisfies it?
2. **Do the tests assert behavior?** Or doubles, internals, or nothing?
3. **Would they catch a bug?** Mutation testing, or deliberate mutants.
4. **Is every requirement covered?** Every acceptance criterion reaching a test
   through the real entry point.
5. **Are they worth keeping?** Deterministic, fast, readable, insensitive to
   refactoring.

## Three evidence sources

| Source                             | Answers                                     | Can be wrong because                       |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------ |
| `tdd/cycle-log.md` in the feature  | What the loop claims, with the red output   | It is self-reported                        |
| Git history for the feature        | What order test and source actually changed | Squashed or amended commits lose the order |
| The tests and source as they stand | What the tests actually assert today        | It cannot show what came first             |

All three get read. History wins over the log; the files win over both about what is
asserted. Disagreement between them is itself a finding, and a log entry claiming a
red that history contradicts is more serious than most smells.

## Test-first classification

| Class            | Criteria                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- |
| `PROVEN`         | Red recorded in the log, and history shows the test changing with or before the source |
| `LIKELY`         | Red recorded, but history cannot corroborate the order (squashed or amended commits)   |
| `TEST_AFTER`     | No red recorded, or the source landed in an earlier commit than its test               |
| `NO_TEST`        | The behavior has no test at all                                                        |
| `NOT_APPLICABLE` | A characterization baseline, green by definition against untouched code                |

Squashing a branch before the audit downgrades `PROVEN` to `LIKELY`. That is not a
failure, but it does cost you the strongest evidence you had.

## What the audit checks in the diff

Not only the new tests. What the change did to tests that already existed is the
highest-signal check in the whole audit:

- An assertion removed, loosened, or replaced by a weaker predicate.
- A value check turned into a truthiness check, or a widened tolerance.
- A test renamed so it no longer matches a filter that used to select it.
- A test marked skipped, pending, or excluded through config.
- A coverage threshold or mutation scope lowered.

Each is reported with the `file:line` and the before and after, whatever
justification was given. Any of them is a `FAIL` condition on its own.

The audit also reads `tasks.md` against the test list, because the checkboxes are what
the rest of the lifecycle trusts. A task ticked against a behavior that is not `DONE` is
a completion claim with no evidence behind it, and a `HIGH` finding. A behavioral task
still unticked with its behavior `DONE` is the milder inverse, and is reported too:
`/speckit.implement` would write that behavior a second time.

## The smell catalogue

Severities are fixed: `HIGH` means the test proves nothing or actively misleads,
`MED` means it will decay, `LOW` means readability.

`HIGH`: assertion free, tautological assertion, re-implemented expectation, doubled
subject, over-mocked collaborators, vacuous assertion, self-approving snapshot,
conditional logic in the test, empty or always-skipped test.

`MED`: implementation coupled, assertion roulette, eager test, magic values, mystery
guest, non-deterministic, sleepy test, redundant test, foreign style, bypassed test
utility, framework under test.

`LOW`: duplicated setup, unclear name.

The last four `MED` items are graded against your repository rather than against an
absolute rule, so the audit opens the profile's conventions, the exemplar for each
test kind, and every recorded helper before the pass: a redundant test is one another
test at the same level already pins, and foreign style or a bypassed utility means the
test works but does not look like the suite it joined. An acceptance test and a unit
test covering the same criterion is double-loop TDD, not redundancy.

The full definitions are in the shipped rubric. Every `HIGH` is reported with what the
test asserts today and what it should assert instead, and the audit does not rewrite
it: fixing is a separate, explicit step.

Beyond the catalogue, the audit notes any behavior whose tests are not isolated,
deterministic, fast, specific about what broke, or insensitive to refactoring. A suite
can be smell free and still be a poor safety net if it takes twenty minutes or fails
intermittently.

## Mutation testing

The mechanical answer to "would these tests catch a bug", and the only thing that
reliably exposes a tautology that reads fine.

**With a tool in the profile** (StrykerJS, PIT, mutmut, Stryker.NET, cargo-mutants,
Infection, gremlins, and so on): the run is scoped to the files the feature changed,
because a whole-repo run is a CI job rather than an audit step. The score is reported
with its scope and the tool version, so it is comparable next time. More importantly,
every **surviving mutant** is triaged and mapped to the behavior that should have
caught it. A survivor inside a behavior marked `DONE` is a `HIGH` finding: that test
does not test what it claims.

Equivalent mutants (a changed log message, a redundant initialization) are judged and
set aside rather than dumped into the report as noise.

**Without a tool**: deliberate mutants on the highest-risk behaviors, meaning the ones
an acceptance criterion depends on and anything touching money, auth, persistence, or
data loss. One small change each, run the behavior's test, expect a failure, restore
exactly, re-run the suite to confirm green. The report states how many behaviors were
sampled and which, so it cannot read as exhaustive.

Coverage, where available, is corroboration only: uncovered branches show where to
look, never the verdict.

## Verdicts

| Verdict          | Conditions                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PASS`           | Every behavior `PROVEN` or `LIKELY`; no `HIGH` smells; every criterion covered end to end; mutation survivors triaged with none inside a `DONE` behavior           |
| `PASS_WITH_GAPS` | No `HIGH` smells and no untested criteria, but weak evidence: `LIKELY` instead of `PROVEN`, mutation unmeasured, coverage unavailable. Gaps listed one by one      |
| `FAIL`           | Any `HIGH` smell, any `TEST_AFTER` or `NO_TEST` behavior, any weakened or skipped existing test, any uncovered criterion, or any survivor inside a `DONE` behavior |
| `BLOCKED`        | The audit could not run: no runner, suite red for unrelated reasons, or no test list                                                                               |

It fails closed. Missing evidence is a gap, never an assumption of compliance.
`quick` mode skips mutation, which caps the verdict at `PASS_WITH_GAPS` by
construction.

Every report ends with **What was not audited**: the packages skipped, the mutation
scope, the concerns with no criterion and therefore no test. A report that reads as
exhaustive when it was not is worse than no report.

The report's frontmatter also names the rubric file the audit resolved (`standard:`).
Because a project or a preset can override the rubric, a verdict only means something
next to the standard that produced it.

## Remediation

Findings become remediation tasks appended to the feature's `tasks.md`, one per
finding, referencing the finding number and the `file:line`, phrased as a verifiable
change with the command that proves it done, `HIGH` first. On a `FAIL`, the section
states that the feature is not done until the blocking findings are cleared.

The audit never fixes them itself. An auditor that edits the code it grades destroys
the only thing that made the grade worth reading.
