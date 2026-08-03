#!/usr/bin/env bash
# Style lint for docs/ and root *.md files.
# Read-only. Exits 0 always; prints findings to stdout.

set -u

if [[ ! -d docs ]]; then
  echo "error: run from the repo root (need docs/)" >&2
  exit 2
fi

issues=0
note() { echo "[style] $*"; issues=$((issues + 1)); }

# 1. em dash anywhere in docs/, root *.md, or the web landing page
while IFS= read -r line; do
  note "$line"
done < <(grep -nP '\xE2\x80\x94' \
           docs/*.md *.md web/*.html 2>/dev/null \
           | grep -vE '^CHANGELOG\.md:' || true)

# 2. en dash in prose (allow numeric ranges)
while IFS= read -r line; do
  # allow patterns like "2024–2026" or "v0.1–v0.2"
  if echo "$line" | grep -qP '[A-Za-z]\s*–\s*[A-Za-z]'; then
    note "en dash in prose: $line"
  fi
done < <(grep -nP '\xE2\x80\x93' \
           docs/*.md *.md web/*.html 2>/dev/null || true)

# 3. trailing whitespace
while IFS= read -r line; do
  note "trailing whitespace: $line"
done < <(grep -nE ' +$' docs/*.md *.md 2>/dev/null || true)

# 4. tab characters in markdown (markdownlint also catches but cheap here)
while IFS= read -r line; do
  note "tab character in markdown: $line"
done < <(grep -nP '\t' docs/*.md 2>/dev/null || true)

# 5. heading level skips (#### after ##) - lightweight check
for f in docs/*.md; do
  [[ -f "$f" ]] || continue
  awk '
    /^#+ / {
      level = length($1)
      if (prev > 0 && level - prev > 1) {
        printf("%s:%d: heading level jump from H%d to H%d\n", FILENAME, NR, prev, level)
      }
      prev = level
    }
  ' "$f" | while IFS= read -r line; do note "$line"; done
done

echo
if [[ $issues -eq 0 ]]; then
  echo "summary: 0 style issues."
else
  echo "summary: $issues style issue(s) found."
fi
exit 0
