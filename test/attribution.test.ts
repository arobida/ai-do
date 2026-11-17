import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncAll } from "../src/core/adapters/sync-all.ts";
import { runFile } from "../src/core/tasks.ts";
import { parseTodo, todoLine } from "../src/core/todo.ts";

const cli = join(import.meta.dir, "../src/cli/index.ts");
const home = mkdtempSync(join(tmpdir(), "ai-do-attr-"));
const run = (cwd: string, env: Record<string, string>, ...args: string[]) => {
	const p = Bun.spawnSync(["bun", cli, ...args], { cwd, env: { ...process.env, AI_DO_HOME: home, AI_DO_SESSION: "attr", AI_DO_TRUST: "1", AI_DO_SCOPE: "project", ...env } });
	return p.stdout.toString();
};

test("created_by and human round trip through JSONL and todo.txt", async () => {
	const dir = mkdtempSync(join(tmpdir(), "ai-do-attr-")), file = `${dir}/t.jsonl`;
	try {
		await runFile(file, ["create", "a", "--created-by", "@bob", "--human", "bob"]);
		const [t] = JSON.parse(await runFile(file, ["list"]) as string);
		expect(t).toMatchObject({ created_by: "@bob", human: "bob" });
		expect(parseTodo(todoLine(t))).toMatchObject({ created_by: "@bob", human: "bob" });
		await runFile(file, ["edit", t.id, "--human", ""]);
		expect(JSON.parse(await runFile(file, ["list"]) as string)[0].human).toBeUndefined();
	} finally { rmSync(dir, { recursive: true, force: true }); }
});

test("CLI create records AI_DO_AGENT and AI_DO_USER; list --human filters", () => {
	const cwd = mkdtempSync(join(tmpdir(), "ai-do-attr-"));
	run(cwd, { AI_DO_AGENT: "codex", AI_DO_USER: "alice" }, "create", "mine");
	run(cwd, { AI_DO_USER: "alice" }, "create", "theirs", "--human", "bob");
	const all = JSON.parse(run(cwd, {}, "list", "--json"));
	expect(all.find((t: any) => t.name === "mine")).toMatchObject({ created_by: "codex", human: "alice" });
	const mine = run(cwd, { AI_DO_USER: "alice" }, "list", "--human", "me");
	expect(mine).toContain("mine @alice");
	expect(mine).not.toContain("theirs");
	expect(run(cwd, {}, "list", "--human", "bob")).toContain("theirs @bob");
});

test("sync with human filter leaves other tasks untouched", async () => {
	const dir = mkdtempSync(join(tmpdir(), "ai-do-attr-")), file = `${dir}/t.jsonl`, remote = new Map<string, any>(); let n = 0;
	const adapter = { name: "fake", list: async () => [...remote.values()], update: async () => {},
		create: async (t: any) => { const id = `r${n++}`; remote.set(id, { ...t, id }); return id; } };
	const s: any = { adapters: { fake: { sync: true, human: "alice" } }, base: dir };
	try {
		await runFile(file, ["create", "ours", "--human", "alice"]); await runFile(file, ["create", "theirs", "--human", "bob"]); await runFile(file, ["create", "nobody"]);
		const ctx: any = { cwd: dir, exec: async () => ({ stdout: "", stderr: "", code: 1 }) };
		expect((await syncAll(ctx, s, file, { fake: () => adapter }))[0].error).toBeUndefined();
		expect([...remote.values()].map((t) => t.name)).toEqual(["ours"]);
		remote.clear(); // remote loses everything; filtered-out local tasks must survive further syncs
		await syncAll(ctx, s, file, { fake: () => adapter });
		const names = JSON.parse(await runFile(file, ["list"]) as string).map((t: any) => t.name).sort();
		expect(names).toEqual(["nobody", "ours", "theirs"]);
		expect([...remote.values()].map((t) => t.name)).toEqual([]);
	} finally { rmSync(dir, { recursive: true, force: true }); }
});
