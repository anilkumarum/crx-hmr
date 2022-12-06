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
		this.processFileType.has(fileType) && this.#processFile(fileType, watchDir, filename);

		//Find full path of changed file
		if (watchDir) this.#passToClient(`/${watchDir}/${filename}`);
		else this.#passToClient(resolve(this.rootDir, filename));
	}

	#processFile(fileType, watchDir, filename) {
		//TODO Emit event
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
		//TODO need to test
		exec(`pug -w ./${watchDir}/index.pug`, (_, stdout, stdErr) => console.error(stdErr));
	}
}
