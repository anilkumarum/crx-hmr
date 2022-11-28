import { resolve } from "node:path";
import { exec } from "node:child_process";

export class ReloadHandler {
	constructor(rootDir, res) {
		this.rootDir = rootDir;
		this.res = res;
		this.processFileType = new Set(["scss", "pug"]);
	}

	#passToClient(payload) {
		this.res.write(`data:${payload}\n\n`);
		payload.endsWith("reload") && console.log(payload);
	}

	updateChangedFile(filename, watchDir) {
		const fileType = filename.split(".").pop();
		//reload if file is html
		if (fileType === "html") return this.#passToClient("tab-reload");
		if (this.rootDir === "/background") return this.#passToClient("crx-reload");
		if (filename === "content.js") return this.#passToClient("crx&tab-reload");

		//check for preprocessor
		this.processFileType.has(fileType) && this.#processFile(fileType, filename);

		//Find full path of changed file
		if (watchDir) this.#passToClient(`/${watchDir}/${filename}`);
		else this.#passToClient(resolve(this.rootDir, filename));
	}

	#processFile(fileType, filename) {
		//TODO Emit event
		switch (fileType) {
			case "scss":
				this.#processCss(filename);
				break;

			case "pug":
				this.#processHTML(filename);
				break;
		}
	}

	#processCss(filename) {
		exec(`sass ${this.rootDir}/${filename} ${this.rootDir.slice(1)}/style/${filename.split(".")[0]}.css`);
	}

	#processHTML(filename) {}
}
