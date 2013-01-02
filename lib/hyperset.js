var crypto = require("crypto");

(function(context) {



	// Sets
	context.Sets = function(config, options) {

		this.links = [];
		
		options = options || {};
		options.extend = options.extend || function(newOptions) { for(var key in this) { newOptions[key] = this[key]; } return newOptions; };
		options = options.extend({
			generateId: function(callback) { callback(null, generateUUID()); }
		});

		if(!config.sets) return;

		// when all sets are created, all sets have access to each other
		var sets = {};
		for(var i = 0; i < config.sets.length; i++) {
			var set = new Set(config.sets[i], options, sets);
			var setLink = set.findLink("self").cloneAs(set.name);
			this.links.push(setLink);
			sets[set.name] = set;
		}

	};



	// NullResourceRepresentation and NullLink
	context.NRR = new Hypermedia();
	context.NRR.init();
	context.NRR.name = null;
	context.NL = new Link(
		"nothing",
		function() {
			if(arguments.length===0) return;
			var callback = arguments[arguments.length-1];
			this.buildResult(404, callback);
		},
		context.NRR
	);

	Set.prototype = new Hypermedia();
	Item.prototype = new Hypermedia();

	// generic links
	Link.toSelf = function(self) {
		return new Link("self", function(callback) { this.rehydrate(callback); }, self);
	};
	// set links
	Link.toCreate = function(set) {
		return new Link("create", function() { this.createResource.apply(this, arguments); }, set );
	};
	// item links
	Link.toSet = function(set) {
		return new Link("set", function(callback) { this.rehydrate(callback); }, set);
	};
	Link.toUpdate = function(item) {
		return new Link("update", function(data, callback) { this.update(data, callback); }, item );
	};
	Link.toDelete = function(item) {
		return new Link("delete", function(callback) { this.del(callback); }, item);
	};
	Link.toItem = function(item) {
		return new Link("item", function(callback) { this.rehydrate(callback); }, item);
	};

	return;



	// Set
	function Set(config, options, baseSets, callback) {

		function PublicSetConstructor(newConfig, newOptions, newCallback) {
			return new Set(newConfig || config, newOptions || options, baseSets, newCallback);
		}

		this.disposition = function() { return "set"; };

		this.name = config.name;
		this.meta = {};
		this.formItemLink = formItemLink;
		this.rehydrate = rehydrate;
		this.addLinkFactory = addLinkFactory;
		this.buildResult = buildResult;
		this.buildKey = buildKey;
		this.createResource = createResource;
		this.storeMetaItems = storeMetaItems;
		this.init(baseSets);
		this.cloneConfig = cloneConfig;
		this.del = del;

		var set = this;

		initFilters();
		initLinks(this.links);
		indexItems(this.links, function(err, links) {
			if(faulted(err, callback)) return;
			initMeta(function(err) {
				if(callback) callback(err, set);
			});
		});

		baseSets[this.name] = this;
		
		return;

		function formItemLink(itemId) {
			return new Link.toItem(buildItem(itemId, null));
		}

		function rehydrate(callback) {
			new Set(config, options, baseSets, function(err, set) {
				if(faulted(err, callback)) return;
				if(!callback) return;
				if(set) set.buildResult(200, callback);
				else context.NRR.buildResult(404, callback);
			});
		}

		function addLinkFactory(factory) {
			Set.prototype.addLinkFactory.call(set, factory);
			factory.buildSetLink(this);
		}

		function buildResult(status, callback) {
			set.buildAndFilterResult(status, function(filter, result, next) {
				filter.filterSetResult(result, next);
			}, callback);
		}

		function buildKey() {
			return { "set" : this.name };
		}

		function cloneConfig() {
			return cloneData(config);
		}

		function createResource(id, data, callback) {

			if(!callback) { callback = data; data = id; id = null; }
			if(typeof callback != "function") throw new Error("Invalid callback specified: " + callback);
			if(typeof id == "function") { callback(new Error("Invalid id specified: " + id)); return; }
			if(typeof data == "function") { callback(new Error("Invalid data specified: " + data)); return; }

			var onHasId = function(err, itemId) {
				if(err) callback(err);
				options.repo.store(set.name, itemId, data, function(err, created) {
					if(!callback) return;
					if(err) callback(err);
					else {
						var item = buildItem(itemId, created);
						item.buildResult(201, callback);
					}
				});
			};

			if(id===null) options.generateId(onHasId);
			else onHasId(null, id);
		}

		function buildItem(itemId, data) {
			return new Item(set, itemId, data, options, set.representationFilters, baseSets);
		}

		function del(callback) {
			options.repo.removeSet(set.name, callback);
		}

		function storeMetaItems(meta, callback) {
			set.meta = set.meta || {};
			for(var key in meta) set.meta[key] = meta[key];
			options.repo.storeSetMeta(set.name, set.meta, callback);
		}

		function initLinks(links) {
			links.push(new Link.toSelf(set));
			links.push(new Link.toCreate(set));
		}

		function indexItems(links, callback) {
			options.repo.index(set.name, function(err, itemIds) {
				if(err) { if(callback) callback(err); return; }
				for(var i = 0; i < itemIds.length; i++)
					links.push(set.formItemLink(itemIds[i]));
				if(callback) callback(null, links);
			});
		}

		function initMeta(callback) {
			options.repo.retrieveSetMeta(set.name, function(err, meta) {
				if(faulted(err, callback)) return;
				set.meta = {};
				for(var key in meta) set.meta[key] = meta[key];
				if(callback) callback(null, set);
			});
		}

		function initFilters() {
			if(!config.filters) return;
			forEach(config.filters, function(filterDef) {
				var filterModule = require("./filter-" + filterDef.name);
				var filter = new filterModule.Filter(Link, PublicSetConstructor, options, filterDef);
				set.addRepresentationFilter(filter);
			});
		}
	}



	// Item
	function Item(set, itemId, data, options, filters, baseSets) {

		this.disposition = function() { return "item"; };

		this.name = set.name + "/" + itemId;
		this.data = data;
		this.buildKey = buildKey;
		this.rehydrate = rehydrate;
		this.update = update;
		this.del = del;
		this.createLink = createLink;
		this.destroyLink = destroyLink;
		this.buildResult = buildResult;
		this.calcHash = calcHash;
		this.setMeta = querySetMeta;

		var item = this;

		this.init(baseSets);
		this.addRepresentationFilter.apply(this, filters);
		initLinks(this.links);

		return;

		function initLinks(links) {
			var newLinks = [ new Link.toSet(set), new Link.toSelf(item), new Link.toUpdate(item), new Link.toDelete(item) ];
			forEach(newLinks, function(link) { links.push(link); });
		}

		function reinitLinks() {
			var links = [];
			initLinks(links);
			item.links = links;
		}
		
		function buildKey() { return { "set" : set.name, "itemId" : itemId }; }

		function rehydrate(callback) {

			options.repo.retrieve(set.name, itemId, function(err, data, meta) {
				if(faulted(err, callback)) return;
				if(!callback) return;
				if(data) {
					var newItem = new Item(set, itemId, data, options, item.representationFilters, baseSets);
					if(meta && meta.links) forEach(meta.links, function(link) {
						if(link.set) {
							if(link.itemId) {
								var itemLink = set.formItemLink(link.itemId);
								itemLink.rel = link.rel;
								newItem.links.push(itemLink);
							} else {
								var setLink = set.formSetLink(link.set);
								setLink.rel = link.rel;
								newItem.links.push(setLink);
							}
						}
					});
					newItem.buildResult(200, callback);
				} else {
					context.NRR.buildResult(404, callback);
				}
			});
		}

		function querySetMeta(key) {
			return cloneData(set.meta)[key];
		}

		function update(data, callback) {
			options.repo.store(set.name, itemId, data, function(err, updated) {
				if(faulted(err, callback)) return;
				item.data = updated;
				reinitLinks();
				if(!callback) return;
				item.buildResult(200, callback);
			});
		}

		function del(callback) {
			options.repo.remove(set.name, itemId, function(err, removed) {
				if(faulted(err, callback)) return;
				if(!callback) return;
				item.buildResult(200, callback);
			});
		}

		function createLink(link, callback) {
			// if you pass NL, just call back immediately
			if(link === context.NL) { if(callback) callback(null); return; }
			// otherwise create (and persist) it
			Item.prototype.createLink.call(this, link, function(err, result) {
				if(faulted(err, callback)) return;

				var key = link.buildTargetKey();
				options.repo.createLink(set.name, itemId, link.rel, key.set, key.itemId, function(err) {
					if(faulted(err, callback)) return;
					if(!callback) return;
					callback(null);
				});
			});
		}

		function destroyLink(link, callback) {
			if(link === context.NL) {
				if(callback) callback(null);
				return;
			}
			Item.prototype.destroyLink.call(this, link, function(err, result) {
				if(faulted(err, callback)) return;
				var key = link.buildTargetKey();
				options.repo.destroyLink(set.name, itemId, link.rel, key.set, key.itemId, callback);
			});
		}

		function buildResult(status, callback) {
			this.buildAndFilterResult(status, function(filter, result, next) {
				filter.filterItemResult(result, next);
			}, callback);
		}

		function calcHash() {
			var essence = JSON.stringify([ this.name, this.data, this.links ]);
			var hash = crypto.createHash("md5").update(essence).digest("hex");
			return hash;
		}
	}




	// Link
	function Link(rel, followAction, resource, path) {
		this.rel = rel;
		this.path = path || resource.name;
		this.follow = function() { return followAction.apply(resource, arguments); };
		this.clone = function() {
			return new Link(this.rel, this.follow, resource);
		};
		this.cloneAs = function(rel) {
			var ret = this.clone();
			ret.rel = rel;
			return ret;
		};
		this.buildTargetKey = function() {
			return resource.buildKey();
		};
	}
	



	// Hypermedia
	function Hypermedia() {

		var baseSets = null;

		this.init = function(initBaseSets) {
			this.links = [];
			this.linkFactories = [];
			this.representationFilters = [];
			baseSets = initBaseSets;
		};

		this.diposition = function() { return "generic"; };
		
		this.calcHash = function() { throw new Error("Not implemented"); };

		this.verifyHash = function(hash) { return this.calcHash()==hash; };

		this.findLink = function(rel) {
			for(var i = 0; i < this.links.length; i++) {
				if(this.links[i].rel==rel)
					return this.links[i];
			}
			return context.NL;
		};

		this.purgeLinks = function(rel) {
			var newLinks = [];
			if(rel!="*") forEach(this.links, function(link) { if(link.rel!=rel) newLinks.push(link); });
			this.links = newLinks;
		};

		this.findLinks = function(rel) {
			var ret = [];
			forEach(this.links, function(link) { if(link.rel==rel) ret.push(link); });
			return ret;
		};

		this.buildKey = function() { return {}; };

		this.addRepresentationFilter = function(filter, filterN) {
			var filters = this.representationFilters;
			forEach(arguments, function(filter) { filters.push(filter); });
		};

		this.buildResult = function(status, callback) {
			callback(null, new FollowResult(status, this));
		};

		this.createLink = function(link, callback) {
			this.links.push(link);
			callback(null, this);
		};

		this.destroyLink = function(link, callback) {
			this.links.splice(this.links.indexOf(link), 1);
			callback(null, this);
		};

		this.formSetItemLink = function(setName, itemId) {
			return baseSets[setName].formItemLink(itemId);
		};

		this.formSetLink = function(setName, linkFactory) {
			var target = baseSets[setName];
			if(target===null) throw new Error("non base-set link formation: not implemented: " + setName);
			if(linkFactory) {
				return new linkFactory(target);
			} else {
				return new Link.toSet(target);
			}
		};

		this.buildAndFilterResult = function(status, applyFilter, callback) {
			var result =  new FollowResult(status, this),
				filters = this.representationFilters;

			function applyFilters(filterIndex) {
				if(filterIndex < filters.length) {
					applyFilter(filters[filterIndex], result, function(err, newResult) {
						if(err) { callback(err); return; }
						result = newResult;
						applyFilters(filterIndex + 1);
					});
				} else {
					callback(null, result);
				}
			}

			applyFilters(0);
		};
	}



	// FollowResult
	function FollowResult(status, representation) {
		this.status = status;
		this.repr = representation;
		// convenience methods
		this.findLink = function() { return this.repr.findLink.apply(this.repr, arguments); };
		this.findLinks = function() { return this.repr.findLinks.apply(this.repr, arguments); };
	}



	// Utils
	function generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	function forEach(things, action) {
		if(!things) return;
		for(var i = 0; i < things.length; i++) action(things[i]);
	}

	function faulted(err, callback) {
		if(!err) return false;
		if(callback) callback(err);
		return true;
	}

	function cloneData(thing) {
		return JSON.parse(JSON.stringify(thing));
	}


}(module.exports));