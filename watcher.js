import { platform } from "node:os";
import { watch, stat } from "node:fs";
import { resolve } from "node:path";
import { readdir, lstat } from "node:fs/promises";
import { ReloadHandler } from "./reloader.js";
const isLinux = platform() === "linux";

export class ModuleWatcher {
	#watcherList = new Set();

	constructor(rootDir, res) {
		this.rootDir = rootDir;
		this.res = res;
		this.init();
		this.refresh = new ReloadHandler(rootDir, res);
	}

	async init() {
		this.#watchFile(this.rootDir.slice(1));
		isLinux && this.#getDirectories(this.rootDir.slice(1));
		this.res.write(`data:⚡ hmr connected\n\n`);
	}

	#watchFile(watchDir) {
		const watcher = watch(watchDir, { recursive: !isLinux }, (event, filename) => {
			if (event === "rename") return this.checkRenameFile(watchDir, filename);
			isLinux ? this.filterChangeEvent(filename, watchDir) : this.filterChangeEvent(filename);
		});
		this.#watcherList.add(watcher);
	}

	async filterChangeEvent(filename, watchDir) {
		const filePath = isLinux ? watchDir + "/" + filename : this.getFullPath(filename);
		stat(filePath, (err, stats) => {
			stats.size !== 0 && this.refresh.updateChangedFile(filename, watchDir),
				console.log(`[${this.rootDir.slice(1)}]\x1b[32m page reload\x1b[30m "${filename}`);
		});
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
		//TODO for windows/macos
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
}
