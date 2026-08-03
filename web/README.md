# web/

The public landing site for the TDD Extension, published to GitHub
Pages. The page content is hand-authored in `index.html`; the interactive
behaviour and styling are written in TypeScript and CSS under `src/` and
**built with [Vite](https://vite.dev/)** into `dist/`, which is what gets
deployed. Two runtime dependencies are bundled from npm (see `package.json`)
and used only to render the example artifacts:
[marked](https://github.com/markedjs/marked) for markdown, and
[mermaid](https://github.com/mermaid-js/mermaid) for diagrams (code-split into
its own chunk that loads the first time a rendered file actually contains a
`mermaid` code block).

The page is built with progressive enhancement: the CSS is a real `<link>`, so
the site is fully readable and styled with JavaScript disabled. The bundled
module only adds the optional behaviour (nav toggle, tabs, copy buttons,
markdown viewer).

```
web/
├── index.html          single-page site; the Vite entry. Hand-authored content.
├── src/
│   ├── main.ts         entry module: wires nav, clipboard, tabs, markdown
│   ├── nav.ts          mobile navigation toggle
│   ├── clipboard.ts    copy-to-clipboard buttons
│   ├── tabs.ts         ARIA tabs (install methods, example outputs)
│   ├── markdown.ts     marked rendering + full-file modal viewer
│   ├── mermaid.ts      mermaid init + diagram pan/zoom (its own lazy chunk)
│   └── styles.css      all styling, responsive, light and dark
├── public/
│   ├── favicon.svg
│   └── examples/       real example artifacts, staged from /examples (gitignored)
├── dist/               build output, published to Pages (gitignored)
├── vite.config.ts      base "./" (project Pages path); output to dist/
├── tsconfig.json
├── package.json        @spec-kit-tdd/web (pnpm workspace member)
└── README.md           this file
```

`mermaid.ts` is loaded as a dynamic `import()`, so Vite emits it as a separate
chunk that is fetched only when a rendered document contains a diagram; a plain
visit never downloads it.

## Build and local preview

The build tooling (Vite, TypeScript) lives in this folder's own
`package.json`, a pnpm workspace member, so it never weighs on the root
package. Run these from the repo root:

```bash
pnpm web:dev        # Vite dev server (stage examples first: pnpm examples:sync)
pnpm web:build      # stage examples + type-check + build into web/dist
pnpm web:preview    # serve the production build from web/dist
```

The example viewer fetches markdown over HTTP and resolves the paths against the
page URL, so the example files must sit next to `index.html` in the output.
`pnpm examples:sync` copies `/examples` (the single source of truth) into
`web/public/examples`; Vite then copies `public/` into `dist/` verbatim.
`web/public/examples` is gitignored, so the example files are never committed
twice. For `web:dev`, run `pnpm examples:sync` once first.

Each tab shows a rendered excerpt; **View full file** opens the whole
artifact in an in-page markdown viewer (or falls back to GitHub if the file
cannot be fetched).

## Relationship to the docs

The site is a **derived view** of the same canonical sources the wiki under
[`docs/`](../docs/) draws from: `extension.yml`, `catalog.json`,
`commands/`, and `templates/`. The wiki is the long-form reference; this site
is the short, public front door to it.

Because both are derived, they must agree. The `maintain-docs` skill owns that
alignment: when a command, version, install URL, hook, or output file changes,
the skill updates the wiki **and** this site together, and its drift detector
flags the site when it falls behind. See
[`.agents/skills/maintain-docs/SKILL.md`](../.agents/skills/maintain-docs/SKILL.md).

Facts on this page that must match the canonical sources and the wiki:

- Version pin and `requires.speckit_version` (hero badges, install snippet).
- The four command names, their descriptions, their write boundaries, and the
  modifier list.
- The two lifecycle hooks (`after_tasks`, `after_implement`).
- Install and usage commands.
- The artifact layout (`.specify/memory/tdd-profile.md` plus
  `specs/<feature>/tdd/{test-list,cycle-log,verification}.md`, no index file) and
  the example file paths under `examples/`.
- Repository, wiki, issues, and discussions links.

## Deployment

The [`pages.yml`](../.github/workflows/pages.yml) workflow runs after every
release, builds the site with Vite, and publishes `web/dist` to GitHub Pages.
The site is served at `https://d0whc3r.github.io/spec-kit-tdd/`.

GitHub Pages must be set to the **GitHub Actions** source once, in the
repository settings, for the workflow to publish.
