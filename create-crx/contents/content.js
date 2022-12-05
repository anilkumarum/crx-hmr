(async function () {
	const clientUrl = chrome.runtime.getURL("client.js");
	import(clientUrl).catch((err) => console.log(err));
})();
