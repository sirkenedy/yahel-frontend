# The agent pipeline

How agents develop this repository without a person in every loop, what stops them doing damage, and what a maintainer must set up. Changing this file needs a maintainer.

**Status.** CI has run on GitHub and passes. The local review flow (`/pre-pr`) and the receipt script were tested locally. The optional in-CI agent workflows have only been parsed for syntax; they have never run.

## Default model: review locally, no API key

Agents run in Claude Code on the author's machine, under a Claude subscription. Nothing in the repository needs an Anthropic key.

1. Work on a branch (by hand, or with `/ship-task <issue>`).
2. Run **`/pre-pr`**. It runs `pnpm verify`, works out which tier of review the change needs, runs that review, and fixes real defects.
3. Only then does it record a **review receipt**, push, open the pull request and enable auto-merge.
4. GitHub merges when three required checks are green: **CI passed**, **Review receipt**, **Protected paths**.

### Review is proportionate

How much review a change gets is decided by `scripts/agent/review-receipt.mjs` from the paths it touches, not by its author.

| Tier | Triggered by | Review |
|---|---|---|
| Full | Sign-in, session, the API client, dependencies, build and test tooling, workflows, agent definitions, the rulebook, `scripts/` | Four reviewers: code, design, security, QA |
| Standard | Ordinary feature and fix work | One combined review that covers security, correctness, design and tests |
| Light | Documentation only | None; CI is the check |

Only **blockers** stop a change: wrong behaviour, a vulnerability, data loss, a criterion not met or untested, a test that cannot fail, a loosened check. **Majors** (it works, but something should be fixed soon) do not block: the author files them as a follow-up issue and the receipt records its number. A security finding is always a blocker.

There is one fix round. If a blocker survives it, the change stops and comes to a person with the open items listed. The first round is the whole review: each reviewer reports everything it has in one pass. In the fix round the same reviewers check only that their findings are resolved and review the lines the fix changed; a new finding in unchanged code becomes a note on the follow-up issue and does not block, unless it is a security hole or data loss.

Why: the first end-to-end test took a small feature through four rounds, because any of four reviewers could veto on anything above a note, a missing test for working behaviour blocked like a defect, and fresh reviewers each round found different things. The cost of this lighter process is that some imperfect changes merge with follow-up issues open. Watch the `follow-up` label: if it only grows, tighten the tiers.

The receipt is an empty commit whose message carries a fingerprint of the change's added and removed lines, the tier, and any follow-up issue. The check also recomputes the tier, so a receipt for a lighter review than the change needs is refused. The `Review receipt` check recomputes the fingerprint; any edit after the review changes it and the check fails until `/pre-pr` runs again.

What the receipt proves, and what it does not: it proves that the approving verdicts its tier requires were recorded against exactly this change. It cannot prove the reviews were good, and someone determined to skip review could fabricate verdict files. It guards against forgetting and against changes slipped in after review, not against bad faith. CI's deterministic checks do not depend on it.

To run unattended without an API key, two options use the subscription instead: a scheduled task in Claude Code on the web that runs `/ship-task` on this repository, or the in-CI workflows below with a `CLAUDE_CODE_OAUTH_TOKEN` secret (created with `claude setup-token`) in place of an API key. Neither has been tested here.

## Optional model: agents inside GitHub Actions

Everything from here to "Setup" describes the in-CI workflows. They are switched off unless the variable `AGENTS_ENABLED` is `true`, and they need a credential in the repository. The in-CI implementer follows the same `/pre-pr` procedure as a person does: it has the four reviewers examine its change as separate subagents and records a receipt before it opens the pull request. A second, independent review inside GitHub Actions (`Agent review`) is available by also setting `AGENT_REVIEW_IN_CI` to `true`.

## The loop

```
spec issue ──(maintainer labels spec:approved)──▶ planner ──▶ task issues (task:ready)
                                                                    │
                              ┌─────────────────────────────────────┘
                              ▼
                        implementer ──▶ branch agent/<n>-… ──▶ pull request, auto-merge on
                              ▲                                      │
                              │                     ┌────────────────┼─────────────────┐
                              │                     ▼                ▼                 ▼
                         agent-fix            CI (deterministic)  Agent review    Protected paths
                    (up to 3 attempts)        static, unit,       code, design,   (runs from main)
                              ▲               build, browser,     security, QA
                              │               security
                              └──── any failure ────┘                │
                                                     all green ──────┴──▶ GitHub merges ──▶ main
```

With in-CI agents on, **Agent review passed** is a fourth gate on top of the three required checks. GitHub performs the merge through auto-merge; no agent has a merge permission of its own.

## Agents

Definitions are in `.claude/agents/`. Each workflow tells Claude to read one of these files and act as that agent.

| Agent | Triggered by | May write |
|---|---|---|
| planner | Issue labelled `spec:approved` | Issues only |
| implementer | Issue labelled `task:ready`, a schedule every 3 hours, or by hand | Code on `agent/*` branches |
| reviewer | Every pull request | Its verdict file and a comment |
| design-guardian | Every pull request | Its verdict file and a comment |
| security-reviewer | Every pull request | Its verdict file and a comment |
| qa | Every pull request | Its verdict file and a comment |
| contract-watcher | Backend dispatch, daily schedule | Code on `agent/*` branches |
| maintainer | Weekly schedule | Code on `agent/*` branches |
| docs-keeper | By hand | `docs/` and `design-system/docs/` |

Skills in `.claude/skills/` are for people and agents working in a session: `/new-feature`, `/new-component`, `/api-sync`, `/verify-ui`, `/release-check`, `/plan-spec`, `/ship-task`.

## Labels are the state machine

| Label | Meaning | Who applies it |
|---|---|---|
| `spec:approved` | The planner may split this spec | Maintainer |
| `task:ready` | An agent may implement this | Planner or maintainer |
| `task:in-progress` | An agent is on it | Pipeline |
| `task:in-review` | Pull request open | Pipeline |
| `attempt:1` to `attempt:3` | Automatic fix attempts used | Pipeline |
| `needs-human` | Agents stopped; a person decides | Pipeline or any agent |
| `human-approved` | A maintainer approved a protected-path change | Maintainer only |
| `agent` | Opened by an agent | Pipeline |

On GitHub only people with triage access or above can apply labels. An issue opened by a stranger does nothing until a maintainer labels it.

## Seeing what an agent did

The Claude action hides an agent's transcript from the job log. Every agent workflow saves a **redacted** copy as an artifact named `agent-transcript-…` on the run's summary page, kept for 7 days.

This repository is public, so anyone signed in to GitHub can download those artifacts, and GitHub does not mask secrets inside artifacts the way it does in logs. The agent's shell does hold a credential: its GitHub token (`GH_TOKEN` in the implement, fix, maintain and contract workflows, and a token supplied by the action in all of them).

Before upload, `scripts/agent/redact-transcript.mjs`, taken from `main`, replaces:

- the agent's GitHub token and the job's token, wherever they appear: plain, URL-encoded, JSON-escaped, reversed, hex in either case, and base64 at any alignment, including inside a larger encoded blob such as an environment dump. Each form is still matched when output wraps it across lines, groups it with spaces, or colours it;
- anything shaped like a GitHub, Anthropic, npm, Slack or AWS credential, a JWT, an authorization header, a URL carrying a password, or a private key.

The redaction step is given only the two tokens the agent already had, never the Anthropic credential or the backend token, so it adds no exposure of its own. Its behaviour is covered by tests (`pnpm test:scripts`, run in CI).

What it cannot do: it matches known values in known transformations, and known shapes. A credential encoded twice, compressed, encrypted, split by other separators, or of a shape it does not know, would pass. It has not been verified whether the Claude credential is visible to the agent's shell commands; if it is, only its plain form is caught, by shape. That takes a deliberately steered agent, which could also send a credential out directly, so the tool lists and the label gate remain the real controls. Transcripts also show the agent's reasoning and the output of every command. Treat them as public. If that is not acceptable, make the repository private or remove the two transcript steps.

## What stops an agent doing damage

1. **Deterministic gates first.** Lint, types, tests, budgets and security scans do not have opinions and cannot be talked round.
2. **Reviewers are separate from the author.** Four sessions of their own, with read-only tools, kept across review rounds so each starts from its earlier findings. Each must write an explicit approval; a missing or malformed verdict fails the job.
3. **Agents cannot change their own rules.** The protected-paths check runs from `main` with `pull_request_target`, so a pull request cannot edit the check, the workflows, the agent definitions, the lint config or the rulebook without a maintainer's label.
4. **Verdict checking runs from `main`.** The script that reads a reviewer's verdict is taken from `main`, not from the pull request.
5. **Branch protection.** No direct push to `main`, no force-push, linear history, required checks enforced for administrators too.
6. **Narrow tool lists.** Each workflow passes an explicit tool allowlist. Reviewers cannot edit code. Nobody can call `gh api`, change secrets or variables, or merge with administrator override.
7. **Bounded effort.** Turn limits and job timeouts on every run; at most three open agent pull requests; three fix attempts, then `needs-human` and auto-merge is switched off.
8. **A kill switch.** Set the repository variable `AGENTS_ENABLED` to anything other than `true` and every agent workflow stops. While it is off, a pull request needs the `human-approved` label to pass the review gate.
9. **Fork pull requests fail closed.** They receive no secrets, so the reviewers cannot run and the gate stays red.

## What this does not protect against

Be clear-eyed about the limits.

- **Reviewers are models too.** Four independent reviews reduce the chance of a bad merge; they do not remove it. A subtle logic error that passes its own tests can get through. The defence is the tests: keep acceptance criteria precise.
- **Browser tests run against a mock backend.** They prove the frontend against `e2e/support/api.ts`, not against the real API. If the mock drifts from the backend, green tests can ship a broken product. A staging smoke test against the real backend is on the roadmap and should become a required check before real users.
- **The QA reviewer runs the pull request's code** with the workflow's environment. For pull requests from this repository's own agents that is acceptable; do not extend the pipeline to untrusted contributors without sandboxing that job.
- **Prompt injection.** Issue text, fetched pages and code comments can contain instructions. The agent definitions tell agents to treat them as data, and the tool lists limit what a hijacked agent could do, but the label gate is the real control: read an outside issue before labelling it.
- **This repository is public.** Anyone can read the code, design documents and decisions, including pricing notes in `design-system/docs/decisions.md`. Make it private if that is not intended.
- **Usage.** Each `/pre-pr` round runs four reviewer sessions against your subscription's limits; a change that needs three rounds runs twelve.
- **Product judgement.** Agents cannot tell whether people like what was built. What to build stays with you, through the roadmap and the `spec:approved` label.

## Setup, once, by a maintainer

1. Run `scripts/agent/setup-github.sh sirkenedy/yahel-frontend`. It creates the labels, enables auto-merge and squash merging, and protects `main` with the three required checks.
2. That is all for the default model. Open Claude Code in this repository and use `/pre-pr`.

Only for the optional in-CI agents: secrets `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`, and `AGENT_GH_TOKEN` (pull requests opened with GitHub's default token do not trigger CI); variable `AGENTS_ENABLED=true`. If the agent's token belongs to a bot account, the Claude action may refuse to run on its pull requests until that bot is listed in its `allowed_bots` input.

## Staying in step with the backend

The backend repository commits its API description (`directory/api/openapi.json`). When that file changes on the backend's `main`, its `API contract` workflow sends this repository a `backend-api-changed` event with the commit and a summary of endpoints added, changed and removed, and opens an issue here labelled `needs-human` when the change can break callers. The `Agent contract` workflow then fetches the description at that commit, regenerates the client, and has the contract watcher fix what the change breaks.

Needs the secret `BACKEND_READ_TOKEN` (read access to the private backend repository). The event is accepted only when it names the repository in the `BACKEND_REPO` variable (default `sirkenedy/Nestjs-starter-app-federated`).

The design system flows the other way: it lives here, and the backend reads it with `npm run design:fetch`. The backend's `directory/design.md` lists what the design requires of the API and whether the API meets it yet.

## Handing work to the agents

Write a spec issue: the user problem, what done looks like, what is out of scope, and which design-system patterns apply. Label it `spec:approved`. Read the planner's task list before the implementer starts on it; that is the cheapest point to correct course.

## When something goes wrong

- A pull request labelled `needs-human`: read the last failing check and the reviewers' comments. Fix it yourself, or correct the task and remove the label and the `attempt:*` labels to let the agent try again.
- An agent keeps failing the same way: the rule it trips over is unclear or the task is too large. Fix the rulebook or split the task; do not loosen the check.
- Stop everything: set `AGENTS_ENABLED` to `false`.
