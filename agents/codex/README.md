# ai-do for Codex CLI

Requires the `ai-do` CLI on your PATH (`ai-do --help` must work).

## Install (skill)

```sh
bun run build:agent codex
mkdir -p ~/.agents/skills
cp -R dist/codex/skills/ai-do ~/.agents/skills/   # or: ln -s "$PWD/dist/codex/skills/ai-do" ~/.agents/skills/ai-do
```

To install per repo, copy the skill to `<repo>/.agents/skills/ai-do`. Restart Codex, which then lists the skill as `ai-do`. Codex invokes it implicitly, or you can run `$ai-do`.

## Plugin

`dist/codex/` is also a plugin root, holding `plugin.json` (portable format) and `skills/`. To ship it, add it to a marketplace (`.agents/plugins/marketplace.json`, entry `{"name":"ai-do","source":{"source":"local","path":"./dist/codex"},"policy":{"installation":"AVAILABLE","authentication":"ON_INSTALL"},"category":"Productivity"}`), then `codex plugin marketplace add <root>` and `codex plugin add ai-do@<marketplace-name>` (listed as `ai-do:ai-do`).

Docs: https://developers.openai.com/codex/skills, https://developers.openai.com/plugins/build/plugins

## Tools (MCP)

Requires `ai-do` on your PATH (for example, after `bun link`). Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.ai-do]
command = "ai-do"
args = ["mcp"]
env = { AI_DO_TRUST = "1" }  # Codex does not pass your shell env. Omit this if the project has an .ai-do folder
```
