# dibs for Claude Code

This Claude Code plugin ships the shared `dibs` skill. It requires the `dibs` CLI on your PATH.

## Install

```sh
# 1. CLI on PATH (or `bun link` from the repo root)
bun i -g @dibs.ai/dibs

# 2. Build the plugin into dist/claude-code
bun run build:agent claude-code

# 3. Add the local marketplace and install
claude plugin marketplace add ./dist/claude-code
claude plugin install dibs@dibs
```

Verify with `claude plugin validate dist/claude-code`, then restart Claude Code to load the `dibs` skill.

## Tools (MCP)

Requires `dibs` on your PATH (install it with `bun i -g @dibs.ai/dibs`). Add this to `.mcp.json`:

```json
{"mcpServers":{"dibs":{"command":"dibs","args":["mcp"]}}}
```

## Task panel

A live task panel sits above the prompt. It shows the panel title, then each task as `✓`, `◐` or `○` with its id and name, `+N more` when rows are cut, or an empty-state message. It refreshes at session start, every 3 seconds, and after any `todo_` tool call. Tasks this session touched are tracked and passed to `dibs panel --mine`.

Use `/todos` to cycle views, `/todos current|project|completed` to pick one, and `/todos toggle` to collapse or expand the panel.

Requires Claude Code v2.1.287+ and `dibs` on your PATH. If `dibs` fails, the panel is hidden.
