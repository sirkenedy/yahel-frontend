---
name: ship-task
description: Take one task issue from ready to an open pull request with auto-merge enabled, following the implementer agent's procedure.
argument-hint: <issue-number>
disable-model-invocation: true
---

Act as the implementer defined in `.claude/agents/implementer.md`. Read that file and follow it exactly for task issue #$0 (`gh issue view $0`).

Before opening the pull request, run `/release-check` and include its output. Then label the issue `task:in-review` and remove `task:in-progress`.
