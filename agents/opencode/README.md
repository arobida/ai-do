# ai-do for opencode

opencode loads skills from `skills/<id>/SKILL.md`. The shared `ai-do` skill works unchanged (no override needed).
The skill shells out to the CLI, so `ai-do` must be on your PATH.

## Install

```sh
bun run build:agent opencode        # writes dist/opencode/skills/ai-do/SKILL.md

# project-local
mkdir -p .opencode/skills && cp -R dist/opencode/skills/ai-do .opencode/skills/

# or global
mkdir -p ~/.config/opencode/skills && cp -R dist/opencode/skills/ai-do ~/.config/opencode/skills/
```

Use `ln -s "$PWD/dist/opencode/skills/ai-do" <target>/ai-do` instead of `cp -R` to follow rebuilds.

Check: start opencode in the project and ask it to load the `ai-do` skill, or type `@ai-do`. (`opencode debug skill` does not exist in v2.3.0.)

Docs: https://opencode.ai/docs/skills/ (also scans `.claude/skills` and `.agents/skills`).
