export const clr = {
	"/background": "42",
	"/scripts": "43",
	"/options": "46",
	"/popup": "33",
	"/contents": "44",
};

/* export const clr = {
	black: "\x1b[30m%s\x1b[0m",
	red: "\x1b[31m%s\x1b[0m",
	green: "\x1b[32m%s\x1b[0m",
	yellow: "\x1b[33m%s\x1b[0m",
	blue: "\x1b[34m%s\x1b[0m",
	magenta: "\x1b[35m%s\x1b[0m",
	cyan: "\x1b[36m%s\x1b[0m",
	white: "\x1b[37m%s\x1b[0m",
};

export const bgclr = {
	black: "\x1b[40m%s\x1b[0m",
	red: "\x1b[41m%s\x1b[0m",
	green: "\x1b[42m%s\x1b[0m",
	yellow: "\x1b[43m%s\x1b[0m",
	blue: "\x1b[44m%s\x1b[0m",
	magenta: "\x1b[45m%s\x1b[0m",
	cyan: "\x1b[46m%s\x1b[0m",
	white: "\x1b[47m%s\x1b[0m",
};
 */

function loadingAnimation(text = "", chars = ["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"], delay = 200) {
	let x = 0;

	return setInterval(function () {
		process.stdout.write("\r" + chars[x++] + " " + text);
		x = x % chars.length;
	}, delay);
}

// loadingAnimation("waiting for file change for");
