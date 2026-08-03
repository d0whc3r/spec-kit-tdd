# Cycle Log: Session expiry and scoped order listing

Append only. Newest last. Every entry's `red` block is the evidence that the test
existed and failed before the code that satisfies it.

## Baseline

- suite: `pnpm test` -> 124 passed, 0 failed, 33s
- commit: `4f9c2e1`
- recorded: cycle 0, before any change
- note: `packages/legacy` is excluded from `pnpm test` (no runner configured). Nothing
  in this feature touches it.

## Cycle 1: A2 an expired session is rejected with a 401

- test: `tests/acceptance/auth.spec.ts::expired` (new, outer loop)
- red: `pnpm playwright test tests/acceptance/auth.spec.ts -g "expired"`
  -> `Expected 401, received 200` (1 failed)
- green: not attempted. This is the outer loop opening; it stays red until the units
  beneath it are done. State left `RED` deliberately, per the playbook.
- commit: `a1c04de` (acceptance test only)

## Cycle 2: U1 rejects a token whose expiry is in the past

- test: `src/auth/session.test.ts::rejects an expired token` (new)
- red: `pnpm vitest run src/auth/session.test.ts -t "rejects an expired token"`
  -> `AssertionError: expected undefined to be 'expired'` (1 failed)
- green: `src/auth/session.ts:31` added the expiry comparison against the injected
  clock. Suite `pnpm test` -> 125 passed, 0 failed
- refactor: none needed, three lines inside an existing guard
- commit: `d41f8a2`

## Cycle 3: U2 accepts a token expiring exactly at the current instant

- test: `src/auth/session.test.ts::accepts a token expiring now` (new)
- red: `pnpm vitest run src/auth/session.test.ts -t "accepts a token expiring now"`
  -> `AssertionError: expected 'expired' to be undefined` (1 failed)
- green: `src/auth/session.ts:31` changed `<` to `<=`. Suite -> 126 passed
- refactor: extracted `isExpired(claims, now)` from the inline comparison; suite
  re-run green after the extraction
- commit: `9c2b117` (behavior), `5ee0a30` (structure)
- note: U1 alone passed with both `<` and `<=`, which is exactly why the boundary
  needed its own behavior on the list.

## Cycle 4: U3 round-trips any valid claim set

- test: `src/auth/session.prop.ts::round trip` (new, property)
- red: `pnpm vitest run src/auth/session.prop.ts`
  -> `Property failed after 1 test. Seed: 1738. Counterexample: {"sub":""}` (1 failed)
- green: `src/auth/session.ts:48` rejects an empty subject before encoding.
  Suite -> 127 passed
- follow-up: appended `U7 rejects a claim set with an empty subject` to the test list
  as the pinned example for the shrunk counterexample, so the regression stays pinned
  even if the generator changes
- refactor: none
- commit: `71ad4e9`

## Cycle 5: U7 rejects a claim set with an empty subject

- test: `src/auth/session.test.ts::empty subject` (new)
- red: passed on the first run, because cycle 4 already implemented the guard.
  Deliberate mutant applied: removed the guard at `src/auth/session.ts:48`, re-ran
  -> `AssertionError: expected [Function] to throw 'InvalidClaims'` (1 failed).
  Guard restored, suite re-run -> 128 passed, 0 failed
- green: no production change needed
- refactor: none
- commit: `3b8e5c0` (test only)

## Cycle 6: U4 reads the current time from the injected clock

- test: `src/auth/session.test.ts::injected clock` (new)
- red: `pnpm vitest run src/auth/session.test.ts -t "injected clock"`
  -> `AssertionError: expected clock.now to have been called 1 time, but it was
called 0 times` (1 failed)
- green: `src/auth/session.ts:27` takes the clock from the constructor instead of
  calling `Date.now()`. Suite -> 129 passed
- refactor: none
- commit: `c9017f4`
- note: this is the one behavior in the feature asserted through an interaction rather
  than a value, because "which clock is read" is not observable in the return value.

## Cycle 7: U5 current listing behavior for a legacy customer record

- test: `src/orders/repository.test.ts::legacy` (new, characterization)
- red: not applicable. A characterization test captures what the code does today and
  is expected to pass immediately. It did: `pnpm vitest run
src/orders/repository.test.ts -t "legacy"` -> 1 passed
- verified with a deliberate mutant: changed the legacy branch at
  `src/orders/repository.ts:64` to drop the customer join, re-ran -> 1 failed.
  Restored, suite re-run -> 130 passed, 0 failed
- state: `BASELINE`
- commit: `e5d2a08`
- note: the captured behavior returns orders for archived customers, which looks
  wrong. It is out of scope for this feature and was raised in the report rather than
  changed here.

## Cycle 8: U6 filters orders to the requesting user's id

- test: `src/orders/repository.test.ts::scoped` (new)
- red: `pnpm vitest run src/orders/repository.test.ts -t "scoped"`
  -> `AssertionError: expected 3 orders to be 1` (1 failed)
- green: `src/orders/repository.ts:41` added the user predicate to the query.
  Suite -> 131 passed
- refactor: none
- commit: `0fa63b1`

## Cycle 9: U8 returns an empty list rather than null

- test: `src/orders/repository.test.ts::empty list` (new)
- red: `pnpm vitest run src/orders/repository.test.ts -t "empty list"`
  -> `AssertionError: expected null to deeply equal []` (1 failed)
- green: `src/orders/repository.ts:47` returns `[]` when the query yields nothing.
  Suite -> 132 passed
- refactor: none
- commit: `2d4b7ff`

## Cycle 10: U9 preserves the existing sort order

- test: `src/orders/repository.test.ts::sort order` (new)
- red: passed on the first run. Deliberate mutant applied: removed the `ORDER BY` at
  `src/orders/repository.ts:44`, re-ran -> `AssertionError: expected [b, a] to
deeply equal [a, b]` (1 failed). Restored, suite re-run -> 133 passed
- green: no production change needed. The behavior existed and is now pinned against
  the refactor in cycle 11
- refactor: none
- commit: `6c1e93b` (test only)

## Cycle 11: A1, A3 close the outer loop

- tests: `tests/acceptance/orders.spec.ts::own only` and `::empty state` (new)
- red: `pnpm playwright test tests/acceptance/orders.spec.ts`
  -> `Expected 1 order row, received 3` and `Expected empty state, received table`
  (2 failed)
- green: `src/orders/route.ts:22` passes the session's user id into the repository
  call. Suite -> 133 passed. `tests/acceptance/auth.spec.ts::expired` from cycle 1 is
  now green as well, which closes A2
- refactor: extracted `requireSession()` from the three route handlers that repeated
  the check; suite re-run green after the extraction
- commit: `8e02da5` (behavior), `9f3a1c2` (structure)

## Notes and deviations

- Cycle 3's step was originally attempted together with cycle 2. The red covered two
  behaviors at once, so it was reverted to `d41f8a2` and split into U1 and U2.
- No test was weakened, skipped, or deleted during this feature.
- `packages/legacy` is not covered by `pnpm test` at all: it has no runner configured,
  so nothing in it is verified either way. Not touched by this feature, and reported
  by `/speckit.tdd.setup` as work of its own.
