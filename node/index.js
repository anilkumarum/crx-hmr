import { createServer } from "node:http";
import { ModuleWatcher } from "./watcher.js";
import { bgclr, clr, _pgClr } from "./util.js";

async function connectClient(request, res) {
	const [rootDir, searchParams] = request.url.split("?");
	const pageName = rootDir.slice(1);
	console.info(`\x1b[${_pgClr[rootDir]}m%s\x1b[0m`, pageName + " page connected ");
	// waiting("waiting for file change for "+pageName)
	console.info(clr["cyan"], "waiting for file change for " + pageName);

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
		console.info(bgclr["red"], `⚠️ ${pageName} page disconnected `);
	});

	const watcher = new ModuleWatcher(rootDir, res, searchParams?.match(/mdir=(.*)&/)?.[1]);
}
const created = () => console.info(clr["green"], `HMR ready at ${4500} port. Waiting for client`);

export default async function start() {
	const server = createServer().listen(process.env.PORT || 4500, created);
	server.on("request", connectClient);
}
