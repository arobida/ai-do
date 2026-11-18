// Publish each package to npm and JSR in order, skipping versions already live. Each publish may open a browser approval.
import { $ } from "bun";

const dirs = [".", "agents/pi", "agents/opencode"];

for (const dir of dirs) {
	const { name, version } = await Bun.file(`${dir}/package.json`).json();
	const live = (await $`npm view ${name}@${version} version --prefer-online`.quiet().nothrow()).stdout.toString().trim();
	if (live === version) console.log(`npm ${name}@${version}: already published, skipping`);
	else await $`bun publish --access public`.cwd(dir).nothrow(); // exits 1 even after a browser-approved publish
}

// Only core goes to JSR: Pi and opencode install plugins from npm, and JSR can't resolve their host-provided imports.
for (const dir of ["."]) {
	const { name, version } = await Bun.file(`${dir}/jsr.json`).json();
	const meta = await fetch(`https://jsr.io/${name}/meta.json`);
	const versions = meta.ok ? (await meta.json()).versions ?? {} : {};
	if (version in versions) console.log(`jsr ${name}@${version}: already published, skipping`);
	else await $`bunx jsr publish --allow-slow-types`.cwd(dir).nothrow();
}
