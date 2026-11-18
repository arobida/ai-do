---
name: ai-do
description: Use when tracking multi-step work, todos, or task lists in this project with the ai-do CLI, including breaking a task into subtasks, checking what is unblocked, and marking work started or done.
---

# ai-do

Track work as tasks with the `ai-do` CLI. Use it for any multi-step job, so progress survives the session.

## When to use

- The request has several steps, or you are about to split work into subtasks.
- You need to know what is next, or what is blocked.
- You finish a unit of work and should record the result.

## Commands

```sh
ai-do create "Write parser tests" --description "Cover empty input, nested blocks, and CRLF line endings"
ai-do create "Wire CLI flag" --parent a1b2 --blocked-by c3d4,e5f6
ai-do list --query parser
ai-do ready
ai-do start a1b2
ai-do complete a1b2 --result "Parser tests added; 3 edge-case bugs fixed"
ai-do edit a1b2 --description "Updated scope: include BOM handling"
ai-do edit a1b2 --blocked-by c3d4
ai-do list --human me   # tasks for the human in the loop; `create` defaults --human to that user, and `--human <user>` overrides
ai-do import plan.txt
ai-do export tasks.txt
ai-do link a1b2
ai-do resolve aido://<project-id>/<task-id>   # a link from `ai-do link`
ai-do scope global
ai-do migrate .agents/ai-do
ai-do sync
```

If Dex or Things sync is enabled in config, run `ai-do sync` before reading tasks and after finishing work.

## Rules

- Prefix every command with `AI_DO_AGENT=<your agent name>` (e.g. `AI_DO_AGENT=claude-code ai-do create ...`) so tasks record who created them.
- Ids accept a unique prefix: `ai-do start a1b` works when only one id starts with `a1b`.
- Keep the name short. Put details, context, and acceptance criteria in `--description`.
- Run `start` before you begin a task.
- Run `complete --result "..."` when the task is done. The result states what changed, in one line.
- `ready` lists unblocked work. Pick from it before starting anything else.
- `list` and `ready` print one line per task. Add `--json` for machine-readable output.
- `--global` writes to the global store instead of the project store. Use it only for tasks that span projects.

## Trust and storage

- A project is trusted when `AI_DO_TRUST=1` is set, or when the project has an `.ai-do/` or `.agents/ai-do` directory.
- Trusted projects store tasks in the project. Untrusted projects use a temporary session store, which the CLI never writes into the repo.
- `AI_DO_SESSION` overrides the session id used for claims.
