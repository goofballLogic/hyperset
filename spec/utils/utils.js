module.exports.toJSON = function(obj) {
	return JSON.parse(JSON.stringify(obj));
};
module.exports.GivenRepoAndConfig = function(scenario, repo) {
	var Sets = require("../../lib/hyperset").Sets;
	repo = repo || require("./test-repo");
	this.sets = new Sets(
		require("../scenarios/" + scenario),
		repo
	);
};