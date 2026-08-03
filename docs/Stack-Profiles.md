# Stack Profiles

How the extension stays language agnostic. The canonical reference ships as
[`templates/tdd-stack-profile.md`](../templates/tdd-stack-profile.md).

Nothing in the loop knows what ecosystem you are in. `/speckit.tdd.setup` detects the
stack, proves each command by running it, and writes `.specify/memory/tdd-profile.md`.
Every later command reads that file and stops if it is missing, rather than guessing a
command that might not exist.

## What the loop needs

| Capability               | Used for                                                       | Required |
| ------------------------ | -------------------------------------------------------------- | -------- |
| Run one test by name     | Proving the new behavior fails in isolation                    | Yes      |
| Run the whole suite      | Proving nothing else broke                                     | Yes      |
| Report failures usefully | Telling an assertion failure from a broken test file           | Yes      |
| Coverage                 | Finding behavior with no test at all                           | No       |
| Mutation testing         | Proving the tests would catch a bug, not just execute the code | No       |
| Property-based testing   | Expressing invariants that must hold across all inputs         | No       |

Also recorded where they exist: the acceptance or end-to-end runner (the outer loop's
home), the contract tool, the approval or snapshot tool, and watch mode.

## Detection order

1. **Manifests.** `package.json`, `pyproject.toml`, `pom.xml`, `build.gradle`,
   `*.csproj`, `go.mod`, `Cargo.toml`, `Gemfile`, `composer.json`, `Package.swift`,
   `mix.exs`, `pubspec.yaml`, `CMakeLists.txt`. A monorepo gets one entry per stack.
2. **The scripts they define.** A `test` script or a `Makefile` target is what the
   project actually runs, with the flags it needs.
3. **The CI config.** Whatever gates merges is the authoritative suite command,
   including the environment variables it sets.
4. **The test layout.** Where tests live, how they are named, which assertion style
   and double library they use. One exemplar test file is recorded, because the loop
   imitates it.
5. **The lock file.** A mutation or property library in the lock file is available; one
   mentioned in a README is not.
6. **Actually running each candidate.** Nothing is recorded until it has been executed
   in your repository with its output observed.

## The check that matters most

The single-test command is verified twice:

- Against a test name that **exists**: it must run exactly that test.
- Against a name that **matches nothing**: it must report zero tests, not exit
  successfully in silence.

A command that passes the first check and fails the second is unusable, because it
would make every red in the project a false green. When no invocation passes both, the
profile records `single: null` and the loop runs whole files instead.

## Ecosystem reference

Starting points, not substitutes for detection. Detection always wins.

| Ecosystem       | Common runners                 | Run one test by name                                                                                   | Coverage                            | Mutation               | Property based        |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------- | ---------------------- | --------------------- |
| JS and TS       | vitest, jest, node:test, mocha | `vitest run <file> -t "<name>"`, `jest <file> -t "<name>"`, `node --test --test-name-pattern "<name>"` | `--coverage`, c8, nyc               | StrykerJS              | fast-check            |
| Python          | pytest, unittest               | `pytest "<file>::<test>"`, `python -m unittest <mod>.<Class>.<test>`                                   | `pytest --cov`, coverage.py         | mutmut, cosmic-ray     | Hypothesis            |
| JVM             | JUnit 5, TestNG, Spock         | `mvn test -Dtest='<Class>#<method>'`, `gradle test --tests '<Class>.<method>'`                         | JaCoCo                              | PIT (pitest)           | jqwik                 |
| .NET            | xUnit, NUnit, MSTest           | `dotnet test --filter "FullyQualifiedName~<name>"`                                                     | coverlet                            | Stryker.NET            | FsCheck, CsCheck      |
| Go              | testing, testify               | `go test ./<pkg> -run '^<TestName>$'`                                                                  | `go test -cover`                    | gremlins, go-mutesting | rapid, gopter         |
| Rust            | cargo test, nextest            | `cargo test <name> -- --exact`, `cargo nextest run -E 'test(<name>)'`                                  | cargo-llvm-cov, tarpaulin           | cargo-mutants          | proptest, quickcheck  |
| Ruby            | RSpec, Minitest                | `rspec <file> -e "<name>"`, `ruby -Itest <file> -n "/<name>/"`                                         | SimpleCov                           | mutant                 | rantly, propcheck     |
| PHP             | PHPUnit, Pest                  | `vendor/bin/phpunit --filter '<name>'`, `vendor/bin/pest --filter '<name>'`                            | phpunit with pcov or xdebug         | Infection              | Eris                  |
| Swift           | XCTest, swift-testing          | `swift test --filter <Name>`, `xcodebuild test -only-testing:<id>`                                     | `swift test --enable-code-coverage` | muter                  | SwiftCheck            |
| Elixir          | ExUnit                         | `mix test <file>:<line>`                                                                               | `mix test --cover`, excoveralls     | muzak                  | StreamData, PropCheck |
| C and C++       | GoogleTest, Catch2, ctest      | `ctest -R '<name>'`, `<binary> --gtest_filter=<Name>`                                                  | gcov with lcov, llvm-cov            | mull, dextool          | rapidcheck            |
| Dart or Flutter | package:test, flutter_test     | `dart test -n "<name>"`, `flutter test --plain-name "<name>"`                                          | `--coverage`                        | mutation_test          | glados                |

Acceptance and end-to-end, where the outer loop usually lives: Playwright, Cypress, or
WebdriverIO for browsers; the framework's own HTTP test client for APIs (supertest,
TestClient, MockMvc, `httptest`, `WebApplicationFactory`, Rack::Test); Testcontainers
or Docker Compose where a real dependency is required. Contract testing is Pact in
most ecosystems, or Spring Cloud Contract on the JVM. Approval and snapshot: Verify,
ApprovalTests, insta, syrupy, jest or vitest snapshots, goldie.

## The same cycle in five ecosystems

The artifacts do not change shape when the language does. Below is one behavior,
`U2 accepts a token expiring exactly at the current instant`, driven in five stacks.

The test list row is identical in all five, word for word, because a behavior is
prose about an observable result and not a call into a runner:

| id  | behavior                                                | traces     | kind    | state |
| --- | ------------------------------------------------------- | ---------- | ------- | ----- |
| U2  | Accepts a token expiring exactly at the current instant | AC-2, FR-2 | example | DONE  |

What follows the ecosystem is the cycle log's test reference, the command that
produced the red, and the failure text, because those three are copied from the
runner rather than written.

### TypeScript, vitest

`single: 'pnpm vitest run {file} -t "{name}"'`

```markdown
## Cycle 3: U2 accepts a token expiring exactly at the current instant

- test: `src/auth/session.test.ts::accepts a token expiring now` (new)
- red: `pnpm vitest run src/auth/session.test.ts -t "accepts a token expiring now"`
  -> `AssertionError: expected 'expired' to be undefined` (1 failed)
- green: `src/auth/session.ts:31` changed `<` to `<=`. Suite -> 126 passed
- refactor: extracted `isExpired(claims, now)`; suite re-run green after the extraction
- commit: `9c2b117` (behavior), `5ee0a30` (structure)
```

### Python, pytest

`single: 'pytest "{file}::{name}" -q'`

```markdown
## Cycle 3: U2 accepts a token expiring exactly at the current instant

- test: `tests/auth/test_session.py::test_accepts_token_expiring_now` (new)
- red: `pytest "tests/auth/test_session.py::test_accepts_token_expiring_now" -q`
  -> `E   AssertionError: assert 'expired' is None` (1 failed)
- green: `src/auth/session.py:31` changed `<` to `<=`. Suite -> 126 passed
- refactor: extracted `is_expired(claims, now)`; suite re-run green after the extraction
- commit: `9c2b117` (behavior), `5ee0a30` (structure)
```

### Go, testing

`single: "go test ./{pkg} -run '^{name}$'"`

```markdown
## Cycle 3: U2 accepts a token expiring exactly at the current instant

- test: `internal/auth/session_test.go::TestAcceptsTokenExpiringNow` (new)
- red: `go test ./internal/auth -run '^TestAcceptsTokenExpiringNow$'`
  -> `session_test.go:42: reason = "expired", want ""` then `FAIL` (1 failed)
- green: `internal/auth/session.go:31` changed `<` to `<=`. Suite -> ok, 126 tests
- refactor: extracted `isExpired(claims, now)`; suite re-run green after the extraction
- commit: `9c2b117` (behavior), `5ee0a30` (structure)
```

Table-driven suites address the case rather than the function:
`go test ./internal/auth -run '^TestSession/accepts_a_token_expiring_now$'`.

### JVM, JUnit 5 with Maven

`single: "mvn -q test -Dtest='{name}'"`

```markdown
## Cycle 3: U2 accepts a token expiring exactly at the current instant

- test: `src/test/java/auth/SessionTest.java::acceptsTokenExpiringNow` (new)
- red: `mvn -q test -Dtest='SessionTest#acceptsTokenExpiringNow'`
  -> `org.opentest4j.AssertionFailedError: expected: <null> but was: <expired>`
  (Tests run: 1, Failures: 1)
- green: `src/main/java/auth/Session.java:31` changed `<` to `<=`. Suite -> 126 passed
- refactor: extracted `isExpired(claims, now)`; suite re-run green after the extraction
- commit: `9c2b117` (behavior), `5ee0a30` (structure)
```

### Rust, cargo test

`single: 'cargo test {name} -- --exact'`

```markdown
## Cycle 3: U2 accepts a token expiring exactly at the current instant

- test: `src/auth/session.rs::tests::accepts_token_expiring_now` (new)
- red: `cargo test auth::session::tests::accepts_token_expiring_now -- --exact`
  -> `assertion `left == right` failed: left: Some("expired"), right: None`
  (test result: FAILED. 0 passed; 1 failed)
- green: `src/auth/session.rs:31` changed `<` to `<=`. Suite -> 126 passed
- refactor: extracted `is_expired(claims, now)`; suite re-run green after the extraction
- commit: `9c2b117` (behavior), `5ee0a30` (structure)
```

### What moved and what did not

| Part of the artifact                         | Ecosystem specific                                   |
| -------------------------------------------- | ---------------------------------------------------- |
| Behavior text on the list                    | No. Same sentence in all five                        |
| `traces`, `kind`, `state`                    | No                                                   |
| Test reference                               | Yes. The runner's own id for a single test           |
| The `red` command                            | Yes. Copied from the profile, never composed by hand |
| The `red` output                             | Yes. Quoted verbatim from the runner                 |
| `green`, `refactor`, `commit` lines          | No. A file, a line, and what changed                 |
| Verdict, states, mutation table in the audit | No                                                   |

The test name inside the file is the one place where the behavior sentence gets
reshaped, and it follows whatever the ecosystem already does: an `it("accepts a token
expiring now")` in JS, `test_accepts_token_expiring_now` in pytest,
`TestAcceptsTokenExpiringNow` in Go, `acceptsTokenExpiringNow` in JUnit. The loop
copies the convention out of the exemplar test file recorded in the profile instead of
imposing one, which is also why no example test source is shipped with this extension:
the naming that matters is yours, not ours.

## The profile file

Frontmatter carries the machine-readable commands, one entry per stack, with `{file}`,
`{name}`, and `{files}` as the only placeholders:

```yaml
---
detected_at: abc1234
ecosystems: [typescript]
default: typescript
stacks:
  typescript:
    cwd: .
    runner: vitest
    single: 'pnpm vitest run {file} -t "{name}"'
    file: pnpm vitest run {file}
    suite: pnpm test
    coverage: pnpm test --coverage
    mutation: 'pnpm stryker run --mutate "{files}"'
    acceptance: pnpm playwright test {file}
    property: fast-check
    contract: null
    test_glob: "src/**/*.test.ts"
    exemplar: src/orders/total.test.ts
verified: [single, file, suite, coverage, mutation]
suite_baseline: green
suite_seconds: 34
---
```

Absent capabilities are explicit `null` with a note, never omitted: silence reads as
"not looked at".

The body carries what the frontmatter cannot: where test files sit, which assertion
and double style to use, how fixtures are built, what is injected rather than reached
for, the exemplar to imitate, and the constraints worth knowing (suite wall time,
environment variables the suite sets, packages with no runner).

For a polyglot repository there is one entry per stack and one conventions section per
stack. Two ecosystems are never averaged into one command.

## When a capability is missing

The loop degrades in a stated way rather than pretending:

| Missing             | Consequence                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| Test runner         | Reported and the loop stops. Standing one up is its own feature, not a side effect                 |
| Single-test command | Whole files are run instead, recorded in the log. Reds stay valid, just slower to read             |
| Coverage            | The audit falls back to trace checking, and reports coverage as unmeasured                         |
| Mutation tool       | Deliberate mutants on a sample of high-risk behaviors, with the sample size stated                 |
| Property library    | Invariants become several example tests at the boundaries, marked as sampled rather than proven    |
| Fast enough suite   | The observed time is recorded and a fast inner-loop subset is proposed, with a full run per commit |

## Keeping it current

Re-run `/speckit.tdd.setup refresh` when the stack changes: a new runner, a new
package, a changed CI command. It re-detects from scratch and reports every line that
moved, rather than silently overwriting a working command with a new guess.
