#!/usr/bin/env bash
# Fails if the JSON schema, TypeScript types and Python models disagree on contractVersion.
set -euo pipefail
cd "$(dirname "$0")/.."

schema=$(grep -oP '"contractVersion":\s*"\K[^"]+' shared/contracts/analysis.schema.json | head -1)
ts=$(grep -oP "CONTRACT_VERSION = '\K[^']+" frontend/src/types/analysis.ts)
py=$(grep -oP 'CONTRACT_VERSION = "\K[^"]+' backend/app/models.py)

echo "schema=$schema  typescript=$ts  python=$py"
if [[ "$schema" != "$ts" || "$schema" != "$py" ]]; then
  echo "ERROR: contract versions differ. Update all three files together." >&2
  exit 1
fi
echo "Contract versions match."
