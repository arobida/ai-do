# ai-do for opencode

opencode loads skills from `skills/<id>/SKILL.md`, so it uses the shared `ai-do` skill unchanged. The skill calls the CLI, so `ai-do` must be on your PATH.

## Install

```sh
bun run build:agent opencode        # writes dist/opencode/skills/ai-do/SKILL.md

# project-local
mkdir -p .opencode/skills && cp -R dist/opencode/skills/ai-do .opencode/skills/

# or global
mkdir -p ~/.config/opencode/skills && cp -R dist/opencode/skills/ai-do ~/.config/opencode/skills/
```

Use `ln -s "$PWD/dist/opencode/skills/ai-do" <target>/ai-do` instead of `cp -R` to follow rebuilds.

To check, start opencode in the project and ask it to load the `ai-do` skill, or type `@ai-do`. The command `opencode debug skill` does not exist in v2.3.0.

Docs: https://opencode.ai/docs/skills/ (opencode also scans `.claude/skills` and `.agents/skills`).

## Tools (MCP)

Requires `ai-do` on your PATH (for example, after `bun link`). Add this to `opencode.json`:

```json
{"mcp":{"ai-do":{"type":"local","command":["ai-do","mcp"]}}}
```
