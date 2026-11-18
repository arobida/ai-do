import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Ctx } from "./ctx.ts";
import { aiDoHome } from "./store.ts";

export const agentName = () => process.env.AI_DO_AGENT || "cli";

// GitHub username of the person at the keyboard: AI_DO_USER, else git config, else gh; cached in <aiDoHome>/user so the lookup runs at most once. Never throws.
export async function ghUser(ctx: Ctx): Promise<string | undefined> {
	if (process.env.AI_DO_USER) return process.env.AI_DO_USER;
	const cache = join(aiDoHome(), "user");
	try { const cached = readFileSync(cache, "utf8").trim(); if (cached) return cached; } catch {}
	for (const [cmd, args] of [["git", ["config", "github.user"]], ["gh", ["api", "user", "--jq", ".login"]]] as const) {
		try {
			const r = await ctx.exec(cmd, [...args]), user = r.stdout.trim();
			if (r.code === 0 && user) { try { mkdirSync(aiDoHome(), { recursive: true }); writeFileSync(cache, user + "\n"); } catch {} return user; }
		} catch {}
	}
}
