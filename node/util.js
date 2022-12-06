export const _pgClr = {
	"/background": "42",
	"/scripts": "43",
	"/contents": "44",
	"/popup": "45",
	"/options": "46",
};

export const pgClr = {
	"/background": "32",
	"/scripts": "33",
	"/contents": "34",
	"/options": "36",
	"/popup": "35",
};

export const clr = {
	dim: "\x1b[2m%s\x1b[0m",
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

export function waiting(text = "", chars = ["⠙", "⠘", "⠰", "⠴", "⠤", "⠦", "⠆", "⠃", "⠋", "⠉"], delay = 200) {
	let x = 0;

	return setInterval(function () {
		process.stdout.write(`\r\x1B[36m${chars[x++]} ${text}\x1B[0m`);
		x = x % chars.length;
	}, delay);
}

// loadingAnimation("waiting for file change for");
