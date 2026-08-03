#!/usr/bin/env bash
# Detect drift between canonical extension sources and the wiki.
# Read-only. Prints findings to stdout. Exit 0 always; the count of
# drifts is in the trailing summary line.
#
# Designed to be run from the repo root.

set -u

if [[ ! -f extension.yml ]] || [[ ! -d docs ]]; then
  echo "error: run from the repo root (need extension.yml and docs/)" >&2
  exit 2
fi

drifts=0
note() { echo "[drift] $*"; drifts=$((drifts + 1)); }
ok()   { echo "[ok]    $*"; }

# ---- extract canonical facts ---------------------------------------

ver_ext=$(grep -E '^[[:space:]]*version:' extension.yml | head -1 \
            | sed -E 's/.*version:[[:space:]]*"?([^"#]+)"?.*/\1/' \
            | tr -d ' ')
ver_cat=$(grep -E '"version"' catalog.json | head -1 \
            | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')

cmd_files=(commands/speckit.*.md)
cmd_count_files=${#cmd_files[@]}

cmd_count_ext=$(grep -cE '^[[:space:]]+- name:[[:space:]]*speckit\.' extension.yml || true)
cmd_count_cat=$(grep -E '"commands"' catalog.json \
                  | sed -E 's/.*"commands"[[:space:]]*:[[:space:]]*([0-9]+).*/\1/' \
                  | head -1)

hooks_ext=$(awk '/^hooks:/,/^[a-z]/' extension.yml \
              | grep -E '^[[:space:]]+[a-z_]+:[[:space:]]*$' \
              | sed -E 's/^[[:space:]]+([a-z_]+):.*$/\1/' \
              | grep -v '^command$\|^optional$\|^prompt$\|^description$' \
              | sort -u)

# ---- 1. version coherence ------------------------------------------

if [[ "$ver_ext" != "$ver_cat" ]]; then
  note "extension.yml version ($ver_ext) != catalog.json version ($ver_cat)"
else
  ok "extension.yml and catalog.json agree on version $ver_ext"
fi

# install URL pins in README, Getting-Started, and the web landing page
# should match version
for f in README.md docs/Getting-Started.md web/index.html; do
  if [[ -f "$f" ]]; then
    if grep -qE "releases/download/v[0-9]+\.[0-9]+\.[0-9]+/tdd-[0-9]+\.[0-9]+\.[0-9]+\.zip" "$f"; then
      pinned=$(grep -oE "releases/download/v[0-9]+\.[0-9]+\.[0-9]+" "$f" \
                 | head -1 | sed 's|releases/download/v||')
      if [[ "$pinned" != "$ver_ext" ]]; then
        note "$f pins version v$pinned but extension.yml is $ver_ext"
      else
        ok "$f install URL pins matching version $pinned"
      fi
    fi
  fi
done

# top CHANGELOG entry version
if [[ -f CHANGELOG.md ]]; then
  top_changelog=$(grep -oE '^#+ \[?[0-9]+\.[0-9]+\.[0-9]+\]?' CHANGELOG.md \
                    | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
  if [[ -n "$top_changelog" ]] && [[ "$top_changelog" != "$ver_ext" ]]; then
    note "CHANGELOG.md top entry is $top_changelog but extension.yml is $ver_ext"
  elif [[ -n "$top_changelog" ]]; then
    ok "CHANGELOG.md top entry matches version $ver_ext"
  fi
fi

# ---- 2. command count coherence ------------------------------------

if [[ "$cmd_count_ext" != "$cmd_count_files" ]]; then
  note "extension.yml lists $cmd_count_ext commands but commands/ has $cmd_count_files files"
else
  ok "extension.yml provides.commands count matches commands/ file count ($cmd_count_files)"
fi

if [[ -n "${cmd_count_cat:-}" ]] && [[ "$cmd_count_cat" != "$cmd_count_files" ]]; then
  note "catalog.json provides.commands ($cmd_count_cat) != commands/ file count ($cmd_count_files)"
else
  ok "catalog.json provides.commands matches commands/ file count"
fi

# ---- 3. integration manifests are not empty ------------------------
#
# The integrations manifests under .specify/integrations/ are written
# by the Spec Kit install pipeline for whichever host agents are
# installed locally; the folder is not tracked in git, so which
# manifests exist depends on the environment. We only flag a manifest
# that exists and is empty. Per-command coverage inside the manifest is
# too shape-dependent to lint reliably; the human audit step handles it.

declare -a cmd_names=()
for f in "${cmd_files[@]}"; do
  base=$(basename "$f" .md)
  cmd_names+=("$base")
done

for manifest in .specify/integrations/*.manifest.json; do
  [[ -e "$manifest" ]] || continue
  if [[ ! -s "$manifest" ]]; then
    note "empty manifest: $manifest"
  fi
done
ok "manifest presence check done"

# ---- 4. every command name appears in docs/Commands.md -------------

if [[ -f docs/Commands.md ]]; then
  for name in "${cmd_names[@]}"; do
    # name is like "speckit.tdd.run"; docs use /speckit.tdd.run
    if ! grep -q "/$name\b" docs/Commands.md; then
      note "docs/Commands.md missing reference to /$name"
    fi
  done
  ok "docs/Commands.md command coverage checked"
fi

# ---- 5. hook list in extension.yml vs docs -------------------------

for f in docs/Commands.md docs/Architecture.md; do
  [[ -f "$f" ]] || continue
  for hook in $hooks_ext; do
    if ! grep -q "\`$hook\`" "$f"; then
      note "$f does not mention hook \`$hook\`"
    fi
  done
done
ok "hook coverage in docs checked"

# ---- 6. _Sidebar.md vs actual pages --------------------------------

if [[ -f docs/_Sidebar.md ]]; then
  for p in docs/*.md; do
    base=$(basename "$p")
    case "$base" in
      _Sidebar.md|_Footer.md|README.md) continue ;;
    esac
    if ! grep -q "$base" docs/_Sidebar.md; then
      note "docs/_Sidebar.md missing entry for $base"
    fi
  done
  # reverse: sidebar lists nothing that does not exist
  while IFS= read -r linked; do
    if [[ ! -f "docs/$linked" ]]; then
      note "docs/_Sidebar.md links to nonexistent docs/$linked"
    fi
  done < <(grep -oE '\([A-Za-z][A-Za-z0-9_-]*\.md\)' docs/_Sidebar.md \
             | tr -d '()')
  ok "docs/_Sidebar.md page coverage checked"
fi

# ---- 7. intra-wiki link resolution ---------------------------------
#
# Walk every *.md under docs/ (and root) and resolve relative .md links
# against the file's own directory.

check_links_in_file() {
  local file="$1"
  local dir
  dir=$(dirname "$file")
  # Strip fenced code blocks and inline backtick spans, then extract
  # markdown link targets that look like local .md references.
  local stripped
  stripped=$(awk '
    /^[[:space:]]*```/ { fence = !fence; next }
    !fence { print }
  ' "$file" | sed -E 's/`[^`]*`//g')
  local targets
  targets=$(printf '%s\n' "$stripped" \
              | grep -oE '\]\([^)]+\.md(#[^)]+)?\)' \
              | sed -E 's/^\]\(([^)]+)\)$/\1/' || true)
  while IFS= read -r target; do
    [[ -z "$target" ]] && continue
    case "$target" in
      http*|mailto:*|\#*) continue ;;
    esac
    local base_target resolved
    base_target=${target%%#*}
    [[ -z "$base_target" ]] && continue
    if [[ "$base_target" = /* ]]; then
      resolved="$base_target"
    else
      resolved="$dir/$base_target"
    fi
    if command -v python3 >/dev/null; then
      resolved=$(python3 -c "import os,sys; print(os.path.normpath(sys.argv[1]))" "$resolved")
    fi
    if [[ ! -f "$resolved" ]]; then
      note "$file links to missing target: $target (resolved: $resolved)"
    fi
  done <<< "$targets"
}

for f in docs/*.md *.md; do
  [[ -f "$f" ]] || continue
  check_links_in_file "$f"
done

ok "intra-wiki link check done"

# ---- 8. web landing page coverage ----------------------------------
#
# web/index.html is a derived view of the same canonical sources as the
# wiki. It must mention every command. The version-pin check above
# already covers its install URL.

if [[ -f web/index.html ]]; then
  for name in "${cmd_names[@]}"; do
    if ! grep -q "/$name\b" web/index.html; then
      note "web/index.html missing reference to /$name"
    fi
  done
  ok "web/index.html command coverage checked"
fi

# ---- summary -------------------------------------------------------

echo
if [[ $drifts -eq 0 ]]; then
  echo "summary: 0 drifts. docs are in sync."
else
  echo "summary: $drifts drift(s) found. review the [drift] lines above."
fi
exit 0
