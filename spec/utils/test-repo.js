function serialize(obj) { return JSON.parse(JSON.stringify(obj)); }

module.exports = {

	// repo contract
	store: function(setName, itemId, item, callback) {
		if(this.debug) console.log("store", arguments);
		this.sets[setName] = this.sets[setName] || {};
		this.sets[setName][itemId] = JSON.parse(JSON.stringify(item));
		callback(null, item);
	},
	storeSetMeta: function(setName, meta, callback) {
		if(this.debug) console.log("storeSetMeta", arguments);
		this.sets[setName] = this.sets[setName] || {};
		this.sets[setName].meta = serialize(meta);
		callback(null);
	},
	createLink: function(fromSetName, fromItemId, linkRel, targetSetName, targetItemId, callback) {
		if(this.debug) console.log("createLink", arguments);
		var fromSet = this.sets[fromSetName] = this.sets[fromSetName] || {};
		this.retrieve(fromSetName, fromItemId, function(err, fromItem) {
			if(err) { callback(err); return; }
			fromSet.itemsMeta = fromSet.itemsMeta || {};
			var fromItemMeta = fromSet.itemsMeta[fromItemId] = fromSet.itemsMeta[fromItemId] || { "links": [] };
			fromItemMeta.links.push({ "rel": linkRel, "set" : targetSetName, "itemId" : targetItemId });
			callback(null);
		});
	},
	destroyLink: function(fromSetName, fromItemId, linkRel, targetSetName, targetItemId, callback) {
		if(this.debug) console.log("destroyLink", arguments);
		var fromSet = this.sets[fromSetName] = this.sets[fromSetName] || {};
		this.retrieve(fromSetName, fromItemId, function(err, fromItem) {
			if(err) { callback(err); return; }
			if(fromSet.itemsMeta && fromSet.itemsMeta[fromItemId] && fromSet.itemsMeta[fromItemId].links) {
				var links = fromSet.itemsMeta[fromItemId].links;
				var newLinks = [];
				for(var i = 0; i < links.length; i++) {
					if(links[i].rel != linkRel || // match rel
						links[i].set != targetSetName || // match set name
						(targetItemId && (links[i].itemId != targetItemId)) || // if target id specified, should match
						(!targetItemId && links[i].itemId)) // if target id not specified, should be none to match against
						links.push(links[i]);
				}
				fromSet.itemsMeta[fromItemId].links = newLinks;
				callback(null);
			}
		});
	},
	retrieve: function(setName, itemId, callback) {
		if(this.debug) console.log("retrieve", arguments);
		var set = this.sets[setName] || {};
		var ret = itemId ? set[itemId] : set;
		var meta = itemId ? (set.itemsMeta || {})[itemId] : set.meta;
		if(ret) ret = serialize(ret);
		if(meta) meta = serialize(meta);
		if(this.debug) console.log(ret, meta);
		callback(null, ret, meta);
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
		for(var itemId in set) {
			if(itemId!="meta" && itemId!="itemsMeta")
				ret.push(itemId);
		}
		callback(null, ret);
	},

	// proprietary
	flush: function() {
		this.sets = {};
	},
	sets: {},
	debug: false
};