#! /usr/bin/env node

const { cp } = await import("node:fs/promises");
try {
	await cp(new URL("../blank-crx-hmr", import.meta.url), process.env.PWD, { recursive: true });
	console.log("Scaffolding project in current folder");
	console.log("Done. Now run:");
	console.log("    npm install");
	console.log("\x1b[32m%s\x1b[0m", "    npm start");
} catch (error) {
	console.error(error);
}
