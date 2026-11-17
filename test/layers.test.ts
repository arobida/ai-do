import { expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ts = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? ts(p) : p.endsWith(".ts") ? [p] : []; });
const imports = (f: string) => [...readFileSync(f, "utf8").matchAll(/(?:from|import\()\s*["']([^"']+)["']/g)].map((m) => m[1]);

test("src/core imports no host, agent or CLI code", () => {
	for (const f of ts("src/core")) for (const i of imports(f)) expect([f, /@earendil-works|^typebox|agents|src\/cli|\/cli\//.test(i)]).toEqual([f, false]);
});

test("agents never import another agent", () => {
	for (const a of readdirSync("agents").filter((n) => n !== "shared" && statSync(join("agents", n)).isDirectory()))
		for (const f of ts(join("agents", a))) for (const i of imports(f)) {
			const other = /agents\/([^/]+)/.exec(i)?.[1];
			expect([f, !other || other === a || other === "shared"]).toEqual([f, true]);
		}
});
