#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { checkName } from "../core/todo.ts";
import { home } from "../core/util.ts";
import { link, migrate, resolveLink, setScope, settings, storeFile } from "../core/store.ts";
import { runFile } from "../core/tasks.ts";
import { syncAll } from "../core/adapters/sync-all.ts";
import type { Ctx } from "../core/ctx.ts";

const usage = `usage: ai-do [--global] [--json] <command>
  list [--query q] | ready
  create <name> [--description d] [--parent id] [--blocked-by a,b]
  start <id> | complete <id> [--result r]
  edit <id> [--name n] [--description d] [--blocked-by a,b]
  import <file> | export [file]
  sync                      sync enabled adapters (dex, things)
  link <id> | resolve <url>
  scope project|global | migrate .ai-do|.agents/ai-do
env: AI_DO_TRUST=1 trusts cwd; AI_DO_SESSION overrides the session id`;

const cwd = process.cwd();
const ctx: Ctx = {
	cwd,
	trusted: () => process.env.AI_DO_TRUST === "1" || existsSync(`${cwd}/.ai-do`) || existsSync(`${cwd}/.agents/ai-do`),
	sessionId: () => process.env.AI_DO_SESSION ?? String(process.ppid),
	exec: async (cmd, args, opts) => {
		const p = Bun.spawn([cmd, ...args], { cwd: opts?.cwd ?? cwd, stdout: "pipe", stderr: "pipe", signal: opts?.signal });
		const [stdout, stderr, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
		return { stdout, stderr, code };
	},
};

try {
	const { values: v, positionals: [cmd, arg] } = parseArgs({
		allowPositionals: true,
		options: { global: { type: "boolean" }, json: { type: "boolean" }, help: { type: "boolean" }, query: { type: "string" }, description: { type: "string" }, parent: { type: "string" }, "blocked-by": { type: "string" }, name: { type: "string" }, result: { type: "string" } },
	});
	if (v.help || !cmd) { console.log(usage); process.exit(0); }
	const need = () => arg ?? (() => { throw new Error(`${cmd} needs an argument`); })();
	const out = (s: string) => console.log(s);
	if (cmd === "link") out(link(ctx, need()));
	else if (cmd === "resolve") out(resolveLink(need()));
	else if (cmd === "scope") out(setScope(ctx, need()));
	else if (cmd === "migrate") out(migrate(ctx, need()));
	else if (cmd === "sync") {
		const s = settings(ctx, v.global), res = await syncAll(ctx, s, storeFile(ctx, s));
		for (const r of res) (r.error ? console.error : out)(r.error ? `${r.name}: sync failed: ${(r.error as Error).message ?? r.error}` : `${r.name}: synced`);
		if (!res.length) out("no adapters enabled");
		if (res.some((r) => r.error)) process.exit(1);
	}
	else {
		const opt = (k: string, flag = k) => v[k as "name"] === undefined ? [] : [`--${flag}`, v[k as "name"]!];
		let args: string[];
		if (cmd === "list") args = ["list", ...opt("query")];
		else if (cmd === "ready") args = ["ready"];
		else if (cmd === "create") { checkName(need()); args = ["create", arg, ...opt("description"), ...opt("parent"), ...opt("blocked-by")]; }
		else if (cmd === "edit") {
			if (!v.name && v.description === undefined && v["blocked-by"] === undefined) throw new Error("edit needs --name, --description or --blocked-by");
			args = ["edit", need(), ...opt("name"), ...opt("description"), ...opt("blocked-by")];
		}
		else if (cmd === "start") args = ["start", need(), "--claim", `${ctx.sessionId()}:${process.pid}`];
		else if (cmd === "complete") args = ["complete", need(), "--result", v.result || "Completed", "--no-commit"];
		else if (cmd === "import") args = ["import", readFileSync(resolve(cwd, home(need())), "utf8")];
		else if (cmd === "export") args = ["export"];
		else throw new Error(`Unknown command: ${cmd}\n${usage}`);
		const raw = await runFile(storeFile(ctx, settings(ctx, v.global)), args);
		if (cmd === "export") {
			const { text, skipped } = JSON.parse(raw);
			if (arg) writeFileSync(resolve(cwd, home(arg)), text, { flag: "wx" }); // wx: never overwrite
			else process.stdout.write(text);
			if (skipped.length) console.error(`Not exported (todo.txt would misread these names):\n${skipped.join("\n")}`);
		} else if (cmd === "list" || cmd === "ready") {
			out(v.json ? raw : JSON.parse(raw).map((t: any) => `[${t.completed ? "x" : t.started_at ? "~" : " "}] ${t.id} ${t.name}`).join("\n"));
		} else out(raw);
	}
} catch (e: any) {
	console.error(e.message ?? String(e));
	process.exit(1);
}
