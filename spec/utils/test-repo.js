module.exports = {
	
	// repo contract
	store: function(setName, itemId, item, callback) {
		if(this.debug) console.log("store", arguments);
		this.sets[setName] = this.sets[setName] || {};
		this.sets[setName][itemId] = item;
		callback(null, item);
	},
	retrieve: function(setName, itemId, callback) {
		if(this.debug) console.log("retrieve", arguments);
		var set = this.sets[setName] || {};
		var ret = itemId ? set[itemId] : set;
		if(this.debug) console.log(ret);
		callback(null, ret);
	},
	remove: function(setName, itemId, callback) {
		if(this.debug) console.log("remove", arguments);
		if(!itemId) return null;
		var set = this.sets[setName] || {};
		var toRemove = set[itemId];
		delete set[itemId];
		callback(null, toRemove);
	},
	index: function(setName, callback) {
		if(this.debug) console.log("index", arguments);
		var set = this.sets[setName] || {};
		var ret = [];
		for(var itemId in set) ret.push(itemId);
		callback(null, ret);
	},

	// proprietary
	flush: function() {
		this.sets = {};
	},
	sets: {},
	debug: false
};