---
name: plan-spec
description: Split an approved spec issue into task issues using the planner agent.
argument-hint: <issue-number>
disable-model-invocation: true
---

Act as the planner defined in `.claude/agents/planner.md`. Read that file and follow it exactly for spec issue #$0 (`gh issue view $0`). Create the task issues, link them from the spec, and report the list.
