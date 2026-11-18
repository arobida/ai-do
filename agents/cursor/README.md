# dibs for Cursor

Cursor reads `SKILL.md` skills from `.cursor/skills/` (project) or `~/.cursor/skills/` (user), so it uses the shared skill unchanged. It requires the `dibs` CLI on your PATH.

## Install

From the dibs repo:

```sh
bun run build:agent cursor
```

Project install (run in your project root):

```sh
mkdir -p .cursor/skills && cp -R /path/to/dibs/dist/cursor/skills/dibs .cursor/skills/
```

User-wide install:

```sh
mkdir -p ~/.cursor/skills && cp -R /path/to/dibs/dist/cursor/skills/dibs ~/.cursor/skills/
```

Restart Cursor, then look for `dibs` under Customize -> Skills. You can also run `/dibs` in chat.

Docs: https://cursor.com/docs/context/skills

## Tools (MCP)

Requires `dibs` on your PATH (for example, after `bun link`). Add this to `.cursor/mcp.json`:

```json
{"mcpServers":{"dibs":{"command":"dibs","args":["mcp"]}}}
```
