// Publish each package to npm and JSR in order, skipping versions already live. Each publish may open a browser approval.
import { $ } from "bun";

const dirs = [".", "agents/pi", "agents/opencode"];
// An expired npm token makes publish fail with a misleading 404, so check the login first.
if ((await $`npm whoami`.quiet().nothrow()).exitCode) throw new Error("not logged in to npm: run `npm login`");
const npmLive = async (name: string, version: string, tries = 1) => {
	for (let i = 0; i < tries; i++) {
		if (i) await Bun.sleep(3000); // the registry can lag a few seconds behind a publish
		if ((await $`npm view ${name}@${version} version --prefer-online`.quiet().nothrow()).stdout.toString().trim() === version) return true;
	}
	return false;
};
const jsrLive = async (name: string, version: string) => {
	const meta = await fetch(`https://jsr.io/${name}/meta.json`, { headers: { "cache-control": "no-cache" } });
	return version in (meta.ok ? (await meta.json()).versions ?? {} : {});
};

for (const dir of dirs) {
	const { name, version } = await Bun.file(`${dir}/package.json`).json();
	if (await npmLive(name, version)) { console.log(`npm ${name}@${version}: already published, skipping`); continue; }
	await $`bun publish --access public`.cwd(dir).nothrow(); // exits 1 even after a browser-approved publish, so check the registry instead
	if (!(await npmLive(name, version, 5))) throw new Error(`npm ${name}@${version} did not publish`);
}

// Only core goes to JSR: Pi and opencode install plugins from npm, and JSR can't resolve their host-provided imports.
for (const dir of ["."]) {
	const { name, version } = await Bun.file(`${dir}/jsr.json`).json();
	if (await jsrLive(name, version)) { console.log(`jsr ${name}@${version}: already published, skipping`); continue; }
	await $`bunx jsr publish --allow-slow-types`.cwd(dir);
}
