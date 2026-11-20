import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { checkName } from "../core/todo.ts";
import { link, resolveLink, settings, storeFile, version } from "../core/store.ts";
import { agentName, ghUser } from "../core/identity.ts";
import { runFile } from "../core/tasks.ts";
import { syncAll } from "../core/adapters/sync-all.ts";
import type { Ctx } from "../core/ctx.ts";

export async function serveMcp(ctx: Ctx) {
const claim = () => `${ctx.sessionId()}:${process.pid}`;

// Sync failures go to stderr only; stdout is the protocol.
async function sync() {
	try {
		const s = settings(ctx);
		for (const r of await syncAll(ctx, s, storeFile(ctx, s))) if (r.error) console.error(`${r.name}: sync failed: ${(r.error as Error).message ?? r.error}`);
	} catch (e) { console.error(`sync failed: ${e}`); }
}

async function act(action: string, p: Record<string, any>): Promise<string> {
	for (const k of Object.keys(p)) if (p[k] === "" || p[k] === null) delete p[k];
	const { id, name, description, parent, result, url, force, query } = p;
	const human = p.human === "me" ? await ghUser(ctx) ?? "" : p.human;
	const blocked_by = Array.isArray(p.blocked_by) ? p.blocked_by.join(",") : p.blocked_by;
	if (action === "link") return link(ctx, id);
	if (action === "resolve") return resolveLink(url);
	if (action === "edit" && name === undefined && description === undefined && blocked_by === undefined && human === undefined) throw new Error("todo_edit needs at least one of name, description, blocked_by, human");
	if (name !== undefined) checkName(name);
	let args: string[];
	if (action === "list") args = [...(p.ready ? ["ready"] : ["list", ...(query?.trim() ? ["--query", query] : [])]), ...(human ? ["--human", human] : [])];
	else if (action === "create") args = ["create", name, ...(description !== undefined ? ["--description", description] : []), ...(parent ? ["--parent", parent] : []), ...(blocked_by !== undefined ? ["--blocked-by", blocked_by] : []), "--created-by", agentName(), "--human", await ghUser(ctx) ?? ""];
	else if (action === "edit") args = ["edit", id, ...(name !== undefined ? ["--name", name] : []), ...(description !== undefined ? ["--description", description] : []), ...(blocked_by !== undefined ? ["--blocked-by", blocked_by] : []), ...(human !== undefined ? ["--human", human] : [])];
	else if (p.status === "completed") args = ["complete", id, "--result", result || "Completed", "--claim", claim(), "--no-commit"];
	else if (result !== undefined) throw new Error("result is only for status completed");
	else args = ["start", id, "--claim", claim()];
	if (force && action === "status") args.push("--force");
	if (action === "list") await sync();
	const out = await runFile(storeFile(ctx, settings(ctx)), args);
	if (action !== "list") await sync();
	return out;
}

const Id = z.string().describe("Task id, or any unique prefix (e.g. a1b2c3 for proj-a1b2c3)");
const server = new McpServer({ name: "dibs", version });
const tool = (name: string, description: string, inputSchema: z.ZodRawShape) => server.registerTool(name, { description, inputSchema }, async (params: any) => {
	try { return { content: [{ type: "text" as const, text: await act(name.slice(5), { ...params }) }] }; }
	catch (e: any) { return { content: [{ type: "text" as const, text: e.message ?? String(e) }], isError: true }; }
});
tool("todo_list", "List tasks as a JSON array. ready: true lists only open, unclaimed, unblocked tasks. Ids are short and project-prefixed (e.g. proj-a1b2c3).", {
	query: z.string().optional().describe("Case-insensitive text to match in task name or description"),
	ready: z.boolean().optional().describe("Only tasks ready to work on"),
	human: z.string().optional().describe("Only tasks for this GitHub user; \"me\" for the current user"),
});
tool("todo_create", "Create a task. Returns its id.", {
	name: z.string().describe("Task name, one line"),
	description: z.string().describe("Task details; \"\" if none"),
	parent: z.string().optional().describe("Id of an existing task to nest under"),
	blocked_by: z.array(z.string()).optional().describe("Ids (or unique prefixes) of tasks that must complete first"),
});
tool("todo_edit", "Change a task. Give only the fields to change; at least one is required.", {
	id: Id,
	name: z.string().optional().describe("New task name"),
	description: z.string().optional().describe("New task details"),
	human: z.string().optional().describe("GitHub user in the loop; \"me\" for the current user; \"\" clears it"),
	blocked_by: z.array(z.string()).optional().describe("Replaces the blocker list; [] clears it"),
});
tool("todo_status", "Start or complete a task. Starting claims it for this session.", {
	id: Id,
	status: z.enum(["started", "completed"]),
	result: z.string().optional().describe("Only with completed: what was done (default: Completed)"),
	force: z.boolean().optional().describe("Override another live session's claim"),
});
tool("todo_link", "Get a Markdown dibs:// link to a task, for use in notes or other projects.", { id: Id });
tool("todo_resolve", "Read the task behind a dibs:// link, from any project.", { url: z.string().describe("A dibs://<project-id>/<task-id> link") });

await server.connect(new StdioServerTransport());
}
