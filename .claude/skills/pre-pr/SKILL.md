---
name: pre-pr
description: Review the current branch locally with all four reviewer agents, fix what they find, and open the pull request only when every reviewer approves. Use before opening any pull request. Needs no API key; it runs in this session.
---

Reviews happen here, before a pull request exists. A pull request is opened only for a change that has already passed.

## 1. Deterministic checks

Run `pnpm verify`. Fix every failure before going further. Commit your work; the tree must be clean.

## 2. Review, in parallel

Get the change's fingerprint: `node scripts/agent/review-receipt.mjs fingerprint`.

Launch these four subagents at the same time, each in its own context. Give each only: the branch name, the base (`origin/main`), the task issue number if there is one, and the fingerprint. Do not tell them what you think of the change.

| Subagent | Verdict file |
|---|---|
| `reviewer` | `.agent/code-verdict.json` |
| `design-guardian` | `.agent/design-verdict.json` |
| `security-reviewer` | `.agent/security-verdict.json` |
| `qa` | `.agent/qa-verdict.json` |

Tell each: "No pull request exists yet. Do not post comments. Write your verdict file as your definition specifies, adding a top-level `"fingerprint"` field with the value you were given, and return your findings."

## 3. Fix and repeat

If any reviewer did not approve:

1. Read every finding. Fix the cause. If you believe a finding is wrong, do not ignore it: give the reviewer your reasoning on the next round and let it decide.
2. `pnpm verify`, commit, get the new fingerprint.
3. Run **all four** reviewers again on the new version. A fix for one reviewer can break something another approved.

Stop after three rounds without full approval. Report what remains unresolved and do not open a pull request.

## 4. Receipt, push, pull request

1. `node scripts/agent/review-receipt.mjs write`. It refuses unless all four verdicts approve this exact version, then records an empty commit carrying the fingerprint.
2. `git push -u origin <branch>`.
3. `gh pr create` using the template. In the description, list each reviewer's verdict and any non-blocking notes.
4. `gh pr merge --auto --squash`. GitHub merges when `CI passed`, `Review receipt` and `Protected paths` are green.

Any commit after the receipt changes the fingerprint and fails the `Review receipt` check: run this skill again.

Never write a verdict file yourself, never edit one, and never record a receipt for a version a reviewer did not see. No AI attribution in commits or the pull request.
