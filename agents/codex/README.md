# ai-do for Codex CLI

Requires the `ai-do` CLI on PATH (`ai-do --help` must work).

## Install (skill, verified)

```sh
bun run build:agent codex
mkdir -p ~/.agents/skills
cp -R dist/codex/skills/ai-do ~/.agents/skills/   # or: ln -s "$PWD/dist/codex/skills/ai-do" ~/.agents/skills/ai-do
```

Per repo instead: copy to `<repo>/.agents/skills/ai-do`. Restart Codex; the skill is listed as `ai-do` (invoke implicitly or with `$ai-do`).

## Plugin (verified)

`dist/codex/` is also a plugin root: `plugin.json` (portable format) plus `skills/`. To ship it, put it in a marketplace (`.agents/plugins/marketplace.json`, entry `{"name":"ai-do","source":{"source":"local","path":"./dist/codex"},"policy":{"installation":"AVAILABLE","authentication":"ON_INSTALL"},"category":"Productivity"}`), then `codex plugin marketplace add <root>` and `codex plugin add ai-do@<marketplace-name>` (listed as `ai-do:ai-do`).

Docs: https://developers.openai.com/codex/skills, https://developers.openai.com/plugins/build/plugins

## Tools (MCP)

Requires `ai-do` on PATH (e.g. `bun link`). Add to `~/.codex/config.toml`:

```toml
[mcp_servers.ai-do]
command = "ai-do"
args = ["mcp"]
env = { AI_DO_TRUST = "1" }  # Codex does not pass your shell env; omit if the project has an .ai-do folder
```
