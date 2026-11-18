# ai-do for Claude Code

Claude Code plugin that ships the shared `ai-do` skill. Requires the `ai-do` CLI on PATH.

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

Verify with `claude plugin validate dist/claude-code`. Restart Claude Code; the `ai-do` skill is then available.

## Tools (MCP)

Requires `ai-do` on PATH (e.g. `bun link`). Add to `.mcp.json`:

```json
{"mcpServers":{"ai-do":{"command":"ai-do","args":["mcp"]}}}
```
