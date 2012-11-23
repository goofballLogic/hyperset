module.exports = {
	
	// repo contract
	store: function(setName, itemId, item) {
		if(this.debug) console.log("store", arguments);
		this.sets[setName] = this.sets[setName] || {};
		this.sets[setName][itemId] = item;
		return item;
	},
	retrieve: function(setName, itemId) {
		if(this.debug) console.log("retrieve", arguments);
		var set = this.sets[setName] || {};
		if(itemId) {
			return set[itemId];
		} else {
			return set;
		}
	},
	remove: function(setName, itemId) {
		if(this.debug) console.log("remove", arguments);
		if(!itemId) return null;
		var set = this.sets[setName] || {};
		var toRemove = set[itemId];
		delete set[itemId];
		return toRemove;
	},

	// proprietary
	flush: function() {
		this.sets = {};
	},
	sets: {},
	debug: false
};