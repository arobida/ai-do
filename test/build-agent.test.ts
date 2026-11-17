import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "../scripts/build-agent.ts";

test("agent files override shared; unknown agent throws", () => {
	const r = mkdtempSync(join(tmpdir(), "ba-"));
	for (const d of ["shared", "x"]) mkdirSync(join(r, "agents", d), { recursive: true });
	writeFileSync(join(r, "agents/shared/a.md"), "sa");
	writeFileSync(join(r, "agents/shared/b.md"), "sb");
	writeFileSync(join(r, "agents/x/b.md"), "xb");
	build("x", r);
	expect(readFileSync(join(r, "dist/x/a.md"), "utf8")).toBe("sa");
	expect(readFileSync(join(r, "dist/x/b.md"), "utf8")).toBe("xb");
	expect(() => build("nope", r)).toThrow();
	expect(() => build("shared", r)).toThrow();
});
