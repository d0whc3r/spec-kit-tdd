---
detected_at: 4f9c2e1
ecosystems: [typescript]
default: typescript
stacks:
  typescript:
    cwd: .
    runner: vitest
    single: 'pnpm vitest run {file} -t "{name}"'
    file: pnpm vitest run {file}
    suite: pnpm test
    watch: pnpm vitest
    coverage: pnpm test --coverage
    mutation: 'pnpm stryker run --mutate "{files}"'
    acceptance: pnpm playwright test {file}
    property: fast-check
    approval: vitest snapshots
    contract: null
    test_glob: "src/**/*.test.ts"
    exemplar:
      unit: src/orders/total.test.ts
      property: src/orders/total.prop.ts
      acceptance: tests/acceptance/orders.spec.ts
    helpers:
      - src/testing/factories.ts
      - tests/acceptance/fixtures.ts
verified: [single, file, suite, coverage, mutation, acceptance]
suite_baseline: green
suite_seconds: 34
---

# TDD Stack Profile

Written by `/speckit.tdd.setup` against `4f9c2e1`. Every command in the frontmatter
was executed in this repository before it was recorded here.

## Conventions to match

- Unit tests sit next to the source as `<name>.test.ts`. Property tests use
  `<name>.prop.ts`. Acceptance tests live in `tests/acceptance/` and run under
  Playwright against a booted app.
- Assertions use `expect` from vitest. Doubles use `vi.fn()`; there is no separate
  mocking library, and no test in the repository mocks a module it is testing.
- Fixtures are plain factory functions in `src/testing/factories.ts`. Follow
  `makeOrder()` and `makeClaims()` rather than building objects inline.
- Acceptance tests take their signed-in page and seeded account from the Playwright
  fixtures in `tests/acceptance/fixtures.ts`. They never sign in through the UI by
  hand.
- The clock is injected as a `Clock` port (`src/lib/clock.ts`). Production code never
  calls `Date.now()` directly, and neither does a test.
- Exemplars to imitate: `src/orders/total.test.ts` for a unit test,
  `src/orders/total.prop.ts` for a property test, and
  `tests/acceptance/orders.spec.ts` for an acceptance test.

## Notes and constraints

- The suite takes 34 seconds, so a full run per cycle is fine.
- `pnpm test` sets `TZ=UTC`. A test that relies on the local zone passes locally and
  fails in CI.
- The single-test command was verified both ways: it runs exactly the named test, and
  it reports `No test files found` for a name that matches nothing.
- Mutation runs are scoped to changed files. A whole-repo run takes about 20 minutes
  and belongs in CI, not in a loop step.
- `packages/legacy` has no runner configured. Work there needs characterization tests
  first, and there is no single-test command for it.
