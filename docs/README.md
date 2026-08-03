# docs/

Wiki source for the TDD Extension. The files in this folder are authored to be
browsed two ways:

1. **In the repo on GitHub.** Click any `*.md` file from
   <https://github.com/d0whc3r/spec-kit-tdd/tree/main/docs> and read.
2. **As the project GitHub Wiki.** The folder is synced to the repo's wiki on
   every push to `main`. Wiki users get sidebar and footer navigation from
   `_Sidebar.md` and `_Footer.md`. This `README.md` is excluded from the wiki
   sync; it exists only to explain the folder.

## Reading order

Start at [Home.md](Home.md). The intended path for new users is:

1. [Home](Home.md)
2. [Getting Started](Getting-Started.md)
3. [Workflow](Workflow.md)
4. [Commands](Commands.md)
5. [Examples](Examples.md)

Reference material:

- [The Loop](The-Loop.md)
- [Test List Format](Test-List-Format.md)
- [Test Quality](Test-Quality.md)
- [Stack Profiles](Stack-Profiles.md)
- [Troubleshooting](Troubleshooting.md)
- [FAQ](FAQ.md)
- [Architecture](Architecture.md)

How this folder is published to the GitHub Wiki is a contributor topic. See
[CONTRIBUTING.md](../CONTRIBUTING.md).

## Editing rules

- File names are CamelCase or `Hyphen-Case` (GitHub Wiki page name rules).
- Relative links between pages use `[Page Name](Page-Name.md)`. The same link
  works on both the rendered repo and the wiki. Links to repo files outside
  `docs/` use `../path`.
- These pages are user-facing only: how to use the extension and how it
  behaves. Contributor, release, and tooling topics live in
  [CONTRIBUTING.md](../CONTRIBUTING.md).
- Follow the voice rules the extension itself enforces: plain English, active
  voice, no em dash, short sentences.
- Every claim about a command must trace to the canonical command files under
  [`commands/`](../commands/), the shipped references under
  [`templates/`](../templates/), or [WORKFLOW.md](../WORKFLOW.md). Do not
  document flags or behaviors that do not exist there.
