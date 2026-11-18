# ai-do for Cursor

Cursor reads `SKILL.md` skills from `.cursor/skills/` (project) or `~/.cursor/skills/` (user), so it uses the shared skill unchanged. It requires the `ai-do` CLI on your PATH.

## Install

From the ai-do repo:

```sh
bun run build:agent cursor
```

Project install (run in your project root):

```sh
mkdir -p .cursor/skills && cp -R /path/to/ai-do/dist/cursor/skills/ai-do .cursor/skills/
```

User-wide install:

```sh
mkdir -p ~/.cursor/skills && cp -R /path/to/ai-do/dist/cursor/skills/ai-do ~/.cursor/skills/
```

Restart Cursor, then look for `ai-do` under Customize -> Skills. You can also run `/ai-do` in chat.

Docs: https://cursor.com/docs/context/skills

## Tools (MCP)

Requires `ai-do` on your PATH (for example, after `bun link`). Add this to `.cursor/mcp.json`:

```json
{"mcpServers":{"ai-do":{"command":"ai-do","args":["mcp"]}}}
```
