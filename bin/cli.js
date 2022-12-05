const arg = process.argv[2];

if (arg === "start") {
	await import("../server.js");
}

if (arg === "create") {
	const { cp } = await import("fs/promises");
	cp("create-crx", process.env.INIT_CWD, { recursive: true });
}
