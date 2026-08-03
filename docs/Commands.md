# Commands

Four commands. Each has one job, one moment in the lifecycle, and one set of files
it is allowed to write. The boundaries are deliberate: the command that grades the
work is not the command that does it.

| Command                                    | Runs                     | Reads                                                          | Writes                                                           |
| ------------------------------------------ | ------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`/speckit.tdd.setup`](#speckittddsetup)   | once per repository      | manifests, scripts, CI config, test layout                     | `.specify/memory/tdd-profile.md`, constitution (with approval)   |
| [`/speckit.tdd.plan`](#speckittddplan)     | after `/speckit.tasks`   | `spec.md`, `plan.md`, `tasks.md`, the profile                  | `specs/<feature>/tdd/test-list.md`, `cycle-log.md`, `tasks.md`   |
| [`/speckit.tdd.run`](#speckittddrun)       | the implementation phase | the test list, the profile, `spec.md`                          | tests, source, `specs/<feature>/tdd/cycle-log.md`                |
| [`/speckit.tdd.verify`](#speckittddverify) | after the loop           | the cycle log, git history, the tests and source as they stand | `specs/<feature>/tdd/verification.md`, remediation in `tasks.md` |

Two hooks fire automatically if you leave them enabled, and both ask first:
`after_tasks` runs `plan`, `after_implement` runs `verify`.

---

## /speckit.tdd.setup

Makes the repository's test stack explicit, so no later command has to guess. It
detects, then **proves each command by running it**, then writes one profile.

```text
/speckit.tdd.setup
/speckit.tdd.setup refresh              # re-detect from scratch, report what changed
/speckit.tdd.setup packages/api         # one subtree of a monorepo
/speckit.tdd.setup --no-constitution    # write the profile and stop
/speckit.tdd.setup --constitution-only  # profile is fine, only handle the principle
```

**Detection order.** Manifests, then the scripts they define, then the CI config,
then the actual test layout, then the lock file for tool availability. Whatever CI
runs to gate merges is the authoritative suite command, because that is what the
project already trusts.

**The check that matters most.** The single-test command is verified twice: once
against a test name that exists (it must run exactly that test) and once against a
name that matches nothing (it must report zero tests, not exit successfully in
silence). A command that passes the first and fails the second would turn every
red in the project into a false green.

**What it records.** Six capabilities: run one test, run the suite, useful failure
output, coverage, mutation, property-based testing. Plus the acceptance runner, the
contract tool, the approval or snapshot tool, watch mode, the test conventions to
match, and one exemplar test file the loop imitates. Anything unverified is
recorded as `null` with a note, never as a plausible guess.

**The constitution principle.** TDD holds only where the project's own rules say
so, because `/speckit.plan`, `/speckit.tasks`, and `/speckit.implement` all read
`.specify/memory/constitution.md`. The command proposes a principle, adapted to
your constitution's voice, and applies it only with your approval. If an existing
principle contradicts it, it presents both and asks rather than deciding.

**What it will not do.** Install a dependency, create a test framework, modify test
config, or write a command it did not run. See
[Stack Profiles](Stack-Profiles.md) for the profile format and the per-ecosystem
reference.

---

## /speckit.tdd.plan

Turns the specification into a test list, and makes the test tasks binding.

```text
/speckit.tdd.plan
/speckit.tdd.plan 003-user-auth   # a specific feature directory
/speckit.tdd.plan refresh         # re-derive against a changed spec, keeping ids
/speckit.tdd.plan outer-only      # acceptance behaviors only, plan.md not ready yet
/speckit.tdd.plan inside-out      # no user-visible surface, skip the outer loop
/speckit.tdd.plan --no-tasks      # leave tasks.md alone
```

**The outer loop.** One acceptance behavior per acceptance criterion in `spec.md`,
each observable through the feature's real entry point (the route, the CLI
invocation, the rendered screen, the public function). Not a unit beneath it. This
is the only test that fails when the units are individually right and collectively
wrong.

**The inner loop.** The unit behaviors each component from `plan.md` owns. For every
rule: the happy path, **both sides of every boundary**, the error paths with their
specific expected failures, and the invariants that must hold across inputs. A
threshold with only one test pins nothing, because `<` and `<=` pass the same
single test.

**Brownfield.** A component the feature must change but which has no tests gets
characterization behaviors first: tests that capture what the code does today,
including behavior that looks wrong, as a baseline. They are scheduled before the
behaviors that change that component.

**What it asks.** Only what the repository could not answer: criteria too ambiguous
to test (presented as two candidate tests, pick one), criteria with no observable
result at all, and whether a slow suite needs a fast inner-loop subset. One
question at a time, each with a recommendation.

**What it changes in `tasks.md`.** Test tasks stop being optional (spec-kit's
template treats them as optional by default), each test task is placed before the
implementation it covers, characterization tasks come before the changes they
protect, and each acceptance criterion gets a closing task requiring its
outer-loop test to be green. Existing task ids, checkbox states, and formatting are
preserved, and every edit is reported.

On `refresh`, behavior ids are never reused or renumbered, dropped behaviors stay
in the table with a reason, and a criterion that changed materially is reported
rather than silently re-tested. See [Test List Format](Test-List-Format.md).

---

## /speckit.tdd.run

The loop. One behavior per cycle.

```text
/speckit.tdd.run              # one cycle on the next PENDING behavior
/speckit.tdd.run next         # the same thing, spelled out
/speckit.tdd.run all          # keep cycling until the list is done
/speckit.tdd.run U3 U4        # specific behaviors, in that order
/speckit.tdd.run outer        # the next acceptance behavior
/speckit.tdd.run resume       # continue a cycle interrupted mid-flight
/speckit.tdd.run tcr          # test && commit || revert
/speckit.tdd.run --no-commit  # leave the changes uncommitted
```

**The cycle.** Select one behavior, write one test in the repository's existing
style, run only that test, confirm it fails for the right reason, record the real
failure output, make it pass with the smallest sufficient change, run the full
suite, refactor while green, append the cycle log entry, commit.

**It is the only command that writes tests or source.** Everything else reads,
plans, or grades.

**What counts as a valid red** and what to do when a test passes on its first run
(the deliberate-mutant check) is in [The Loop](The-Loop.md), along with step-size
guidance, test-double choice, and the forbidden shortcuts.

**`tcr` mode.** `test && commit || revert`: every green commits automatically, every
red discards the working change. It makes a long red impossible, which forces tiny
steps. It needs a clean tree and a fast suite, and it only runs when you ask for
it.

**When it stops.** Suite red at baseline, an ambiguous criterion where two
reasonable tests would contradict each other, a behavior that turns out impossible
or already implemented, a step that would require changing a test it did not write,
or a suite too slow to run per cycle. Each is reported with evidence instead of
worked around.

---

## /speckit.tdd.verify

The audit. Run it in a fresh session; a loop cannot grade itself.

```text
/speckit.tdd.verify
/speckit.tdd.verify quick      # skip mutation, verdict capped at PASS_WITH_GAPS
/speckit.tdd.verify deep       # mutation across every changed file, mutants on every high-risk behavior
/speckit.tdd.verify branch     # everything this branch changed, for a pre-PR check
/speckit.tdd.verify --no-tasks # report only, no remediation tasks
```

**Five questions, in order.** Did the tests come first? Do they assert behavior? Would
they catch a bug? Is every requirement covered? Are they worth keeping?

**Three evidence sources.** The cycle log (self-reported), git history (what
actually changed in what order), and the files as they stand (what is actually
asserted). Where they disagree, history wins over the log and the report says so.

**What it looks for in the diff.** Not just new tests: also what happened to
existing ones. An assertion removed or loosened, a value check turned into a
truthiness check, a widened tolerance, a test renamed out of a filter's reach, a
skip added, a threshold lowered. Each is reported with the before and after,
whatever justification was given.

**Test strength.** Mutation testing scoped to the changed files where the ecosystem
has a tool, with every survivor triaged and mapped to the behavior that should have
caught it. Deliberate mutants on the highest-risk behaviors where it does not, with
the sample size stated. See [Test Quality](Test-Quality.md).

**It fails closed.** Missing evidence is a gap, not an assumption of compliance. No
recorded red means test-after. Squashed history means unverifiable ordering.
Unmeasured mutation means unmeasured.

**It never fixes what it finds.** Findings become remediation tasks in `tasks.md`,
ordered so the blocking ones come first. Clearing them is the loop's job or yours.

---

## Modifier summary

| Modifier              | Applies to       | Effect                                                    |
| --------------------- | ---------------- | --------------------------------------------------------- |
| `refresh`             | `setup`, `plan`  | Re-detect or re-derive, preserving ids, reporting changes |
| a path                | `setup`          | Detect one subtree of a monorepo                          |
| a feature name        | `plan`, `verify` | Target that feature instead of the resolved one           |
| a behavior id         | `run`            | Run the loop on exactly those behaviors                   |
| `next`                | `run`            | One cycle on the first `PENDING` behavior. The default    |
| `all`                 | `run`            | Keep cycling until the list is done                       |
| `outer`               | `run`            | Work the next acceptance behavior                         |
| `resume`              | `run`            | Continue an interrupted cycle                             |
| `outer-only`          | `plan`           | Acceptance behaviors only                                 |
| `inside-out`          | `plan`           | No outer loop for this feature                            |
| `tcr`                 | `run`            | `test && commit \|\| revert`                              |
| `quick`               | `verify`         | Skip mutation and deliberate mutants                      |
| `deep`                | `verify`         | Widen mutation scope and mutant sampling                  |
| `branch`              | `verify`         | Audit the branch's changes rather than one feature        |
| `--no-constitution`   | `setup`          | Skip the constitution principle                           |
| `--constitution-only` | `setup`          | Only handle the constitution principle                    |
| `--no-tasks`          | `plan`, `verify` | Do not touch `tasks.md`                                   |
| `--no-commit`         | `run`            | Leave changes uncommitted                                 |
