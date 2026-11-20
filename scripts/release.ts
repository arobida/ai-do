// Publish each package to npm and JSR in order, skipping versions already live. Each publish may open a browser approval.
import $ from "dax";
import { readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const dirs = [".", "agents/pi", "agents/opencode"];
// An expired npm token makes publish fail with a misleading 404, so check the login first.
if ((await $`npm whoami`.quiet().noThrow()).code) throw new Error("not logged in to npm: run `npm login`");
const npmLive = async (name: string, version: string, tries = 1) => {
	for (let i = 0; i < tries; i++) {
		if (i) await sleep(3000); // the registry can lag a few seconds behind a publish
		if ((await $`npm view ${name}@${version} version --prefer-online`.quiet().noThrow()).stdout.trim() === version) return true;
	}
	return false;
};
const jsrLive = async (name: string, version: string) => {
	const meta = await fetch(`https://jsr.io/${name}/meta.json`, { headers: { "cache-control": "no-cache" } });
	return version in (meta.ok ? (await meta.json()).versions ?? {} : {});
};

for (const dir of dirs) {
	const { name, version } = JSON.parse(await readFile(`${dir}/package.json`, "utf8"));
	if (await npmLive(name, version)) { console.log(`npm ${name}@${version}: already published, skipping`); continue; }
	await $`nub publish --access public`.cwd(dir).noThrow(); // exits 1 even after a browser-approved publish, so check the registry instead
	if (!(await npmLive(name, version, 5))) throw new Error(`npm ${name}@${version} did not publish`);
}

// Only core goes to JSR: Pi and opencode install plugins from npm, and JSR can't resolve their host-provided imports.
for (const dir of ["."]) {
	const { name, version } = JSON.parse(await readFile(`${dir}/jsr.json`, "utf8"));
	if (await jsrLive(name, version)) { console.log(`jsr ${name}@${version}: already published, skipping`); continue; }
	await $`nubx jsr publish --allow-slow-types`.cwd(dir);
}
