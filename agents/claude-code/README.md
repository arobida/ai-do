# ai-do for Claude Code

This Claude Code plugin ships the shared `ai-do` skill. It requires the `ai-do` CLI on your PATH.

## Install

```sh
# 1. CLI on PATH (from the repo root: `bun link`, or `bun add -g ai-do`)
bun link

# 2. Build the plugin into dist/claude-code
bun run build:agent claude-code

# 3. Add the local marketplace and install
claude plugin marketplace add ./dist/claude-code
claude plugin install ai-do@ai-do
```

Verify with `claude plugin validate dist/claude-code`, then restart Claude Code to load the `ai-do` skill.

## Tools (MCP)

Requires `ai-do` on your PATH (for example, after `bun link`). Add this to `.mcp.json`:

```json
{"mcpServers":{"ai-do":{"command":"ai-do","args":["mcp"]}}}
```

## Task panel

A live task panel sits above the prompt. It shows the panel title, then each task as `✓`, `◐` or `○` with its id and name, `+N more` when rows are cut, or an empty-state message. It refreshes at session start, every 3 seconds, and after any `todo_` tool call. Tasks this session touched are tracked and passed to `ai-do panel --mine`.

Use `/todos` to cycle views, `/todos current|project|completed` to pick one, and `/todos toggle` to collapse or expand the panel.

Requires Claude Code v2.1.287+ and `ai-do` on your PATH. If `ai-do` fails, the panel is hidden.
