module.exports.toJSON = function(obj) {
	return JSON.parse(JSON.stringify(obj));
};
module.exports.GivenRepoAndConfig = function(scenario, repo) {
	var Sets = require("../../lib/hyperset").Sets;
	repo = repo || require("./test-repo");
	this.sets = new Sets(
		require("../scenarios/" + scenario),
		{ "repo" : repo }
	);
	this.repo = repo;
};

module.exports.FakeApp = function() {
	var routes = { "get" : [], "post": [], "put" : [], "delete" : [] };
	this["get"] = function() { routes["get"].push(arguments); };
	this["post"] = function() { routes["post"].push(arguments); };
	this["put"] = function() { routes["put"].push(arguments); };
	this["delete"] = function() { routes["delete"].push(arguments); };
	this.find = function(method, path) {
		var bits = path.split('/');
		method = method.toLowerCase();
		if(!this.hasOwnProperty(method)) return null;
		var verbHandlers = routes[method];
		for(var i = 0; i < verbHandlers.length; i++) {
			var handlerPath = verbHandlers[i][0];
			var handlerBits = handlerPath.split('/');
			if(subset(bits, handlerBits)) return verbHandlers[i][1];
		}
		return null;
	};
	this.describe = function() {
		return JSON.stringify(routes);
	};
	function subset(bits, handlerBits) {
		for(var i = 0; i < handlerBits.length; i++) {
			var handlerBit = handlerBits[i];
			if(!isParameter(handlerBit)) {
				// must be exact match
				if(bits[i]!=handlerBit) return false;
			} else {
				// must have a value
				if((bits.length-1) < i) return false;
			}
		}
		return true;
	}
	function isParameter(bit) {
		return (bit.length > 0) && (bit[0] === "{") && (bit[bit.length - 1] === "}");
	}
};