# Persistent plugin UI in coding agents

Date: 2026-11-18. Question: can a plugin render a persistent, live widget (like Pi's `ctx.ui.setWidget(id, factory, { placement: "aboveEditor" })`) in Claude Code, Codex CLI, Cursor (IDE and CLI) and opencode?
**D** = read in official docs. **S** = read in source on GitHub. **F** = forum or other secondary source, not authoritative. **U** = unverified.

## Verdict first

- **Claude Code: yes.** A plugin "mod" can draw a band directly above the prompt and open panes (D). This is the direct equivalent of Pi's `aboveEditor` widget.
- **opencode: yes.** A TUI plugin can fill named slots, including `session.composer.top` and `sidebar.content` (D).
- **Cursor IDE: yes, through a normal VS Code extension** (tree view or webview in the sidebar), with known webview gaps (F).
- **Codex CLI and cursor-agent CLI: no.** Both expose only a fixed menu of built-in status-line items. Nothing lets a plugin draw custom content.

## Claude Code

Sources: https://code.claude.com/docs/en/statusline, https://code.claude.com/docs/en/plugins-reference, https://code.claude.com/docs/en/plugins/mods/create, https://code.claude.com/docs/en/plugins/mods/interface (all fetched 2026-11-18).

### Mods (the real answer)

- A mod is a plugin whose `hooks/hooks.json` lists `"modules": ["./register.js"]`, which exports `register(on)` (D, mods/create). It ships and installs through the normal plugin marketplace.
- `on('ui.render', { component: 'AbovePrompt' }, ...)` draws a row in "a strip directly above the prompt input. Each mod that draws there gets its own row" (D, mods/interface). Before v2.1.323 all mods shared one drawing in the band.
- `{ component: 'Pane' }` with `$.ui.open(...)`: "a sidebar beside the transcript in a wide fullscreen terminal, or a framed region above the prompt otherwise" (D). Option `rows` sets the height above the prompt.
- Live update: call `$.ui.invalidate('ui.render')` to redraw (D). Also `$.ui.toast(msg)` and one status line per mod (status line cut at 200 characters or two rows) (D).
- Requires Claude Code v2.1.287 or later. The docs warn events and methods "can change between releases". Mods are off under `--safe-mode`, `--bare`, `disableAllHooks` or managed settings that block them (D).

### statusLine (fallback)

- Multi-line: each line the script prints is a separate row (D, statusline).
- Refresh: event-driven, debounced 300 ms; optional `refreshInterval` (seconds, minimum 1) re-runs it on a timer; a new update cancels the in-flight script (D).
- Not a plugin component. The `plugin.json` component list has no `statusLine` key (D, plugins-reference). **U:** whether a plugin's bundled `settings.json` may set `statusLine`. Either way, the status line is one per user, so a plugin would overwrite the user's own.

### Other surfaces

- Experimental `monitors` run a background command whose output reaches Claude as notifications; the description shows in the task panel (D, plugins-reference). Not a custom render.
- Hook `systemMessage` and output styles only print text into the transcript or change the model's prompt. Not persistent UI.

## Codex CLI

Sources: https://developers.openai.com/codex/config-reference (redirects to learn.chatgpt.com/docs/config-file/config-reference), source `codex-rs/tui/src/bottom_pane/status_line_setup.rs` at tag `rust-v0.170.0` (latest release on 2026-11-18).

- `tui.status_line`: "Ordered list of TUI footer status-line item identifiers" (D). The identifiers are the closed `enum StatusLineItem` (S, `status_line_setup.rs:57`): model name, reasoning, cwd, project root, git branch, run status, permissions, token counts, session id, thread name and similar. No custom-command or plugin item exists.
- `tui.terminal_title` is a list of the same kind (D).
- `notify` runs a command with a JSON payload on events (D). It is ignored in project config, and it cannot draw in the TUI.
- Hooks (`features.hooks`: PreToolUse, PostToolUse, SessionStart, SessionEnd, UserPromptSubmit, Stop) and plugins (marketplaces bundling MCP servers, skills and the like) have no UI-rendering API (D).
- **Closest surface:** the transcript. A tool or hook can print the task list as message output. Nothing persists above the input.

## Cursor

### IDE

Sources: https://cursor.com/docs/configuration/extensions, https://cursor.com/help/getting-started/migrate-vscode.md.

- Cursor installs third-party extensions from Open VSX through its proxy `marketplace.cursorapi.com` (D). The migration guide says not all VS Code extensions "may be listed or work exactly the same way" (D).
- So the VS Code API applies: a `TreeView` (`contributes.views`) or `WebviewView` in the sidebar can show a live task list, refreshed by `onDidChangeTreeData` or `postMessage`. Not Cursor-specific; behaviour in Cursor is per the VS Code API (U, not tested in Cursor).
- F: Cursor staff on the forum say Cursor bundles VS Code 1.105.1, so `engines.vscode` must not require newer (https://forum.cursor.com/t/cursor-marketplace-installs-offers-outdated-version-of-open-vsx-extension-despite-latest-version-being-available-upstream/159718/6).
- F: webviews in the bottom panel reportedly fail to render while the sidebar works (https://forum.cursor.com/t/webview-panels-and-commands-not-supported-in-cursor-breaks-extensions/115748).
- An extension cannot draw inside Cursor's own agent chat pane. **U:** no Cursor API for that was found.
- Install is separate from any agent plugin: the user installs the extension from the marketplace or a `.vsix`.

### cursor-agent CLI

Source: https://cursor.com/docs/cli/reference/configuration (fetched 2026-11-18).

- The config has no plugin, extension or custom status-line keys (D). Only `display.showStatusLineRunningTime`, `display.showStatusIndicators`, `hints`, `notifications` and similar toggles.
- **No custom UI.**

## opencode

Sources: https://opencode.ai/docs/build/plugins, https://opencode.ai/docs/build/plugins/cli (fetched 2026-11-18).

- A plugin exports a `./tui` entry built on `@opencode/plugin/tui` (D).
- `context.ui.slot({ append: "sidebar.content", render })` fills a named slot (D). Slots: `app`, `home.footer`, `home.footer.status`, `prompt.footer`, `prompt.footer.status`, `prompt.footer.file`, `session.composer.top`, `sidebar.content`, `sidebar.footer`, `session.panel`. Placement: `prepend`, `append`, `before`, `after`, `replace`.
- Live: renders are Solid components, and `context.data.on(...)` subscribes to events (D).
- `context.ui.toast.show({ title, message, variant, duration })`, dialogs and routes are also available (D).
- Installed by listing the plugin in `opencode.json` (TUI-only plugins in the CLI config) (D). An experimental `./gui-experimental` entry adds Desktop panels (D).

## Summary

| Agent | Closest surface | Live-updating? | Installable by plugin automatically? | Recommendation for an dibs task list |
|---|---|---|---|---|
| Pi (baseline) | `ctx.ui.setWidget(..., { placement: "aboveEditor" })` | Yes | Yes (extension) | Keep as is. |
| Claude Code | Mod band `AbovePrompt` (or a `Pane`) | Yes, `$.ui.invalidate('ui.render')` | Yes, ships in the plugin (v2.1.287+, API may change) | Ship a mod in the dibs plugin that draws the task list above the prompt. Fall back to a documented `statusLine` script the user opts into. |
| Codex CLI | Transcript output; fixed `tui.status_line` items | No | No | Print the list from the MCP tool result. Do not attempt a widget. |
| Cursor IDE | VS Code `TreeView` in the sidebar | Yes | No, separate extension install | Optional VS Code extension with a tree view if demand exists; otherwise rely on tool output. |
| cursor-agent CLI | Transcript output | No | No | Print the list from the MCP tool result. |
| opencode | TUI slot `session.composer.top` (or `sidebar.content`) | Yes, Solid + `context.data.on` | Yes, via `opencode.json` plugin entry | Ship a `./tui` plugin that renders the list in `session.composer.top`. |
