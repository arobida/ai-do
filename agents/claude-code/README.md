# dibs for Claude Code

This Claude Code plugin ships the shared `dibs` skill. It requires [Bun](https://bun.sh); the CLI runs as `bunx @dibs.ai/dibs`.

## Install

```sh
# 1. Build the plugin into dist/claude-code
bun run build:agent claude-code

# 2. Add the local marketplace and install
claude plugin marketplace add ./dist/claude-code
claude plugin install dibs@dibs
```

Verify with `claude plugin validate dist/claude-code`, then restart Claude Code to load the `dibs` skill.

## Tools (MCP)

Runs the CLI through `bunx` (needs [Bun](https://bun.sh)). Add this to `.mcp.json`:

```json
{"mcpServers":{"dibs":{"command":"bunx","args":["@dibs.ai/dibs","mcp"]}}}
```

## Task panel

A live task panel sits above the prompt. It shows the panel title, then each task as `✓`, `◐` or `○` with its id and name, `+N more` when rows are cut, or an empty-state message. It refreshes at session start, every 3 seconds, and after any `todo_` tool call. Tasks this session touched are tracked and passed to `dibs panel --mine`.

Use `/todos` to cycle views, `/todos current|project|completed` to pick one, and `/todos toggle` to collapse or expand the panel.

Requires Claude Code v2.1.287+ and [Bun](https://bun.sh). If the CLI fails, the panel is hidden.
