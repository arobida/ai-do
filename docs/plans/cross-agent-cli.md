# Plan: ai-do — core, CLI, and per-agent integrations

Status: plan (2026-11-17). Follows AGENTS.md: small tasks, each delegated to a Haiku/Sonnet subagent (low/no thinking), reviewed and `bun test`-ed by the lead before the next one. Commit each task with `wt step commit`.

## Decisions
- Rename `pi-do` → `ai-do` (package, CLI binary, store folder, env vars).
- Trust outside Pi: trusted if `AI_DO_TRUST=1` or the project already has an `.ai-do/` folder; otherwise the temp store.
- One package, three layers. No workspaces/monorepo tooling until a layer needs its own release.

## Layout
```
src/core/          shared by every surface; no host imports
  todo.ts tasks.ts store.ts util.ts ctx.ts   (ctx.ts: Ctx = { cwd; trusted(); sessionId(); exec() })
  adapters/sync.ts adapters/dex/ adapters/things/
src/cli/index.ts   `ai-do` binary; builds a Ctx from process.cwd()
agents/
  shared/          code/assets reused by several agents
    skills/ai-do/SKILL.md   skill teaching the CLI
    hooks/                  hook scripts (e.g. session start/end -> ai-do claim/release), added when an agent needs them
  pi/              Pi extension (current src/index.ts: panel, shortcuts, tools)
  claude-code/     .claude-plugin/plugin.json, marketplace entry
  codex/           Codex plugin/skill manifest + install notes
  opencode/        opencode skill/plugin + install notes
  cursor/          .cursor/rules or skill + install notes
```
Rule: `agents/shared` imports only `src/core`; each `agents/<name>` imports `src/core` and `agents/shared`, never another agent; `src/cli` import only from `src/core`; `src/core` imports nothing host-specific. Enforced by a test that greps imports.

Override rule: an agent overrides shared logic by putting a file at the same relative path in its own folder (`agents/codex/skills/ai-do/SKILL.md` beats `agents/shared/skills/ai-do/SKILL.md`). Each agent's install output = `agents/shared/` copied first, then `agents/<name>/` on top. Code overrides use the same rule: `agents/<name>/hooks/x.ts` replaces `agents/shared/hooks/x.ts`; to extend instead of replace, import the shared one and wrap it. No config or registry.

## Tasks

| # | Task | Model | Done when |
|---|---|---|---|
| 1 | Rename pi-do → ai-do: package name, `.pi-do`→`.ai-do`, `~/.pi-do`→`~/.ai-do`, `PI_DO_*`→`AI_DO_*`, `piid:`-style todo.txt tags → `aiid:` etc., README/schema/docs. Keep reading old `.pi-do`/`piid:` (one-line fallback) so existing stores aren't lost. | Sonnet | `tsc && bun test` green; `grep -ri pi-do` only hits the fallback + CHANGELOG |
| 2 | Move files into `src/core/`; add `ctx.ts`; replace `ExtensionContext`/`pi.exec` in store + dex adapter with `Ctx`. | Sonnet | tests green; no `@earendil-works` import under `src/core` |
| 3 | Move `src/index.ts` → `agents/pi/index.ts`, adapting Pi's ctx to `Ctx`. Update `package.json` `pi.extensions`. | Haiku | tests green; Pi loads extension |
| 4 | `src/cli/index.ts`: `ai-do <list|ready|create|start|complete|edit|import|export|scope|migrate> [--global] [--json]`, trust rule above, session id from `AI_DO_SESSION` or ppid. `"bin": {"ai-do": "./src/cli/index.ts"}`. | Sonnet | `ai-do create x && ai-do list` round-trips |
| 5 | `test/cli.test.ts` (spawn in temp dir; create/list/complete/export; untrusted → temp) + `test/layers.test.ts` (import rule). | Haiku | `bun test` green |
| 6 | `agents/shared/skills/ai-do/SKILL.md`: when to use, each command with one example, id-prefix rule, "details go in description". | Haiku | lead review |
| 7 | `agents/claude-code/`: plugin manifest using the shared skill. | Haiku | `claude plugin validate` passes |
| 8 | `agents/codex/`: check current Codex docs for plugin/skill format, add manifest + install notes. | Haiku | skill visible in Codex |
| 9 | `agents/opencode/`: same, against current opencode docs. | Haiku | skill visible in opencode |
| 10 | `agents/cursor/`: same, against current Cursor docs (rules or skills). | Haiku | rule/skill visible in Cursor |
| 11 | `scripts/build-agent.ts <name>`: copy `agents/shared` then `agents/<name>` into `dist/<name>/` (agent wins on same path). Test: an override file replaces the shared one. Agents 7–10 install from `dist/<name>/`. | Haiku | test green |
| 12 | README "Supported agents" table, CHANGELOG, `files` gains `agents/`. | Haiku | `bun run pack:check` lists new files |

Order: 1 → 2 → 3 → 4 → 5 gate everything; 6 and 11, then 7–10 in parallel; 12 last.

## Skipped (add when asked)
MCP server (a thin wrapper over the CLI later), task panel outside Pi, session hooks/claims outside Pi.

## Risks
- Rename breaks existing users' stores and todo.txt exports; task 1's fallback must be tested.
- Pi + CLI writing the same file rely on `withLock`; not yet tested across processes.
- Codex/opencode/Cursor formats must come from their current docs, not memory.
