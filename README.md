# ai-do

A task store for coding agents. In Pi it adds task tools and a panel above the editor. Other agents reach the same store through the `ai-do` CLI or an MCP server.

## Features

- Task panel: a live task list above the editor, collapsible, with current, project and completed views.
- Task tools: the Pi agent creates, lists, edits, starts and completes tasks through the `todo_list`, `todo_create`, `todo_edit` and `todo_status` tools (plus `todo_link` and `todo_resolve`).
- todo.txt format: import and export todo.txt lines. Priority, dates and ai-do fields are stored as separate JSON keys.
- One store, synced adapters: tasks live in ai-do's JSONL file, and the optional Dex and Things adapters sync both ways.
- Export: `/todos export <path>` writes the store to a plain todo.txt file.
- Live reload: the panel watches task storage and refreshes when other agents change it.

## Requirements

- Pi coding agent for the panel and tools; [Bun](https://bun.sh) 1.4 or later for the CLI
- Optional: `dex` on PATH for the Dex adapter

## Installation

Once published:

```sh
pi install ai-do
```

Until then, install from a local checkout (see [Contributing](CONTRIBUTING.md)).

## Usage

- Ask the agent to create, list, start, edit, or complete tasks.
- `/todos [current|project|completed]` selects and displays a view.
- `/todos export <path> [--global]` exports to todo.txt, without overwriting an existing file.
- `/todos import <path> [--global]` appends todo.txt lines as records, skipping `aiid:`s already present.
- `/todos connect things <token>` saves the Things auth token (see the Things adapter docs).
- `/todos migrate .ai-do|.agents/ai-do` moves the project-scope store folder (todos, config, index). Trusted projects only; refuses to overwrite.
- `/todos scope project|global` switches scope and moves the `todos/` folder between the project folder (`.ai-do/` or `.agents/ai-do/`) and `~/.ai-do/projects/<name>.<id>/`. Refuses if the target already has todos. Trusted projects only.
- `--global` targets this project's store under `~/.ai-do/projects/<name>.<id>/` instead of the active one.
- `ctrl+shift+t` collapses or expands the panel.
- `ctrl+shift+v` cycles views.

Current shows tasks worked on in this session. Newly created top-level tasks remain in the project backlog until started. Tasks are stored as JSONL, one JSON object per task: `id`, `name`, `completed`, `started_at`, and optional `priority` (A-Z), `created` and `completed_date` (YYYY-MM-DD), `description`, `parent`, `blocked_by` (ids of tasks that must complete first; local only), `result`, `created_by` (agent name, or `@user` for a human) and `human` (GitHub username of the human in the loop; CLI/Pi create default it to you via `AI_DO_USER`, `git config github.user` or `gh`; `AI_DO_AGENT` names the CLI creator) (schema: `Task` in `src/core/todo.ts`). `+projects`, `@contexts` and other `key:value` tags stay in `name`. Export renders each record as a [todo.txt](https://github.com/todotxt/todo.txt) line, with ai-do fields as `aiid:`, `aistart:`, `aidesc:`, `aiparent:`, `airesult:`, `aiby:` and `aihuman:` tags, so import reads it back. Older `{"todo":"..."}` stores are converted on the next write. 

## CLI

Requires [Bun](https://bun.sh) (the `ai-do` binary is TypeScript run by Bun; `npx` without Bun will not work).

```sh
bun link                 # from a checkout; or: bun add -g ai-do
ai-do --help
ai-do create "Write tests" && ai-do list
ai-do sync               # two-way sync with adapters enabled in config (Dex, Things)
ai-do mcp                # serve the task tools over MCP (stdio)
```

The CLI runs in the current directory. It is trusted if `AI_DO_TRUST=1` is set or the project has an `.ai-do/` (or `.agents/ai-do/`) folder; otherwise it uses the temp store. `AI_DO_AGENT` names the task creator, `AI_DO_USER` sets your GitHub user, and `AI_DO_SESSION` overrides the session id.

## Supported agents

| Agent | Integration | Install |
|---|---|---|
| [Pi](agents/pi/index.ts) | Extension (`package.json` `pi` field) | `pi install ai-do` (see [Installation](#installation)) |
| [Claude Code](agents/claude-code/README.md) | Plugin with the `ai-do` skill | `/plugin install ai-do --marketplace arobida/ai-do` (Claude Code 2.1.275+), or `/plugin marketplace add arobida/ai-do` then `/plugin install ai-do@ai-do` |
| [Codex](agents/codex/README.md) | Skill | Copy to `~/.agents/skills/` |
| [opencode](agents/opencode/README.md) | Skill | Copy to `.opencode/skills/` or `~/.config/opencode/skills/` |
| [Cursor](agents/cursor/README.md) | Skill | Copy to `.cursor/skills/` or `~/.cursor/skills/` |

Non-Pi agents need the `ai-do` CLI on PATH. Build a target with `bun run build:agent <name>`, which writes `dist/<name>/`. It copies `agents/shared/` first, then `agents/<name>/` on top, so a file at the same path in `agents/<name>/` replaces the shared one.

## Storage

| Scope | Todos file |
|---|---|
| `project` (default, trusted projects) | `.ai-do/todos/<project>.todos.jsonl`, or `.agents/ai-do/...` if that exists |
| `global` | `~/.ai-do/projects/<project>.<id>/todos/<project>.todos.jsonl` |
| `temp` (and untrusted projects) | same layout under `$TMPDIR/ai-do/<session-hash>/.ai-do/`; may be removed by the OS |

On first use ai-do creates the folder with a `config.json`, a `todos/lists.jsonl` index (`id`, `name`, `file`, `created` per todos file) and a starter `Hello World` todo. New permanent stores get the todo, and so does the first run after install even in temp. Other temp stores start empty. Each project's id is stored in its local `config.json` (which stays in the project in both scopes) and keys its record in `~/.ai-do/projects/projects.jsonl` (`id`, `name`, `path`, `scope`, `created`). `scope: "global"` projects keep their store in `~/.ai-do/projects/<name>.<id>/`; `project` scope creates no global folder. `<project>` is the working directory's name.

Adapters sync ai-do's store with other todo apps. Each has its own connect instructions, capabilities and limitations:

- [Dex](src/core/adapters/dex/README.md)
- [Things 3](src/core/adapters/things/README.md)

## Configuration

`config.json` files are JSONC (comments and trailing commas allowed) and start with a `$schema` URL pinned to your installed version, so editors autocomplete and check every option ([`schema.json`](schema.json); each adapter's options are in `src/core/adapters/<name>/<name>.schema.json`). ai-do keeps that URL current when you upgrade. Precedence: `~/.ai-do/config.json` (global) < the project's ai-do `config.json` < environment (`AI_DO_FILE`, `AI_DO_SCOPE`). `AI_DO_HOME` moves `~/.ai-do`.

```json
{"adapters": {"dex": {"sync": true}}, "scope": "project"}
```

- `adapters`: per-adapter options; `dex` or `things`, each with `sync` (boolean) and `human` (`"me"` or a GitHub username: sync only tasks whose `human` matches; tasks with no human stay local).
- `scope`: `project` (default), `global` or `temp`; read from the global config or `AI_DO_SCOPE`.
- `file`: explicit todos file, overriding scope. `~/` supported; relative paths resolve from Pi's working directory.

Changing scope or file selects a different store and does not migrate tasks; use export and import. Invalid config raises an error. Run `/reload` after editing config.

## Development

Tech stack, project structure, local development and publishing are in [CONTRIBUTING.md](CONTRIBUTING.md).
