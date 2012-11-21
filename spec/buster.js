var config = module.exports;

config["My tests"] = {
	rootPath: "../",
	environment: "node",
	sources: [
		"lib/**/*.js"
	],
	tests: [
		"spec/*-spec.js"
	]
};