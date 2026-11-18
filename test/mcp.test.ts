import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("mcp server exposes the six task tools", async () => {
	const dir = mkdtempSync(join(tmpdir(), "ai-do-mcp-"));
	const client = new Client({ name: "test", version: "0" });
	await client.connect(new StdioClientTransport({
		command: "bun", args: [join(import.meta.dir, "../src/cli/index.ts"), "mcp"], cwd: dir,
		env: { ...process.env as Record<string, string>, AI_DO_HOME: dir, AI_DO_TRUST: "1", AI_DO_SCOPE: "project", AI_DO_SESSION: "mcp-test" },
	}));
	try {
		const text = (r: any) => r.content[0].text as string;
		expect((await client.listTools()).tools.map((t) => t.name).sort()).toEqual(["todo_create", "todo_edit", "todo_link", "todo_list", "todo_resolve", "todo_status"]);
		const created = text(await client.callTool({ name: "todo_create", arguments: { name: "mcp thing", description: "" } }));
		const id = /Created task (\S+)/.exec(created)![1];
		expect(text(await client.callTool({ name: "todo_list", arguments: {} }))).toContain("mcp thing");
		expect((await client.callTool({ name: "todo_status", arguments: { id, status: "completed" } })).isError).toBeFalsy();
		expect((await client.callTool({ name: "todo_edit", arguments: { id } })).isError).toBe(true);
	} finally { await client.close(); rmSync(dir, { recursive: true, force: true }); }
}, 30000);
