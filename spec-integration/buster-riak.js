var config = module.exports;

config["Riak repo integration"] = {
	rootPath: "../",
	environment: "node",
	sources: [
	],
	tests: [
		"spec-integration/riak-*-spec.js"
	]
};