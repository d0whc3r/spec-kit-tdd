<!-- Thanks for contributing. Fill in every section. PRs that skip the checklist will be sent back. -->

## Summary

<!-- One paragraph. What does this change and why. Frame in terms of the user-visible effect, not the implementation. -->

## Type of change

- [ ] Bug fix (`fix:`)
- [ ] New feature, non-breaking (`feat:`)
- [ ] Breaking change (`feat!:` or `BREAKING CHANGE:` footer)
- [ ] Documentation only (`docs:`)
- [ ] Internal refactor or chore (`refactor:` / `chore:`)
- [ ] CI or release tooling (`ci:` / `build:`)

## Scope

<!-- Tick everything this PR touches. -->

- [ ] Canonical command file in `commands/`
- [ ] `extension.yml` or `catalog.json`
- [ ] Templates in `templates/`
- [ ] Scripts in `.github/scripts/`
- [ ] Documentation only

## Agent-boundary checklist

<!-- See the "Agent Boundaries" section of AGENTS.md. -->

- [ ] The canonical command files under `commands/` are the single source of truth for the command surface.
- [ ] `extension.yml` `provides.commands` matches the canonical command set.
- [ ] `catalog.json` `provides.commands` count matches.
- [ ] The command boundaries hold: `setup` writes only the stack profile (and the constitution with approval), `plan` only `specs/<feature>/tdd/` and `tasks.md`, `verify` only its report and remediation tasks. `run` is the only command that writes tests or source.
- [ ] Shipped content (command, templates) is plain English with no em dashes.

## Verification

<!-- Show your work. Paste output, screenshots of generated artifacts, or before/after diffs. -->

- [ ] `pnpm run lint` passes (or N/A)
- [ ] `pnpm run validate` passes
- [ ] `pnpm run lint:content` passes
- [ ] I ran the affected command against a real feature (`spec.md`, `plan.md`, `tasks.md`) and inspected the output.

```
<paste relevant output here>
```

## Linked issues

<!-- "Closes #123", "Refs #456". -->

## Notes for reviewers

<!-- Anything that does not fit above: tradeoffs you considered, follow-ups you deferred, areas where you want a second opinion. -->
