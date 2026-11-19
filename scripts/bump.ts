// Usage: bun run bump <patch|minor|major|x.y.z> [. | agents/pi | agents/opencode]
import { $ } from "bun";

const [inc, dir = "."] = process.argv.slice(2);
if (!inc) throw new Error("usage: bun run bump <patch|minor|major|x.y.z> [dir]");
if ((await $`git status --porcelain`.text()).trim()) throw new Error("commit or stash your changes first");

await $`bun test`;
await $`bun pm version ${inc} --no-git-tag-version`.cwd(dir);
const { name, version } = await Bun.file(`${dir}/package.json`).json();
const files = [`${dir}/package.json`];
const jsr = Bun.file(`${dir}/jsr.json`);
if (await jsr.exists()) {
	await Bun.write(jsr, JSON.stringify({ ...(await jsr.json()), version }, null, 2) + "\n");
	files.push(`${dir}/jsr.json`);
}
// Stage only the version files so wt's generated message covers just the bump.
await $`git add ${files}`;
await $`wt step commit --stage none`;
await $`git tag -a ${name}@${version} -m ${name}@${version}`;
await $`git push --follow-tags`;
await $`bun scripts/release.ts`;
