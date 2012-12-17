var config = module.exports;

config["main"] = {
	rootPath: "../",
	environment: "node",
	sources: [
	],
	tests: [
		"spec/*-spec.js"
	]
};

config["riak"] = {
	rootPath: "../",
	environment: "node",
	sources: [
	],
	tests: [
		"spec-integration/repo-riak*-spec.js"
	]
};

config["express"] = {
	rootPath: "../",
	environment: "node",
	sources: [
	],
	tests: [
		"spec-integration/adapter-express*-spec.js"
	]
};