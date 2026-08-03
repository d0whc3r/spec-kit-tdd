# Examples

One feature, driven end to end by the TDD Extension. Every file here is a real
artifact shape produced by the four commands, kept in the repository so you can read
what the extension writes before installing it.

The feature is `003-user-auth` in a TypeScript service: session expiry plus scoping the
order list to the requesting user. Three acceptance criteria, four functional
requirements, two components, eleven cycles.

| File                                                                               | Written by            | What it is                                       |
| ---------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------ |
| [tdd-profile.md](tdd-profile.md)                                                   | `/speckit.tdd.setup`  | The verified stack commands and test conventions |
| [specs/003-user-auth/tdd/test-list.md](specs/003-user-auth/tdd/test-list.md)       | `/speckit.tdd.plan`   | The plan: behaviors, traces, states              |
| [specs/003-user-auth/tdd/cycle-log.md](specs/003-user-auth/tdd/cycle-log.md)       | `/speckit.tdd.run`    | The evidence: one entry per cycle                |
| [specs/003-user-auth/tdd/verification.md](specs/003-user-auth/tdd/verification.md) | `/speckit.tdd.verify` | The audit report and its verdict                 |

In a real project the profile lives at `.specify/memory/tdd-profile.md`. It sits at the
top level here so the example is browsable as one folder.

The stack is TypeScript because an example has to be written in something. The same
feature under pytest, `go test`, JUnit, or `cargo test` produces these same four files
with the same sections, and three lines per cycle differ: the test reference, the
command that produced the red, and the failure text, all three copied out of the runner.
[Stack
Profiles](https://github.com/d0whc3r/spec-kit-tdd/wiki/Stack-Profiles#the-same-cycle-in-five-ecosystems)
shows that cycle side by side in five ecosystems, which is why this folder holds one
language instead of five near-identical copies.

## What the test list caught before any code was written

The plan phase is the cheapest place to find a hole. Two of them showed up here:

- **AC-2 needed two behaviors, not one.** "Reject an expired session" was split into
  `U1` (expiry in the past) and `U2` (expiry exactly at the current instant), because a
  single test on one side of a threshold passes with both `<` and `<=`. Cycle 3 in the
  log is that boundary being pinned, and the mutation results confirm it: the
  `<=` to `<` mutant is caught.
- **`repository.ts` had no tests at all.** So `U5` was scheduled first as a
  characterization baseline, capturing what the code did for legacy customer records,
  before `U6` changed the query underneath it.

## What the cycle log records

```
## Cycle 3: U2 accepts a token expiring exactly at the current instant

- test: `src/auth/session.test.ts::accepts a token expiring now` (new)
- red: `pnpm vitest run src/auth/session.test.ts -t "accepts a token expiring now"`
  -> `AssertionError: expected 'expired' to be undefined` (1 failed)
- green: `src/auth/session.ts:31` changed `<` to `<=`. Suite -> 126 passed
- refactor: extracted `isExpired(claims, now)`; suite re-run green after the extraction
- commit: `9c2b117` (behavior), `5ee0a30` (structure)
```

Four facts per cycle, and the first one is the point: a real command with its real
failure output, recorded before the fix existed. That is what the audit re-checks
against git history rather than trusting.

Two cycles in the log show the honest handling of a test that passes on its first run
(`U7` and `U9`). Instead of claiming a red that never happened, the loop applies a
deliberate mutant, records that the test failed with the code broken, restores the
code, and says so.

## What the audit found

Verdict: `PASS_WITH_GAPS`. Discipline held and every criterion is covered end to end,
with two gaps worth reading:

- **Two behaviors are `LIKELY` instead of `PROVEN`,** because their commits were amended
  and git history can no longer corroborate that the test came first. The log says it
  did; the audit will not upgrade that to proven on the log's word alone.
- **One surviving mutant is a real finding.** `U8` asserts that an empty result is `[]`
  rather than `null`, which is correct, and passes even with the user filter inverted,
  because the result is empty either way. Mutation testing found it; coverage could
  not, because the line ran.

That second one is the whole reason the audit exists. `U8` reads as a good test.

## Reading order

1. [tdd-profile.md](tdd-profile.md) to see what "language agnostic" means concretely.
2. [test-list.md](specs/003-user-auth/tdd/test-list.md) for the plan.
3. [cycle-log.md](specs/003-user-auth/tdd/cycle-log.md) for the evidence, top to bottom.
4. [verification.md](specs/003-user-auth/tdd/verification.md) for the grade.

The format of each file is documented in the wiki: [Stack
Profiles](https://github.com/d0whc3r/spec-kit-tdd/wiki/Stack-Profiles), [Test List
Format](https://github.com/d0whc3r/spec-kit-tdd/wiki/Test-List-Format), and [Test
Quality](https://github.com/d0whc3r/spec-kit-tdd/wiki/Test-Quality).
