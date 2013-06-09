function serialize(obj) { return JSON.parse(JSON.stringify(obj)); }

module.exports = {

	// repo contract

	// store and item in a set
	store: function(setName, itemId, item, callback) {
		try{
			if(this.debug) console.log("store", arguments);
			if(typeof item == "function") console.log(arguments);
			this.sets[setName] = this.sets[setName] || {};
			this.sets[setName][itemId] = JSON.parse(JSON.stringify(item));
		} catch(e) {
			callback(e, null);
		}
		callback(null, this.sets[setName][itemId]);
	},
	// store meta data for a set
	storeSetMeta: function(setName, meta, callback) {
		if(this.debug) console.log("storeSetMeta", arguments);
		this.sets[setName] = this.sets[setName] || {};
		this.sets[setName].meta = serialize(meta);
		callback(null);
	},
	// create a link from one item to another
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
	// destroy a link from one item to another
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
	// retrieve data for an item
	retrieve: function(setName, itemId, callback) {
		if(this.debug) console.log("retrieve", arguments);
		var set = this.sets[setName] || {};
		var ret = set[itemId];
		var meta = (set.itemsMeta || {})[itemId];
		if(ret) ret = serialize(ret);
		if(meta) meta = serialize(meta);
		if(this.debug) console.log(ret, meta);
		callback(null, ret, meta);
	},
	// retrieve set meta
	retrieveSetMeta: function(setName, callback) {
		if(this.debug) console.log("retrieveSetMeta", arguments);
		var set = this.sets[setName] || {};
		var meta = set.meta;
		if(meta) meta = serialize(meta);
		if(this.debug) console.log(meta);
		callback(null, meta);
	},
	// delete an item
	remove: function(setName, itemId, callback) {
		if(this.debug) console.log("remove", arguments);
		if(!itemId) return null;
		var set = this.sets[setName] || {};
		var toRemove = set[itemId];
		delete set[itemId];
		callback(null, toRemove);
	},
	// delete a set
	removeSet: function(setName, callback) {
		if(this.debug) console.log("removeSet", arguments);
		if(this.sets[setName]) delete this.sets[setName];
		callback(null);
	},
	// index the items in a set
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