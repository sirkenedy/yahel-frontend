# The agent pipeline

How agents develop this repository without a person in every loop, what stops them doing damage, and what a maintainer must set up. Changing this file needs a maintainer.

**Status: written, not yet run.** The workflows have been parsed for syntax and the guard scripts tested locally. Nothing here has executed on GitHub, because that needs the secrets below. Expect to fix small things on the first runs.

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

A pull request merges when, and only when, three required checks are green: **CI passed**, **Agent review passed**, **Protected paths**. GitHub performs the merge through auto-merge; no agent has a merge permission of its own.

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

## What stops an agent doing damage

1. **Deterministic gates first.** Lint, types, tests, budgets and security scans do not have opinions and cannot be talked round.
2. **Reviewers are separate from the author.** Four fresh sessions with read-only tools. Each must write an explicit approval; a missing or malformed verdict fails the job.
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
- **Cost.** Every pull request runs four reviewer sessions; failures add fix sessions. Watch usage in the first week and adjust the schedule in `agent-implement.yml`.
- **Product judgement.** Agents cannot tell whether people like what was built. What to build stays with you, through the roadmap and the `spec:approved` label.

## Setup, once, by a maintainer

1. Push this repository's first commit to `main`.
2. Run `scripts/agent/setup-github.sh sirkenedy/yahel-frontend`. It creates the labels, enables auto-merge and squash merging, and protects `main` with the three required checks.
3. Add secrets: `ANTHROPIC_API_KEY`, and `AGENT_GH_TOKEN` (a fine-grained personal token or a GitHub App token with contents, pull requests and issues write on this repository). The default `GITHUB_TOKEN` is not enough: pull requests it opens do not trigger CI, so the gate would never run.
4. Add variables: `AGENTS_ENABLED=true`, and `API_SPEC_URL` if the contract watcher should reach a deployed backend.
5. Trial run: open a small task issue, label it `task:ready`, and watch one full loop before adding more.

If the agent's token belongs to a bot account, the Claude action may refuse to run on its pull requests until that bot is listed in the action's `allowed_bots` input. This was not tested.

## Handing work to the agents

Write a spec issue: the user problem, what done looks like, what is out of scope, and which design-system patterns apply. Label it `spec:approved`. Read the planner's task list before the implementer starts on it; that is the cheapest point to correct course.

## When something goes wrong

- A pull request labelled `needs-human`: read the last failing check and the reviewers' comments. Fix it yourself, or correct the task and remove the label and the `attempt:*` labels to let the agent try again.
- An agent keeps failing the same way: the rule it trips over is unclear or the task is too large. Fix the rulebook or split the task; do not loosen the check.
- Stop everything: set `AGENTS_ENABLED` to `false`.
