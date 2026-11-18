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
