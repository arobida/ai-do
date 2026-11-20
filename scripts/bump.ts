// Usage: nub run bump <patch|minor|major|x.y.z> [. | agents/pi | agents/opencode]
import $ from "dax";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const [inc, dir = "."] = process.argv.slice(2);
if (!inc) throw new Error("usage: nub run bump <patch|minor|major|x.y.z> [dir]");
if ((await $`git status --porcelain`.text()).trim()) throw new Error("commit or stash your changes first");

await $`nub run test`;
await $`nub version ${inc} --no-git-tag-version`.cwd(dir);
const { name, version } = JSON.parse(await readFile(`${dir}/package.json`, "utf8"));
const files = [`${dir}/package.json`];
const jsr = `${dir}/jsr.json`;
if (existsSync(jsr)) {
	await writeFile(jsr, JSON.stringify({ ...JSON.parse(await readFile(jsr, "utf8")), version }, null, 2) + "\n");
	files.push(`${dir}/jsr.json`);
}
// Fixed message: a release must not depend on an LLM call succeeding.
await $`git add ${files}`;
await $`git commit -m ${`Release ${name}@${version}`} -- ${files}`;
await $`git tag -a ${name}@${version} -m ${name}@${version}`;
await $`git push --follow-tags`;
await $`nub scripts/release.ts`;
