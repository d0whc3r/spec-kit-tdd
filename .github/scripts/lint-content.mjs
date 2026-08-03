// Pipeline: lint extension content (markdown templates and command bodies).
//
// Per template:
//   - No em dash.
//   - Canonical mandatory headings present and in order.
//   - Optional headings (when present) appear after the mandatory ones and in
//     declared order. Optional headings may carry a " _(optional)_" suffix.
//   - The command file references the template and any extra refs.
//   - No banned AI-tell phrases.
// Each shipped command is linted for the same prose rules (no em dash, no
// banned phrases).
// Then an oxfmt --check pass over commands, templates, and README.
//
// Usage: node lint-content.mjs

import path from "node:path";
import { $, fs } from "zx";
import { repoRoot, isMain } from "./lib/repo.mjs";
import { logger } from "./lib/log.mjs";

const log = logger("lint-content");

const BANNED_PHRASES = ["delve", "tapestry", "in essence", "navigate the landscape"];
const LOOP_PLAYBOOK = "templates/tdd-loop-playbook.md";
const TEST_LIST_TEMPLATE = "templates/tdd-test-list-template.md";
const STACK_PROFILE = "templates/tdd-stack-profile.md";
const QUALITY_RUBRIC = "templates/tdd-test-quality-rubric.md";

const SETUP_CMD = "commands/speckit.tdd.setup.md";
const PLAN_CMD = "commands/speckit.tdd.plan.md";
const RUN_CMD = "commands/speckit.tdd.run.md";
const VERIFY_CMD = "commands/speckit.tdd.verify.md";

// Shipped command bodies are linted for the same prose rules as templates
// (AGENTS.md "Agent Boundaries" rule 4: no em dashes, plain English).
const COMMANDS = [SETUP_CMD, PLAN_CMD, RUN_CMD, VERIFY_CMD];

// Each entry pairs a shipped reference template with the command that must
// point executors at it. `mandatory` lists the template's stable top-level
// headings in canonical order.
const TEMPLATES = [
  {
    template: LOOP_PLAYBOOK,
    command: RUN_CMD,
    mandatory: [
      "The loop",
      "Step 1: the test list",
      "Step 2: one concrete test",
      "Step 3: red, and red for the right reason",
      "Step 4: green by the smallest change",
      "Step 5: refactor while green",
      "Granularity: how big is one step",
      "Test doubles: when to mock and when not to",
      "Brownfield: characterization tests first",
      "Beyond example tests: properties, contracts, approvals",
      "Forbidden shortcuts",
      "Commit cadence",
      "Escape hatches",
    ],
    optional: [],
    extraRefs: [TEST_LIST_TEMPLATE, STACK_PROFILE],
  },
  {
    template: TEST_LIST_TEMPLATE,
    command: PLAN_CMD,
    mandatory: [
      "File placement and naming",
      "Frontmatter",
      "Behavior ids and states",
      "Template",
      "The cycle log",
      "Quality bar: check before finishing the list",
    ],
    optional: [],
    extraRefs: [LOOP_PLAYBOOK, STACK_PROFILE],
  },
  {
    template: STACK_PROFILE,
    command: SETUP_CMD,
    mandatory: [
      "What the loop needs",
      "Detection order",
      "Ecosystem reference",
      "Profile format",
      "Constitution principle",
      "Verifying the profile",
      "When a capability is missing",
    ],
    optional: [],
    extraRefs: [],
  },
  {
    template: QUALITY_RUBRIC,
    command: VERIFY_CMD,
    mandatory: [
      "What the audit answers",
      "Evidence sources",
      "Test-first evidence",
      "Test smell catalogue",
      "Test strength: mutation and deliberate mutants",
      "Traceability: criteria to tests",
      "Scoring and verdict",
      "Report format",
      "Remediation tasks",
    ],
    optional: [],
    extraRefs: [TEST_LIST_TEMPLATE],
  },
];

const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(repoRoot, rel));

// Shared prose rules for shipped content: no em dash, no banned AI-tell phrases.
function lintProse(rel, text, fail) {
  if (text.includes("—")) fail(`em dash found in ${rel}`);
  for (const phrase of BANNED_PHRASES) {
    if (text.toLowerCase().includes(phrase)) {
      fail(`banned phrase "${phrase}" found in ${rel}`);
    }
  }
}

// 1-based line of the first heading line, or 0 if absent.
function headingLine(lines, heading) {
  const idx = lines.findIndex((l) => l === `## ${heading}` || l === `## ${heading} _(optional)_`);
  return idx === -1 ? 0 : idx + 1;
}

function lintTemplate(spec, fail) {
  if (!exists(spec.template)) {
    fail(`${spec.template} missing`);
    return;
  }
  const text = read(spec.template);
  const lines = text.split("\n");

  lintProse(spec.template, text, fail);

  // Single ordered cursor across mandatory then optional headings.
  let last = 0;
  const checkOrder = (headings, required) => {
    for (const h of headings) {
      const line = headingLine(lines, h);
      if (line === 0) {
        if (required) fail(`missing mandatory heading in ${spec.template}: ## ${h}`);
        continue;
      }
      if (line <= last) {
        fail(
          `heading out of canonical order in ${spec.template}: ## ${h} (line ${line}, previous at ${last})`,
        );
      }
      last = line;
    }
  };
  checkOrder(spec.mandatory, true);
  checkOrder(spec.optional, false);

  // Command file references.
  if (!exists(spec.command)) {
    fail(`${spec.command} missing`);
  } else {
    const cmd = read(spec.command);
    for (const ref of [spec.template, ...spec.extraRefs]) {
      if (!cmd.includes(ref)) fail(`${spec.command} does not reference ${ref}`);
    }
  }
}

export async function lintContent() {
  let failed = false;
  const fail = (msg) => {
    log.fail(msg);
    failed = true;
  };

  for (const spec of TEMPLATES) lintTemplate(spec, fail);

  for (const cmd of COMMANDS) {
    if (!exists(cmd)) fail(`${cmd} missing`);
    else lintProse(cmd, read(cmd), fail);
  }

  // oxfmt pass over the shipped markdown.
  const oxfmt = path.join(repoRoot, "node_modules/.bin/oxfmt");
  if (fs.existsSync(oxfmt)) {
    const res = await $({ cwd: repoRoot, nothrow: true })`${oxfmt} --check ${[
      "commands/**/*.md",
      "templates/**/*.md",
      "README.md",
    ]}`;
    if (res.exitCode !== 0) fail("oxfmt reported unformatted markdown files");
  }

  if (failed) return false;
  log.ok("content lint passed");
  return true;
}

if (isMain(import.meta.url)) {
  if (!(await lintContent())) process.exit(1);
}
