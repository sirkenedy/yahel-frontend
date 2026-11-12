---
name: pre-pr
description: Review the current branch locally at the level its changes need, fix real defects, and open the pull request only once the review passes. Use before opening any pull request. Needs no API key; it runs in this session.
---

Reviews happen here, before a pull request exists. How much review a change gets depends on what it touches, and only real defects stop it.

## 1. Deterministic checks

Run `pnpm verify`. Fix every failure before going further. Commit your work; the tree must be clean.

## 2. Find the tier

`node scripts/agent/review-receipt.mjs tier`. The script decides from the changed paths; you do not choose.

| Tier | What triggers it | Review |
|---|---|---|
| **full** | Sign-in, session, the API client, dependencies, build or test tooling, workflows, agent definitions, the rulebook, anything under `scripts/` | Four reviewers in parallel: `reviewer` (`code`), `design-guardian` (`design`), `security-reviewer` (`security`), `qa` (`qa`) |
| **standard** | Ordinary feature and fix work | One combined review: the `reviewer` subagent, told this is a standard review, writing `.agent/review-verdict.json` |
| **light** | Documentation only | None. CI is the check. Go to step 5 |

## 3. Review

Get the fingerprint: `node scripts/agent/review-receipt.mjs fingerprint`.

Launch the reviewer or reviewers for the tier, each in its own context. Give each only: the branch name, the base (`origin/main`), the task issue number if there is one, the tier, and the fingerprint. Do not tell them what you think of the change. Tell each: "No pull request exists yet. Do not post comments. Write your verdict file as your definition specifies, with the fingerprint you were given, and return your findings."

## 4. Act on the findings

- **Blockers** stop the change. Fix the cause, `pnpm verify`, commit, and send the new fingerprint back to the **same** reviewers, telling each this is the fix round (continue their sessions if you can; otherwise start new ones and give each its previous verdict file from `.agent/previous/`). That is the one fix round. If a blocker remains after it, stop: comment on the issue with what is unresolved, label it `needs-human`, and do not open a pull request.
- **Majors** do not stop the change. Fix the cheap ones now if you like (that changes the fingerprint, so the reviewers look again). File what remains as one follow-up issue: `gh issue create --label follow-up` listing each major with its file and the reviewer's reason. Keep its number.
- **Notes** go in the pull request description.

If you believe a finding is wrong, say why to the reviewer and let it decide. Never drop a finding silently.

## 5. Receipt, push, pull request

1. `node scripts/agent/review-receipt.mjs write`, adding `--follow-up <issue number>` if majors remain. Run it **as a command on its own** and read its output. If it refused, stop: do not push.
2. Only after the receipt was recorded: `git push -u origin <branch>`. Never join this to step 1 in one command, and never push a branch that has no receipt.
3. `gh pr create` using the template. State the tier, each reviewer's verdict, the follow-up issue, and the notes.
4. `gh pr merge --auto --squash`. GitHub merges when `CI passed`, `Review receipt` and `Protected paths` are green.

Any commit after the receipt changes the fingerprint and fails the `Review receipt` check: run this skill again.

Never write or edit a verdict file yourself, and never record a receipt for a version a reviewer did not see. No AI attribution in commits or the pull request.

## Changing the rules themselves

A change that loosens a check, or alters how review works, will be blocked by the reviewers on purpose: agents do not relax their own rules. Such a change is the maintainer's to make. Open it as a pull request without a receipt, say so in the description, and leave it for the maintainer to label and merge.
