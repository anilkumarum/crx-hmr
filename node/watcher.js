import { platform } from "node:os";
import { watch, stat, access, constants } from "node:fs";
import { resolve } from "node:path";
import { readdir, lstat } from "node:fs/promises";
import { ReloadHandler } from "./reloader.js";
import { clr, pgClr } from "./util.js";
const isLinux = platform() === "linux";

export class ModuleWatcher {
	#watcherList = new Set();

	constructor(rootDir, res, moreDir) {
		this.rootDir = rootDir;
		this.res = res;
		this.init();
		this.reload = new ReloadHandler(rootDir, res);
		this.debounce = true;
		this.moreDirs = moreDir && moreDir.split[","];
		isLinux || (this.filePaths = new Map());
	}

	async init() {
		const _rootDir = this.rootDir.slice(1);
		this.#watchFile(_rootDir);
		isLinux ? this.#watchDirectories(_rootDir) : this.#createFileMaps(_rootDir);
		this.res.write(`data:hmr connected\n\n`);

		if (this.moreDirs)
			for (const dir of this.moreDirs)
				access(dir, constants.F_OK, (err) => {
					if (!err) this.#watchFile(dir), isLinux || this.#createFileMaps(dir);
				});
	}

	#watchFile(watchDir) {
		const watcher = watch(watchDir, { recursive: !isLinux }, (event, filename) => {
			if (event === "rename") return this.checkRenameFile(watchDir, filename);
			isLinux
				? this.filterChangeEvent(filename, watchDir)
				: this.filterChangeEvent(filename, this.filePaths.get(filename));
		});
		this.#watcherList.add(watcher);
	}

	async filterChangeEvent(filename, watchDir) {
		if (this.debounce) return (this.debounce = false);

		this.reload.updateChangedFile(filename, watchDir),
			console.log(
				`\x1b[${pgClr[this.rootDir]}m[${this.rootDir.slice(1)}]\x1b[0m`,
				`\x1b[32m hmr update\x1b[0m`,
				`\x1b[2m ${filename}\x1b[0m`
			);

		/* stat(filePath, (err, stats) => {
			stats.size !== 0 && this.refresh.updateChangedFile(filename, watchDir),
				console.log(`[${this.rootDir.slice(1)}]\x1b[32m page reload\x1b[30m "${filename}`);
		}); */
		setTimeout(() => (this.debounce = true), 1200);
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
	//For linux
	#watchDirectories = async (source) => {
		const dirents = await readdir(source, { withFileTypes: true });

		for (const dirent of dirents)
			if (dirent.isDirectory()) {
				const nestedDir = `${source}/${dirent.name}`;
				this.#watchFile(nestedDir);
				await this.#watchDirectories(nestedDir);
			}
	};

	//For windows/map
	async #createFileMaps(source) {
		const dirents = await readdir(source, { withFileTypes: true });
		for (const dirent of dirents)
			dirent.isDirectory()
				? this.#createFileMaps(`${source}/${dirent.name}`)
				: this.filePaths.set(dirent.name, source);
	}

	unwatchDir() {
		for (const watcher of this.#watcherList) watcher.close();
	}
}
