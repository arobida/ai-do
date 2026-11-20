import { cpSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

export function build(name: string, root = resolve(import.meta.dirname, "..")) {
	if (name === "shared" || !existsSync(join(root, "agents", name))) throw new Error(`unknown agent: ${name}`);
	const out = join(root, "dist", name);
	rmSync(out, { recursive: true, force: true });
	cpSync(join(root, "agents/shared"), out, { recursive: true });
	cpSync(join(root, "agents", name), out, { recursive: true }); // agent wins on same path
}

if (import.meta.main) try { build(process.argv[2] ?? ""); } catch (e) { console.error((e as Error).message); process.exit(1); }
