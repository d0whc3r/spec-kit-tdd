# FAQ

## Why not just tell the agent to write tests first?

Because "write the test first" is an instruction, and what you need is evidence. An
agent asked to be test-driven will happily produce a test file and an implementation in
one pass, describe the result as test-driven, and be perfectly sincere about it. Nothing
in the output distinguishes that from a real cycle.

What makes the difference checkable is the ordering being recorded as it happens (the
failure output, the command, the commit) and a separate pass with no memory of the
session cross-checking that record against git history. The discipline is the same
discipline a human follows. The addition is that it leaves a trail.

## Is TDD not already in spec-kit?

Partly, and optionally. spec-kit's task template includes test tasks marked OPTIONAL,
with a note to write them first, and you can make TDD mandatory through the project
constitution. That is the hook this extension plugs into: `/speckit.tdd.setup` proposes
the constitution principle, and `/speckit.tdd.plan` removes the optionality from the
task list and fixes the ordering.

What core spec-kit does not do is drive the per-behavior cycle, record the red, or check
afterwards whether the tests would catch a bug. That is what this adds.

## How does this differ from the BDD extension?

The `bdd` extension converts specs to Gherkin scenarios and scaffolds step definitions.
That is the outer loop's notation. This extension is the loop itself, plus the evidence
and the strength check.

They compose. If Gherkin scenarios already exist, `/speckit.tdd.plan` reads them as
outer-loop behaviors rather than deriving its own, and the loop drives the inner cycles
that make each scenario pass.

## What about the other testing extensions?

They cover different parts of the problem, and this one deliberately does not
reimplement them:

| Extension                      | What it does                                | Relationship                                                                |
| ------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------- |
| `bdd`, `reqnroll-bdd`          | Gherkin scenarios and step definitions      | Their scenarios become outer-loop behaviors                                 |
| `spectest`                     | Generates test scaffolds from spec criteria | Generated scaffolds become list items; the loop still drives each red       |
| `trace`                        | Requirement to test traceability matrix     | Overlaps the audit's traceability section; either can corroborate the other |
| `test-coverage-drift-control`  | Incremental coverage drift reports          | Coverage is corroboration in the audit, never the verdict                   |
| `v-model`                      | Paired dev and test specs with traceability | Complementary: it governs the artifacts, this governs the loop              |
| `golden-demo`                  | Behavioral drift oracle with fuzz vectors   | Its oracle is a strong `approval` or `property` kind on the list            |
| `qa`, `review`, `staff-review` | Post-implementation review                  | They review the code; this one grades the tests                             |

The gap this fills is the loop discipline and the test-strength check. Nothing in the
catalogue drives red-green-refactor per behavior or asks whether the tests would survive
a mutant.

## Does this slow everything down?

It changes where the time goes. The loop itself is not slower than writing code and
tests together, because the same tests get written either way. What it adds is a suite run
per cycle and a few seconds of reading the failure.

The real cost is the audit, especially mutation testing, which is why it is scoped to the
files the feature changed and why `quick` mode exists. A whole-repo mutation run belongs
in CI, not in a per-feature audit.

What it removes is the debugging session three weeks later where a green suite turned out
to prove nothing.

## Mutation testing sounds expensive. Is it required?

No, and it is scoped when it runs. The audit mutates only the files the feature changed,
reports the scope with the score so numbers stay comparable, and triages equivalent
mutants rather than dumping the raw list.

Where the ecosystem has no mutation tool, the audit uses deliberate mutants instead: for
the highest-risk behaviors, break the implementation in one small way, confirm a test
fails, restore. Fewer samples, same question answered, and the report states how many
behaviors were sampled so it cannot read as exhaustive.

## Mockist or classicist? London or Chicago?

Both, chosen per behavior. State-based testing with few doubles is the default for domain
logic, calculations, and state machines, because those tests survive refactoring. Doubles
at the boundary are right where the observable behavior _is_ the call: sending an email,
publishing an event, charging a card.

The extension takes a position on the limits rather than the school: never double the
unit under test, never assert on a double's return value the test configured itself, do
not double what you own and can construct cheaply, and inject time, randomness, network,
and filesystem.

## Does it work on legacy code with no tests?

That is the case it plans for explicitly. A component the feature must change but which
has no tests gets characterization behaviors first: tests that capture what the code does
today, including behavior that looks wrong, as a baseline. They are verified with a
deliberate mutant (so a vacuous baseline cannot slip through) and scheduled before the
behaviors that change that component.

What it will not do is create a test framework where none exists. That is a feature's
worth of work and its own decision, so it gets reported rather than done as a side
effect.

## Why is the audit a separate command?

Because a loop cannot grade itself. The session that wrote the tests knows what they were
meant to assert, and fills in that intent automatically when reading them. The gaps that
matter are exactly the ones that intent papers over.

Running `/speckit.tdd.verify` in a fresh session is the point. It reads what the tests say
rather than what they meant, and it will report that the audit was not independent if it
was run by the authoring session.

The same reasoning is why it never fixes what it finds. An auditor that edits the code it
grades has no standing to grade it.

## I squash my branches. Does that break it?

It costs you the strongest evidence. The audit's `PROVEN` class needs git history to
corroborate that the test file changed with or before the source. A squashed branch loses
that ordering, so those behaviors are classified `LIKELY` instead: the cycle log records a
red, but nothing independent confirms it.

`LIKELY` is not a failure and does not block a pass. It caps the verdict at
`PASS_WITH_GAPS`, and the report says why.

## Is the constitution principle mandatory?

No, and it is only applied with your explicit approval, because the constitution is your
document. But it is what makes the discipline hold in sessions where nobody remembers to
ask for tests, since `/speckit.plan`, `/speckit.tasks`, and `/speckit.implement` all read
it.

If an existing principle contradicts TDD, `/speckit.tdd.setup` presents both and asks
which governs rather than deciding for you.

## Does it support monorepos?

Yes. `/speckit.tdd.setup` records one stack entry per ecosystem, each with its own working
directory and its own commands, and never averages two into one. You can also scope it to
a subtree: `/speckit.tdd.setup packages/api`.

Running the suite from the wrong directory is the most common cause of a false green in a
monorepo, which is why `cwd` is recorded per stack.

## Can I use it without the full spec-kit lifecycle?

Partly. The commands read `spec.md` and `plan.md` to derive behaviors and to decide which
of a test or the code is wrong when they disagree, so a feature directory with a real
spec is what they are built for.

`/speckit.tdd.setup` is useful on its own in any repository. `/speckit.tdd.verify branch`
also works without a test list: it audits whatever the branch changed, with a weaker
verdict on ordering, which makes it a reasonable pre-pull-request check.

## What if a criterion cannot be tested?

`/speckit.tdd.plan` raises it rather than skipping it. For a criterion too ambiguous to
test, it presents the two candidate tests that would contradict each other and asks which
is intended. For a criterion with no observable result at all ("the system is
maintainable"), it proposes a concrete proxy or removal from the test list, and records
the decision either way.

Silently dropping an untestable criterion is how a feature ends up green with a
requirement nobody verified.

## Does the loop commit?

At green, one commit per cycle, with structural refactors as separate commits. It never
commits on red, never pushes, never merges, and never commits to a shared branch.

Whether it commits at all follows your repository's convention. It checks for an existing
one and asks once if that is unclear, and `--no-commit` turns it off.

## Will it edit my tests to make them pass?

No. That is the single hardest rule in the extension. No loosened assertion, no widened
tolerance, no value check turned into a truthiness check, no skip, no narrowed filter, no
lowered threshold. When a test and the code disagree, `spec.md` decides which is wrong,
and correcting a genuinely wrong test is its own step with a stated reason, taken before
the implementation change.

The audit checks the branch diff for exactly these edits, and any of them is a `FAIL`
condition on its own.

## Does the extension run by itself?

No. The commands are Markdown prompts. They need a Spec Kit-aware assistant to resolve
and execute them, and the release zip has no runtime of its own.

## How do I update it?

If you approved the community catalog, `specify extension update tdd`. Otherwise re-run
the direct install with a newer release URL:

```bash
specify extension add tdd --from https://github.com/d0whc3r/spec-kit-tdd/releases/download/v1.1.0/tdd-1.1.0.zip
```

Your `specs/` tree and your profile are not touched.
