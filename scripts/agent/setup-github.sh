#!/usr/bin/env bash
# One-time repository setup for the agent pipeline. Run by a maintainer, never by an agent.
# Usage: scripts/agent/setup-github.sh owner/repo
set -euo pipefail
repo="${1:?usage: setup-github.sh owner/repo}"

label() { gh label create "$1" --repo "$repo" --color "$2" --description "$3" --force; }
label "spec:approved"   "0E8A16" "A maintainer approved this spec; the planner may split it into tasks"
label "task:ready"      "1D76DB" "Ready for an agent to implement"
label "task:in-progress" "FBCA04" "An agent is implementing this"
label "task:in-review"  "5319E7" "Pull request open, under review"
label "needs-human"     "B60205" "Agents stopped; a person must decide"
label "human-approved"  "0E8A16" "A maintainer approved a change to protected paths"
label "agent"           "C5DEF5" "Opened by an agent"
label "attempt:1" "EDEDED" "First automatic fix attempt"
label "attempt:2" "EDEDED" "Second automatic fix attempt"
label "attempt:3" "EDEDED" "Third and last automatic fix attempt"

gh repo edit "$repo" --enable-auto-merge --delete-branch-on-merge --enable-squash-merge

gh api --method PUT "repos/$repo/branches/main/protection" --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["CI passed", "Review receipt", "Protected paths"] },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON

echo "Done. Nothing else is needed for the default, local-review model: run /pre-pr in Claude Code before opening a pull request."
echo "Optional, only to run agents unattended inside GitHub Actions:"
echo "  1. Secret CLAUDE_CODE_OAUTH_TOKEN (from a Claude subscription) or ANTHROPIC_API_KEY."
echo "  2. Secret AGENT_GH_TOKEN: a fine-grained token with contents, pull requests and issues write."
echo "  3. Variable AGENTS_ENABLED=true."
