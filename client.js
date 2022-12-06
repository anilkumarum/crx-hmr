const rootDir = location.pathname.match(/(.*)\//)[1],
	isInjected = location.protocol !== "chrome-extension:",
	isBackground = location.pathname === "/background.js",
	searchParams = new URL(import.meta.url).searchParams;
let pageName = isInjected ? checkInjectedType() : rootDir;

function checkInjectedType() {
	const injectPage = searchParams.get("inject");
	if (injectPage !== "scripts" && injectPage !== "contents")
		throw new Error("inject params must be scripts or contents");
	return "/" + injectPage;
}
//jsload -> "alternate" | "reload" | refresh
//inject -> "scripts" | "contents"
//reopen -> true
searchParams.has("mdir") && (pageName += searchParams.get("mdir"));
const evtSource = new EventSource("http://localhost:4500" + pageName);

addEventListener("beforeunload", () => evtSource.close());

evtSource.onmessage = async (event) => {
	if (event.data.startsWith("hmr")) return console.info("%c" + event.data, "color:cyan");
	if (isBackground) {
		if (event.data !== "crx-reload") return;
		else chrome.runtime.reload();
	}

	switch (event.data) {
		case "tab-reload":
			location.reload();
			break;

		case "crx-reload":
			//for options/popup page
			chrome.runtime.reload();
			if (searchParams.get("reopen") === "true")
				pageName === "/popup"
					? // @ts-ignore
					  chrome.action.openPopup({})
					: pageName === "/options" && chrome.runtime.openOptionsPage();

			break;

		case "crx&tab-reload":
			//injected script cannot run chrome reload() function
			chrome.runtime.sendMessage({ msg: "reload" }, () => location.reload());
			break;

		default:
			updateFiles(event.data);
			break;
	}
};

function updateFiles(filePath) {
	const fileType = filePath.split(".").pop();
	switch (fileType) {
		case "css":
			new CssUpdater(filePath);
			break;

		case "js":
			new JsUpdater(filePath);
			break;
	}
}

//$$$$$$$ Update js File $$$$$$$
const loadModule = searchParams.get("jsload") ?? "alternate";
var moduleLoaded;
class JsUpdater {
	constructor(filePath) {
		this.filePath = filePath;
		this.filename = this.filePath.slice(this.filePath.lastIndexOf("/") + 1);
		this.updateModule();
	}

	init() {
		//check file is in script tag
		//disable this if you don't need to check script tag
		if (!isInjected) {
			const scripTag = document.querySelector(`script[src*="${this.filename}"]`);
			if (scripTag) return location.reload();
		}
		this.updateModule();
	}

	checkComponent() {
		return customElements.get(this.filename.split(".")[0]);
	}

	async updateModule() {
		const jsModuleUrl = isInjected
			? //we need full path by injected script module
			  chrome.runtime.getURL(`${this.filePath}?t=${Date.now()}`)
			: `${this.filePath}?t=${Date.now()}`;

		//check file is web components file
		if (this.checkComponent()) {
			await import(jsModuleUrl).catch((err) => console.error(err));
			console.log("%c" + this.filename + "component hot reloaded", "color:gold");
		} else {
			switch (loadModule) {
				case "reload":
					await import(`${this.filePath}?t=${Date.now()}`).catch((err) => console.error(err));
					console.log("%c" + this.filename + "hot reloaded", "color:gold");
					break;

				case "alternate":
					console.log("%c" + this.filename + "hot reloaded", "color:gold");
					if (moduleLoaded) location.reload();
					else await import(jsModuleUrl).catch((err) => console.error(err));
					break;

				case "refresh":
					location.reload();
					break;

				default:
					location.reload();
					break;
			}
		}
	}
}

//%%%%%%%%%% ----- Update js File ---------%%%%%%%%%%
let cssStyleLinks;
const styleSheetMap = new Map();
class CssUpdater {
	constructor(filePath) {
		this.filePath = filePath;
		this.filename = this.filePath.slice(this.filePath.lastIndexOf("/") + 1);
		isInjected ? this.#replaceInjectedCss() : this.#updateCssFile();
	}

	#replaceInjectedCss() {
		chrome.runtime.sendMessage({ msg: "replaceCss", filePath: this.filePath });
	}

	#updateCssFile() {
		cssStyleLinks ??= this.getStyletagLinks();
		cssStyleLinks.has(this.filePath) ? this.#swapStyleLinks() : this.swapStyleSheet();
	}

	#swapStyleLinks() {
		//TODO find by relative path
		const oldEl = document.querySelector(`link[href*="${this.filename}"]`);
		if (!oldEl) throw new Error("css file not found");

		const nwLinkTag = oldEl.cloneNode();
		// @ts-ignore
		nwLinkTag.href = `${this.filePath}?t=${Date.now()}`;
		// Once loaded, remove the old link element (with some delay, to avoid FOUC)
		nwLinkTag.addEventListener("load", () => oldEl.remove(), { once: true });
		oldEl.after(nwLinkTag);
		console.log("%c" + this.filename + " hot reloaded", "color:dodgerblue");
	}

	async swapStyleSheet() {
		let existSheet;
		if (styleSheetMap.has(this.filePath)) existSheet = styleSheetMap.get(this.filePath);
		else {
			const style = (await import(this.filePath, { assert: { type: "css" } })).default;
			existSheet = document.adoptedStyleSheets.find((sheet) => sheet === style);
		}

		if (existSheet) {
			styleSheetMap.set(this.filePath, existSheet);
			fetch(this.filePath)
				.then((response) => response.ok && response.text())
				.then((data) => {
					existSheet.replace(data);
					console.log("%c" + this.filename + " hot reloaded", "color:dodgerblue");
				})
				.catch((err) => console.error(err));
		}
	}

	getStyletagLinks() {
		const styleLinkArr = Array.from(document.querySelectorAll("link[rel=stylesheet]")).map(
			// @ts-ignore
			(css) => new URL(css.href).pathname
		);
		return new Set(styleLinkArr);
	}
}

//> Only run if it is background page
if (isBackground) {
	function swapInjectedCss(tabId, filePath) {
		chrome.scripting.removeCSS({ target: { tabId }, files: [filePath] }).then(async (res) => {
			await chrome.scripting.insertCSS({ target: { tabId }, files: [filePath] });
			console.log("%c" + this.filename + " hot replaced", "color:dodgerblue");
		});
	}

	chrome.runtime.onMessage.addListener(async (req, sender, sendResponse) => {
		switch (req.msg) {
			case "replaceCss":
				swapInjectedCss(sender.tab.id);
				break;

			case "reload":
				chrome.runtime.reload();
				sendResponse("reloaded");
				break;
		}
	});
}
//TODO port.connect for activate background

/**
 *
 * @param {String} elemTag
 * @param {CustomElementConstructor} Class
 * @param {Array} styleSheetPaths
 */

//For custom customElements register
export function register(elemTag, Class, styleSheetPaths) {
	if (customElements.get(elemTag)) {
		const nodeList = document.querySelectorAll(elemTag);
		for (const node of nodeList) {
			Object.setPrototypeOf(node, Class.prototype);
			//for HTMLElement
			// @ts-ignore
			node.connectedCallback();
			//for LITELEMENT
			// node.requestUpdate();
		}
	} else {
		customElements.define(elemTag, Class);
		if (!styleSheetPaths) return;
		for (const styleSheetPath of styleSheetPaths)
			import(styleSheetPath, { assert: { type: "css" } }).then((result) => {
				// @ts-ignore
				const styleSheetUrl = new URL(import.meta.resolve(styleSheetPath)).pathname;
				styleSheetMap.set(styleSheetUrl, result.default);
			});
	}
}
