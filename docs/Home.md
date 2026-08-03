# TDD Extension Wiki

A Spec Kit extension that makes the implementation phase test-driven, in any
language. It turns a feature's acceptance criteria into a test list, drives
red-green-refactor one behavior at a time while recording the failure that
preceded each fix, then audits the result from cold context.

```
spec-kit  ->  /speckit.specify ... /speckit.tasks       (the specification)
you       ->  /speckit.tdd.plan                          (criteria become a test list)
loop      ->  /speckit.tdd.run                           (red, green, refactor, logged)
audit     ->  /speckit.tdd.verify                        (evidence, smells, mutants)
```

## Why it exists

Spec-driven development gets the specification right and then hands it to an
agent that writes the code and its tests in the same pass. That is where the
guarantee leaks. Tests written next to the code they check tend to pass while
proving very little: they assert what a double was configured to return, they
re-implement the calculation they are checking, or they execute a line without
checking its result. Coverage counts execution, so it agrees. The suite goes
green and the feature reads as done.

The fix is not more tests. It is ordering plus evidence: the test comes first,
its failure is observed and recorded, and a separate pass with no memory of the
session checks both the ordering and whether the tests would actually catch a
bug.

## Start here

| Page                                    | When to read                                                           |
| --------------------------------------- | ---------------------------------------------------------------------- |
| [Getting Started](Getting-Started.md)   | First install, zero to first red-green cycle in five minutes.          |
| [Commands](Commands.md)                 | Deep reference for the four commands and every modifier.               |
| [Workflow](Workflow.md)                 | Where the loop sits in the lifecycle, and the artifacts it keeps.      |
| [The Loop](The-Loop.md)                 | The discipline: double loop, valid reds, step size, test doubles.      |
| [Test List Format](Test-List-Format.md) | The test list and cycle log, field by field.                           |
| [Test Quality](Test-Quality.md)         | The rubric the audit grades against, and how mutation testing is used. |
| [Stack Profiles](Stack-Profiles.md)     | How the extension stays language agnostic, per ecosystem.              |
| [Examples](Examples.md)                 | A real test list, cycle log, and verification report.                  |
| [Troubleshooting](Troubleshooting.md)   | Common breakages, refusals, and their fixes.                           |
| [FAQ](FAQ.md)                           | Conceptual questions, design rationale, and how it composes.           |
| [Architecture](Architecture.md)         | What happens when you run a command.                                   |

## The commands at a glance

| Command               | What it does                                                                                                                   | Writes                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `/speckit.tdd.setup`  | Detects every test stack and proves each command by running it. Once per repository.                                           | `.specify/memory/tdd-profile.md`, constitution (with approval)   |
| `/speckit.tdd.plan`   | Acceptance criteria and plan components become a test list; test tasks in `tasks.md` become mandatory and correctly ordered.   | `specs/<feature>/tdd/test-list.md`, `cycle-log.md`, `tasks.md`   |
| `/speckit.tdd.run`    | Drives the loop: one failing test, red proven and recorded, smallest green, refactor on green, one commit.                     | tests, source, `specs/<feature>/tdd/cycle-log.md`                |
| `/speckit.tdd.verify` | Audits from cold context: test-first evidence in git, test smells, mutation on changed files, criteria coverage. Fails closed. | `specs/<feature>/tdd/verification.md`, remediation in `tasks.md` |

Three optional hooks offer the right command at the right moment: `plan` after
`/speckit.tasks`, `run` before `/speckit.implement` starts writing code, and
`verify` after it finishes. You can decline any of them. All modifiers are covered
in [Commands](Commands.md).

## Hard rules

- **A test exists and was seen failing before the code that satisfies it.** The
  failure output goes into the cycle log, and the audit re-checks it against git
  history instead of taking the log's word for it.
- **A red must be red for the right reason.** A test that fails on a typo, or one
  that passes the moment it is written, is not evidence. See
  [The Loop](The-Loop.md).
- **Tests are never weakened to reach green.** No loosened assertion, no widened
  tolerance, no skip, no narrowed filter, no lowered threshold.
- **Test strength is measured, not assumed.** Mutation testing on the changed
  files, or deliberate mutants where the ecosystem has no tool.
- **The grader never fixes what it grades.** `/speckit.tdd.verify` writes findings
  and remediation tasks, and stops there.

## External links

- Repository: <https://github.com/d0whc3r/spec-kit-tdd>
- Issues: <https://github.com/d0whc3r/spec-kit-tdd/issues>
- Discussions: <https://github.com/d0whc3r/spec-kit-tdd/discussions>
- Spec Kit core: <https://github.com/github/spec-kit>
