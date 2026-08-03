---
feature: 003-user-auth
loop: outside-in
profile: .specify/memory/tdd-profile.md
spec_criteria: 3
planned_at: 4f9c2e1
updated_at: 9f3a1c2
suite_baseline: green
---

# Test List: Session expiry and scoped order listing

Derived from `spec.md` (3 acceptance criteria, 4 functional requirements) and
`plan.md` (2 components). Outer-loop behaviors go through the HTTP entry point;
inner-loop behaviors are grouped by the component that owns them.

## Outer loop: acceptance behaviors

One per acceptance criterion. Each stays red until the feature works end to end
through the real route.

| id  | behavior                                                    | traces | kind    | state | test                                           |
| --- | ----------------------------------------------------------- | ------ | ------- | ----- | ---------------------------------------------- |
| A1  | A signed-in user sees only their own orders                 | AC-1   | example | DONE  | `tests/acceptance/orders.spec.ts::own only`    |
| A2  | An expired session is rejected with a 401 and no order data | AC-2   | example | DONE  | `tests/acceptance/auth.spec.ts::expired`       |
| A3  | An empty order history renders the empty state              | AC-3   | example | DONE  | `tests/acceptance/orders.spec.ts::empty state` |

## Inner loop: unit behaviors

### `src/auth/session.ts`

| id  | behavior                                                   | traces     | kind     | state | test                                       |
| --- | ---------------------------------------------------------- | ---------- | -------- | ----- | ------------------------------------------ |
| U1  | Rejects a token whose expiry is in the past                | AC-2, FR-2 | example  | DONE  | `src/auth/session.test.ts::expired`        |
| U2  | Accepts a token expiring exactly at the current instant    | AC-2       | example  | DONE  | `src/auth/session.test.ts::boundary`       |
| U3  | Round-trips any valid claim set through encode and decode  | FR-2       | property | DONE  | `src/auth/session.prop.ts::round trip`     |
| U4  | Reads the current time from the injected clock, not the OS | FR-2       | example  | DONE  | `src/auth/session.test.ts::injected clock` |
| U7  | Rejects a claim set with an empty subject                  | FR-2       | example  | DONE  | `src/auth/session.test.ts::empty subject`  |

`U7` was added mid-loop: it pins the counterexample `fast-check` shrank out of `U3`
(see cycle 3 in the cycle log).

### `src/orders/repository.ts`

| id  | behavior                                              | traces     | kind             | state    | test                                        |
| --- | ----------------------------------------------------- | ---------- | ---------------- | -------- | ------------------------------------------- |
| U5  | Current listing behavior for a legacy customer record | AC-1       | characterization | BASELINE | `src/orders/repository.test.ts::legacy`     |
| U6  | Filters orders to the requesting user's id            | AC-1, FR-1 | example          | DONE     | `src/orders/repository.test.ts::scoped`     |
| U8  | Returns an empty list rather than null for no orders  | AC-3, FR-3 | example          | DONE     | `src/orders/repository.test.ts::empty list` |
| U9  | Preserves the existing sort order (newest first)      | FR-4       | example          | DONE     | `src/orders/repository.test.ts::sort order` |

`U5` came first: `repository.ts` had no tests, so its current behavior for legacy
records was captured as a baseline before `U6` changed the query.

## Invariants and edge cases still to place

- Concurrent refresh of the same session must not issue two tokens. No requirement
  covers it yet; raised in the report for the next spec revision.

## Out of scope

- Password reset flow: separate feature, `specs/004-password-reset/`.
- Clock skew tolerance between nodes: no requirement, no test. Raised in the report.
- Load behavior above 1000 concurrent sessions: no requirement, no test.

## Verification commands

Copied verbatim from `.specify/memory/tdd-profile.md` at planning time:

- Single test: `pnpm vitest run {file} -t "{name}"`
- Full suite: `pnpm test`
- Coverage: `pnpm test --coverage`
- Mutation (changed files): `pnpm stryker run --mutate "{files}"`
- Acceptance: `pnpm playwright test {file}`
