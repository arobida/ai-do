// Publish each package to npm and JSR in order, skipping versions already live. Each publish may open a browser approval.
import $ from "dax";
import { readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const dirs = [".", "agents/pi", "agents/opencode"];
// An expired npm token makes publish fail with a misleading 404, so check the login first.
if ((await $`nub whoami`.quiet().noThrow()).code) throw new Error("not logged in to npm: run `nub login`");
// A package that requires 2FA stages a token-only publish instead of releasing it, so pass the code: NPM_OTP=123456 nub run release
const otp = process.env.NPM_OTP ? ["--otp", process.env.NPM_OTP] : [];
// JSR has no stored login: pass JSR_TOKEN, or --jsr to read it from the macOS Keychain (security add-generic-password -U -a "$USER" -s jsr-token -w)
const jsrToken = process.env.JSR_TOKEN ?? (process.argv.includes("--jsr") ? (await $`security find-generic-password -s jsr-token -w`.text()).trim() : "");
const npmLive = async (name: string, version: string, tries = 1) => {
	for (let i = 0; i < tries; i++) {
		if (i) await sleep(3000); // a token publish is staged and goes live after about two minutes
		// ask the registry directly: nub view serves cached metadata and misses a fresh publish for minutes
		const meta = await fetch(`https://registry.npmjs.org/${name.replace("/", "%2F")}`, { headers: { "cache-control": "no-cache" } });
		if (meta.ok && version in ((await meta.json()).versions ?? {})) return true;
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
	await $`nub publish --access public ${otp}`.cwd(dir).noThrow(); // trust the registry, not the exit code
	console.log(`waiting for npm to release ${name}@${version}…`);
	if (!(await npmLive(name, version, 60))) throw new Error(`npm ${name}@${version} did not publish; if 2FA is required, rerun with NPM_OTP=<code> nub run release`);
}

// Only core goes to JSR: Pi and opencode install plugins from npm, and JSR can't resolve their host-provided imports.
for (const dir of ["."]) {
	const { name, version } = JSON.parse(await readFile(`${dir}/jsr.json`, "utf8"));
	if (await jsrLive(name, version)) { console.log(`jsr ${name}@${version}: already published, skipping`); continue; }
	await $`nub dlx jsr publish ${jsrToken ? ["--token", jsrToken] : []}`.cwd(dir);
}
