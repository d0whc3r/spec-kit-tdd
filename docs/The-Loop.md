# The Loop

The discipline `/speckit.tdd.run` follows and `/speckit.tdd.verify` grades against.
The canonical version ships with the extension as
[`templates/tdd-loop-playbook.md`](../templates/tdd-loop-playbook.md); this page is
the user-facing tour of it.

Two ideas carry everything else:

1. **The test list is the plan.** TDD is not "write a test, then some code". It
   starts by listing the behaviors a change must exhibit, then converts them into
   tests one at a time. Anything discovered along the way is appended to the list
   instead of implemented on the spot, which is what keeps discovery from becoming
   scope creep.
2. **A test only counts if it can fail.** A test written after the code, or one that
   passes the moment it is written, proves nothing about the code. So the loop
   records the failure before the fix, and the audit re-checks that record against
   git history.

## The five steps

**1. The test list.** One line per behavior: the precondition, the observable
result, and what it traces to. Written by `/speckit.tdd.plan`, consumed top to
bottom, appended to as the loop learns.

**2. One concrete test.** Exactly one list item becomes one runnable test, in the
repository's existing style, named after the behavior, with the smallest fixture
that expresses it and one reason to fail.

**3. Red, for the right reason.** Run only that test. Capture the real output.

**4. Green, by the smallest change.** Make it pass and change nothing else. Then run
the full suite.

**5. Refactor while green.** Behavior-preserving cleanup with a green suite, re-run
after each move.

## What counts as a valid red

A valid red fails **because the behavior is missing**:

- an assertion failure showing expected and actual, or
- a deliberate "not implemented" signal from a stub the test drives, or
- an unresolved-symbol or compile error, but only where the language requires the
  symbol to exist before the test can run. In that case the minimal declaration is
  added and the resulting assertion failure is what gets recorded.

These are not valid reds:

| Symptom                                    | Meaning                              | What the loop does                              |
| ------------------------------------------ | ------------------------------------ | ----------------------------------------------- |
| Syntax error, wrong import, broken fixture | The test is broken, not the code     | Fix the test, re-run for a real red             |
| The test passes immediately                | Behavior exists, or nothing asserted | Deliberate-mutant check, below                  |
| The suite cannot start at all              | The stack profile is wrong or stale  | Stop; fix the profile first                     |
| A failure in an unrelated test             | Pre-existing breakage                | Record the baseline, report it, do not claim it |

## The deliberate-mutant check

When a test passes on its first run and the behavior is supposed to be new, the loop
breaks the implementation in the smallest way that should violate the behavior
(invert a condition, return a constant, drop a call), confirms the test now fails,
then restores the code exactly.

If the test still passes with the mutant in place, the test is worthless and gets
rewritten. This is the same question mutation testing answers, asked once, by hand,
at the only moment it is cheap.

## Step size

A cycle should complete in minutes. A red that stays red for longer than that means
the step was too big: revert to the last green, split the behavior in two, take the
smaller half.

Signals it was too big: more than one new production file was needed, the test needs
many lines of setup, or the implementation grew a branch the test does not exercise.
Signals it was too small: the test asserts a getter returns what the constructor was
handed, with no rule in between.

For the green step the loop prefers the transformation that adds the least behavior:
a constant before a variable, a variable before a conditional, a conditional before a
loop, a loop before recursion. Faking a return value and letting the next test force
the generalization is a legitimate move, not a shortcut.

**`tcr` mode** (`test && commit || revert`) enforces small steps mechanically: every
green commits, every red discards. It makes a long red impossible. It needs a clean
tree and a fast suite, and it only runs when you ask for it.

## Test doubles

The choice is per behavior, not per project. Both schools are legitimate and real
code needs both.

**State based, few doubles.** The default for domain logic, calculations, and state
machines: call the real thing, assert on the returned value or the resulting state.
These tests survive refactoring because they never named a collaborator. Prefer real
in-memory implementations of ports (a fake repository, an injected clock) over
method-by-method mocking.

**Interaction based, doubles at the boundary.** For behavior that _is_ the call:
sending an email, publishing an event, charging a card. There is no state to read
back, so asserting the call with the right payload is asserting the behavior.

Hard limits either way: never double the unit under test; never assert on a double's
return value that the test itself configured; do not double what you own and can
construct cheaply; inject time, randomness, network, and filesystem rather than
reaching for them.

## Brownfield work

Changing untested existing code is not TDD from a blank page. The loop first writes
**characterization tests**: tests that assert what the code currently does, including
behavior that looks wrong, as a baseline. They are expected to pass immediately
against untouched code, and they are verified with a deliberate mutant so a vacuous
one cannot slip through.

For large or structured output, an approval test (record the current output, diff
future runs against the approved file) captures the baseline faster than hand-written
assertions. The approved file gets reviewed once, carefully: an approved snapshot of
wrong output silently freezes a bug.

Only then does the red-green loop start on the new behavior. When a characterization
test later contradicts an intended change, updating it is itself a behavior change:
it gets its own list item, its own red, and a line in the log saying which baseline
changed and why.

## Beyond example tests

Example-based tests are the default. Three step-ups, each used when the behavior
calls for it and the tool exists in the profile:

- **Property-based tests** for invariants across all inputs: round trips,
  idempotence, ordering, conservation of totals. The loop pins one known example
  first, then generalizes, and always adds the shrunk counterexample back to the
  list as its own example test so the regression stays pinned.
- **Contract tests** at a boundary shared with another team or repository, which
  catch the integration drift that mocks on both sides hide.
- **Approval tests** for large structured output where hand-written assertions would
  be unreadable.

None of these replace the loop. They are the shape a particular red takes.

## Forbidden shortcuts

Every one of these is a hard stop, and the audit looks for each:

1. Writing the implementation first and the test after.
2. Weakening a test to make it pass: loosened assertion, widened tolerance, a value
   check turned into a truthiness check.
3. Deleting, skipping, or filtering out a failing test, including narrowing a test
   filter so it stops running.
4. Assertion-free tests.
5. Tautological tests: asserting a mock returns what it was configured to return, or
   re-implementing the production calculation inside the test.
6. Testing the implementation instead of the behavior: private internals, call counts
   no requirement mentions, exact log strings.
7. Changing the test to match the code. When they disagree, `spec.md` decides which
   is wrong.
8. Broadening the run: lowered coverage thresholds, mutation scoped away from the
   changed files, a suite invoked with a filter that hides reds.

Any of these found in existing work is reported, not silently corrected.

## Escape hatches

The loop stops and reports rather than improvising when the suite is red before the
first cycle, an acceptance criterion is ambiguous enough that two reasonable tests
would contradict each other, a behavior turns out impossible or already implemented,
going green would require changing a test it did not write, the suite is too slow to
run per cycle, or the change needs a credential or service the test environment does
not have.

A blocked loop with clear evidence is a successful outcome. Guessing past one of
these is how a green suite ends up meaning nothing.
