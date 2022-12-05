// index.js
import { createServer } from "node:http";

// watcher.js
import { platform } from "node:os";
import { watch, stat } from "node:fs";
import { readdir, lstat } from "node:fs/promises";

// reloader.js
import { resolve } from "node:path";
import { exec } from "node:child_process";
var ReloadHandler = class {
	constructor(rootDir, res) {
		this.rootDir = rootDir;
		this.res = res;
		this.processFileType = /* @__PURE__ */ new Set(["scss", "pug"]);
	}
	#passToClient(payload) {
		this.res.write(`data:${payload}

`);
		payload.endsWith("reload") && console.log(payload);
	}
	updateChangedFile(filename, watchDir) {
		const fileType = filename.split(".").pop();
		if (fileType === "html") return this.#passToClient("tab-reload");
		if (this.rootDir === "/background") return this.#passToClient("crx-reload");
		if (filename === "content.js") return this.#passToClient("crx&tab-reload");
		this.processFileType.has(fileType) && this.#processFile(fileType, watchDir, filename);
		if (watchDir) this.#passToClient(`/${watchDir}/${filename}`);
		else this.#passToClient(resolve(this.rootDir, filename));
	}
	#processFile(fileType, watchDir, filename) {
		switch (fileType) {
			case "scss":
				this.#processCss(watchDir, filename);
				break;
			case "pug":
				this.#processHTML(watchDir, filename);
				break;
		}
	}
	#processCss(watchDir, filename) {
		const scssCompile = `sass ./${watchDir}/${filename} style/${
			filename.split(".")[0]
		}.css --style=compressed --no-source-map`;
		console.log(scssCompile);
		exec(scssCompile, (_, stdout, stdErr) => console.error(stdErr));
	}
	#processHTML(watchDir, filename) {
		exec(`pug -w ./${watchDir}/index.pug`, (_, stdout, stdErr) => console.error(stdErr));
	}
};

// watcher.js
var isLinux = platform() === "linux";
var ModuleWatcher = class {
	#watcherList = /* @__PURE__ */ new Set();
	constructor(rootDir, res) {
		this.rootDir = rootDir;
		this.res = res;
		this.init();
		this.reload = new ReloadHandler(rootDir, res);
		this.debounce = true;
	}
	async init() {
		this.#watchFile(this.rootDir.slice(1));
		isLinux && this.#getDirectories(this.rootDir.slice(1));
		this.res.write(`data:\u26A1 hmr connected

`);
		this.#watchFile("style");
	}
	#watchFile(watchDir) {
		const watcher = watch(watchDir, { recursive: !isLinux }, (event, filename) => {
			if (event === "rename") return this.checkRenameFile(watchDir, filename);
			isLinux ? this.filterChangeEvent(filename, watchDir) : this.filterChangeEvent(filename);
		});
		this.#watcherList.add(watcher);
	}
	async filterChangeEvent(filename, watchDir) {
		if (this.debounce) return (this.debounce = false);
		this.reload.updateChangedFile(filename, watchDir),
			console.log(`[${this.rootDir.slice(1)}]\x1B[32m page reload\x1B[37m ${filename}`);
		setTimeout(() => (this.debounce = true), 1e3);
	}
	async checkRenameFile(watchDir, filename) {
		if (isLinux) {
			try {
				const stats = await lstat(watchDir + "/" + filename);
				stats.isDirectory() && this.#watchFile(watchDir + "/" + filename);
			} catch (error) {
				console.log(error);
			}
		}
	}
	getFullPath(filename) {
		return filename;
	}
	#getDirectories = async (source) => {
		const dirents = await readdir(source, { withFileTypes: true });
		for (const dirent of dirents)
			if (dirent.isDirectory()) {
				const nestedDir = `${source}/${dirent.name}`;
				this.#watchFile(nestedDir);
				await this.#getDirectories(nestedDir);
			}
	};
	unwatchDir() {
		for (const watcher of this.#watcherList) watcher.close();
	}
};

// util.js
var clr = {
	"/background": "42",
	"/scripts": "43",
	"/options": "46",
	"/popup": "33",
	"/contents": "44",
};

// index.js
async function connectClient(request, res) {
	const rootDir = request.url;
	const pageName = rootDir.slice(1);
	console.info(`\x1B[${clr[rootDir]}m%s\x1B[0m`, pageName + " page connected ");
	console.info("\x1B[36m%s\x1B[0m", "waiting for file change for " + pageName);
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
		console.info("\x1B[41m%s\x1B[0m", `\u26A0\uFE0F ${pageName} page disconnected `);
	});
	const watcher = new ModuleWatcher(rootDir, res);
}
var created = () => console.info("\x1B[32m%s\x1B[0m", `HMR ready at ${4500} port. Waiting for client`);
var server = createServer().listen(process.env.PORT || 4500, created);
server.on("request", connectClient);
