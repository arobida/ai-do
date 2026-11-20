# Plan: run dibs on Node, developed with Nub

Status: done (2026-11-20). Follows AGENTS.md: small tasks, each delegated to a Haiku/Sonnet subagent (low/no thinking). The lead reviews each diff and runs the tests before starting the next task. Commit each task with `wt step commit`.

Goal: `npx @dibs.ai/dibs <cmd>` works on a machine that has Node and nothing else. Contributors develop with Nub (`nub <file>`, `nub run`, `nub install`), following https://nubjs.com/guides/bun-to-nub.

## Decisions

- **Nub is the dev runtime. The npm package ships plain JS.** `npx` installs dibs into `node_modules`. Node refuses to strip types there, and `@nubjs/runner` never transpiles under `node_modules` (https://nubjs.com/docs/standalone, "Features"). A `.ts` bin therefore cannot run through `npx`, so the package needs a build step.
- **Nub's polyfills and unflagged APIs do not reach npx users.** Nub adds them only when `nub` starts the process (https://nubjs.com/docs/runtime). Shipped code (`src/`) may use only APIs that are native in the `engines.node` floor. Tests run the built CLI on plain `node` to enforce this.
- **Node floor `>=26`,** the current LTS line (v26.13.1, 2026-11-10, https://nodejs.org/dist/index.json). Dev pin: `nub node pin 26`. Node 26 has web storage on by default, so the bin needs no `--experimental-*` flags.
- **Build with `tsc`,** already a devDependency: no new bundler. `tsconfig.build.json` sets `rootDir: src`, `outDir: lib`, `rewriteRelativeImportExtensions` and `declaration`. `lib/core/store.js` still reads `../../package.json`, so it needs no change.
- **Tests move to Vitest.** It keeps `expect`, `test.skipIf` and module mocks (`mock.module` becomes `vi.mock`), so most test files change only their import. With `node:test`, every assertion would need rewriting.
- **`Bun.$` in scripts becomes `dax`** (devDependency), as the guide recommends; the call sites keep their shape.
- **Replace `bun.lock` with `nub.lock`** (`nub pm use nub`). Nub 0.11.1 cannot parse the `dibs@root:` entry that Bun writes for `agents/pi`'s `workspace:*` dependency on the root package (`ERR_NUB_LOCKFILE_UNSUPPORTED_SOURCE`), and `nub import` fails on the same entry. Build scripts of `@google/genai` and `protobufjs` (transitive, from the Pi and opencode SDKs) are denied in `allowScripts`; Bun never ran them either.
- **`bunx @dibs.ai/dibs` becomes `npx -y @dibs.ai/dibs`** everywhere users or agents run the CLI.

## Bun usage to replace

| Where | Bun API | Replacement |
|---|---|---|
| `src/cli/index.ts:1` | `#!/usr/bin/env bun` | `#!/usr/bin/env node` (tsc keeps the shebang) |
| `src/cli/index.ts:37` | `Bun.spawn` in `ctx.exec` | `node:child_process` `execFile` with `signal`, resolving `{stdout, stderr, code}` |
| `scripts/bump.ts`, `scripts/release.ts` | `$` from `"bun"`, `Bun.file`, `Bun.write`, `Bun.sleep` | `dax`, `node:fs/promises`, `node:timers/promises` |
| `scripts/bump.ts` | `bun pm version`, `bun test`, `bun scripts/release.ts` | `nub version`, `nub run test`, `nub scripts/release.ts` |
| `scripts/release.ts` | `bun publish`, `bunx jsr publish` | `nub publish --access public`, `nubx jsr publish` |
| `scripts/build-agent.ts`, tests | `import.meta.dir` | `import.meta.dirname` |
| 9 files in `test/` | `bun:test`, `mock.module` | `vitest`, `vi.mock` |
| `test/cli.test.ts`, `attribution`, `mcp`, `extension` | `Bun.spawn(Sync)(["bun", cli …])` | `node:child_process` running `nub` on the source |
| `test/extension.test.ts:45-49,99` | `Bun.file`, `Bun.which` | `node:fs`; a `which` check through `spawnSync` |
| `agents/claude-code/hooks/register.tsx:29`, `agents/opencode/plugin/tui.tsx:26` | `bunx` | `npx -y` |
| `package.json`, `tsconfig.json` | `@types/bun`, `types: ["bun"]`, `engines.bun`, `bun` scripts | `@types/node`, `engines.node`, `nub` scripts |

## Tasks

| # | Task | Model | Done when |
|---|---|---|---|
| 1 | Toolchain: `nub node pin 26`; in `package.json`, drop `packageManager` and `engines.bun`, add `engines.node: ">=26"`, swap `@types/bun` for `@types/node`, add `vitest` and `dax` dev deps (`nub add -D`); set `tsconfig.json` `types: ["node"]`. | Haiku | `nub install` succeeds; `bun.lock` updated |
| 2 | Tests to Vitest: imports, `vi.mock` (partial `node:fs` mock in `misc.test.ts:91` uses `importOriginal`), `import.meta.dirname`, spawns run `nub <cli>`, `Bun.file`/`Bun.which` replaced. Script `"test": "vitest run"`. | Sonnet | `nub run test` passes the same test count as `bun test` on `main` |
| 3 | CLI: shebang and `ctx.exec` on `node:child_process`. | Haiku | `nub src/cli/index.ts create x && nub src/cli/index.ts list` round-trips; tests pass |
| 4 | Build: `tsconfig.build.json` (above), `"build": "tsc -p tsconfig.build.json"`, `"prepack": "nub run build"`; `bin` points at `./lib/cli/index.js`; `exports` map `types` and `default` to `lib/`; `files` gains `lib/`; `.gitignore` gains `lib/`. Check that TypeScript 7 honors `rewriteRelativeImportExtensions`; if it does not, report back before adding a bundler. | Sonnet | `node lib/cli/index.js --help` runs on plain Node |
| 5 | npx smoke test: `test/npx.test.ts` runs `nub pack` into a temp dir, then `npx -y <tarball> create t`, `list --json` and `mcp` startup, with plain `node` on the path and no Nub. | Sonnet | test passes; it fails if `bin` points back at `.ts` |
| 6 | Scripts: `bump.ts`, `release.ts`, `build-agent.ts` off Bun (table above). `"pack:check": "nub pack --dry-run"`. Confirm that `nub publish` rewrites `workspace:*` in `agents/pi` (inspect `nub pack` output from that directory). | Sonnet | `nub run pack:check` lists `lib/`; `agents/pi` tarball depends on a real version |
| 7 | `bunx` to `npx -y`: `register.tsx`, `tui.tsx`, `agents/shared/skills/dibs/SKILL.md`, MCP config snippets in `agents/*/README.md` and `agents/claude-code/.mcp.json`. | Haiku | `semble search "bunx"` hits only `docs/research/` and the CHANGELOG |
| 8 | Docs (load `technical-writing` first): README, CONTRIBUTING, AGENTS.md (`bun test` to `nub run test`, `bunx repomix` to `nubx repomix`), agent READMEs ("Requires Bun" to "Requires Node 26+"), CHANGELOG entry. | Haiku | lead review |
| 9 | Library consumers: Pi loads `agents/pi/index.ts`, which imports `@dibs.ai/dibs`. With `exports` on `lib/`, Pi in this repo needs a build first. Decide: run `nub run build` in a `postinstall`, or add a `"source"` export condition. Verify by loading the extension in Pi. | Sonnet | `/reload` in Pi shows the panel |

Order: 1 → 2 → 3 gate everything. Then 4 → 5. Task 6 can run alongside 4 and 5. Then 7 and 8 in parallel, and 9 last.

## Skipped (add when asked)

- `nub compile` to a standalone executable: `npx` covers distribution.
- A `nub.jsonc`: the defaults (TS, `.env` loading, polyfills, unflagging) cover dev. Add one only when a setting needs to change.
- CI with `nubjs/setup-nub`: the repo has no CI workflow today.
- Rewriting `docs/research/`: those documents are historical and stay as written.

## Risks

- **Polyfill drift.** Code that runs under `nub` can call an API that plain Node 26 lacks; such code breaks only for npx users. Task 5 catches this only on the code paths it exercises.
- **`npx` cold start.** First run downloads the package and its two dependencies, then starts Node. Expected to be slower than `bunx`, but not measured. The Claude Code hook in `register.tsx` runs the CLI on every panel refresh.
- **`nub publish` semantics are unverified** for `workspace:*` and for the browser-approval flow that `release.ts` relies on. Task 6 checks the first; the second can only be checked at the next release.
- **JSR** still publishes `src/*.ts` through `jsr.json`. No change is planned; check it at the next release.
