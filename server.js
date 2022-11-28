import { createServer } from "node:http";
import { ModuleWatcher } from "./watcher.js";
import { clr } from "./util.js";

async function connectClient(request, res) {
	const rootDir = request.url;
	const pageName = rootDir.slice(1);
	console.info(`\x1b[${clr[rootDir]}m%s\x1b[0m`, pageName + " page connected ");
	console.info("\x1b[36m%s\x1b[0m", "waiting for file change for " + pageName);

	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET,OPTIONS",
		"Access-Control-Allow-Private-Network": "true",
		"Access-Control-Allow-Headers": "Cache-Control",
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	});

	res.on("close", () => {
		watcher.unwatchDir();
		console.info("\x1b[41m%s\x1b[0m", `⚠️ ${pageName} page disconnected `);
	});

	const watcher = new ModuleWatcher(rootDir, res);
}
const created = () => console.info("\x1b[32m%s\x1b[0m", `HMR ready at ${4500} port. Waiting for client`);
const server = createServer().listen(process.env.PORT || 4500, created);
server.on("request", connectClient);
