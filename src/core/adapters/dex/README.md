# Dex adapter

Syncs ai-do's todo store with [Dex](https://github.com/dcramer/dex) through the `dex` CLI.

## Connect

1. Install `dex` and make sure it is on `PATH` (`dex --version`).
2. Optional: run `dex init` (global `~/.config/dex/dex.toml`) or add a project `.dex/config.toml` to choose where Dex stores tasks. Without either, ai-do uses temporary per-session Dex storage.
3. Turn sync on in a ai-do `config.json` (global `~/.ai-do/config.json` or the project's):
   ```json
   {"adapters": {"dex": {"sync": true}}}
   ```
4. Run `/reload` in Pi. Existing Dex tasks are pulled into ai-do on the first sync, and ai-do tasks are pushed to Dex.

To disconnect, set `"sync": false` or remove the entry. Tasks already synced stay on both sides.

## Capabilities

| Field | ai-do → Dex | Dex → ai-do |
|---|---|---|
| Create task | yes | yes |
| Name (todo.txt priority, `+project`, `@context` as text) | yes | yes |
| Description | yes | yes |
| Parent (subtasks) | yes | yes |
| Started | yes | yes |
| Completed + result | yes | yes |

- Two-way: each list or change in ai-do syncs both ways. Changes made in Dex by other agents are pulled when Dex's storage folder changes (file storage engine only), and before each prompt.
- Conflicts: per field, a change on one side since the last sync is copied across. If both sides changed the same field, ai-do wins.
- State: links and last-synced copies live in `sync/dex.jsonl` next to the store's `config.json`.
- Completing in Dex uses `--no-commit --force`.

## Limitations

- Deletions are never propagated in either direction.
- Dex cannot un-complete or un-start a task, or change a completed task's result; those changes stay in ai-do only.
- Clearing a description in ai-do does not clear it in Dex.
- Not synced: Dex's numeric priority, blockers (`blockedBy`/`blocks`), linked commits, metadata, archived tasks, and GitHub/Shortcut sync.
- Dex storage outside the file engine (no local folder) is only re-synced on ai-do actions and before each prompt, not live.
- Sync failures show as a notice and do not block the local change; it retries on the next sync.
