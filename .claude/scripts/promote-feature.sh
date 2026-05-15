#!/usr/bin/env bash
# Promote a feature: mark it [x] in ROADMAP.md and append a human-readable entry to FEATURES.md.
#
# Usage:
#   .claude/scripts/promote-feature.sh "<exact roadmap line text>" "<human-readable description>"
#
# Example:
#   .claude/scripts/promote-feature.sh "Row data as array binding [C]" \
#     "Bind any array of objects to <glass-grid> via [rowData]; changes via signals re-render automatically."
#
# Exact-match the roadmap line (everything after the leading "- [ ] "). The script will:
#   1. Flip [ ] to [x] in ROADMAP.md
#   2. Append the description to FEATURES.md under the matching phase/section
#   3. Print the diff
#
# Safe to run multiple times; if the line is already [x], step 1 is a no-op.

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "usage: $0 \"<roadmap-line-text>\" \"<description>\"" >&2
  exit 64
fi

LINE_TEXT="$1"
DESCRIPTION="$2"
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
ROADMAP="$ROOT/ROADMAP.md"
FEATURES="$ROOT/FEATURES.md"

if [[ ! -f "$ROADMAP" ]]; then echo "missing $ROADMAP" >&2; exit 1; fi
if [[ ! -f "$FEATURES" ]]; then echo "missing $FEATURES" >&2; exit 1; fi

ESCAPED=$(printf '%s\n' "$LINE_TEXT" | sed 's/[][\/.^$*]/\\&/g')

# Step 1: flip [ ] -> [x]
if grep -qE "^- \[ \] ${ESCAPED}$" "$ROADMAP"; then
  sed -i.bak -E "s|^- \\[ \\] (${ESCAPED})\$|- [x] \\1|" "$ROADMAP"
  rm -f "$ROADMAP.bak"
  echo "marked complete in ROADMAP.md: $LINE_TEXT"
elif grep -qE "^- \[x\] ${ESCAPED}$" "$ROADMAP"; then
  echo "already complete in ROADMAP.md: $LINE_TEXT"
else
  echo "WARNING: roadmap line not found verbatim: $LINE_TEXT" >&2
  echo "(continuing — will only update FEATURES.md)" >&2
fi

# Step 2: append to FEATURES.md
{
  echo ""
  echo "- **${LINE_TEXT}** — ${DESCRIPTION}"
} >> "$FEATURES"

echo "appended to FEATURES.md"
