#!/usr/bin/env bash
# Creates the GitHub repository and pushes main + tags. Run once, after `gh auth login`.
#   ./scripts/publish_to_github.sh <repo-name> [public|private]
set -euo pipefail
cd "$(dirname "$0")/.."

name="${1:-sar-change-viewer}"
visibility="${2:-private}"

if ! gh auth status >/dev/null 2>&1; then
  echo "Not logged in. Run: gh auth login" >&2
  exit 1
fi

gh repo create "$name" --"$visibility" --source=. --remote=origin \
  --description "Visualise changes on the Earth's surface from satellite SAR data, explained in plain language." \
  --push
git push origin --tags

# Protect main: changes land via pull request with passing CI.
owner=$(gh api user -q .login)
gh api -X PUT "repos/$owner/$name/branches/main/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON' >/dev/null && echo "Branch protection enabled on main." || echo "Could not enable branch protection (needs a paid plan for private repos). Skipped."
{
  "required_status_checks": { "strict": true, "contexts": ["frontend", "backend", "contract"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null
}
JSON

echo "Done: $(gh repo view --json url -q .url)"
