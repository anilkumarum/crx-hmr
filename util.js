export const clr = {
	"/background": "42",
	"/scripts": "43",
	"/options": "46",
	"/popup": "33",
	"/contents": "44",
};

function loadingAnimation(text = "", chars = ["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"], delay = 200) {
	let x = 0;

	return setInterval(function () {
		process.stdout.write("\r" + chars[x++] + " " + text);
		x = x % chars.length;
	}, delay);
}

// loadingAnimation("waiting for file change for");
//git remote add origin https://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@github.com/anilkumarum/crx-hotload.git
