(async function () {
	//jsload -> alternate | reload | refresh
	//inject -> scripts | contents
	//mdir (add more directory outside scripts)  -> e.g mdir=scss,css
	const query = "?inject=scripts&jsload=alternate";
	const clientUrl = chrome.runtime.getURL("/node_modules/crx-hmr/client.js");
	import(clientUrl + query).catch((err) => console.error(err));
})();
