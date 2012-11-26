(function(context) {


	// Sets
	context.Sets = function(config, repo, options) {
		
		this.init();
		var links = this.links;

		options = options || {};
		options.generateId = options.generateId || function(callback) { callback(null, generateUUID()); };

		var sets = {};

		if(config.sets) initSets(config.sets);
		if(config.transitions) initTransitions(config.transitions);

		function initSets(setConfig) {
			for(var i = 0; i < setConfig.length; i++) {
				var set = new Set(setConfig[i], repo, options);
				links.push(set.findLink("self"));
				sets[set.name] = set;
			}
		}

		function initTransitions(transitionConfig) {
			for(var i = 0; i < transitionConfig.length; i++) {
				var transition = JSON.parse(JSON.stringify(transitionConfig[i]));
				var sourceSet = sets[transition.source];
				var targetSet = sets[transition.target];
				if(sourceSet && targetSet) {
					transition.source = sourceSet;
					transition.target = targetSet;
					var linkFactory = buildLinkFactory(transition);
					sourceSet.addLinkFactory(linkFactory);
				}
			}
		}
	};
	context.Sets.prototype = new Hypermedia();


	// Set
	function Set(config, repo, options, linkFactories, callback) {

		this.init();
		this.name = config.name;
		this.addLinkFactory.apply(this, linkFactories);
		var set = this;

		function initLinks(links) {
			links.push(new Link.toSelf(set));
			links.push(new Link.toCreate(set));
			forEach(set.linkFactories, function(factory) { factory.buildSetLink(set); });
		}

		function indexItems(links, callback) {
			repo.index(set.name, function(err, itemIds) {
				if(err) { if(callback) callback(err); return; }
				for(var i = 0; i < itemIds.length; i++) {
					var target = new Item(set, itemIds[i], null, repo, set.linkFactories);
					links.push(new Link.toItem(target));
				}
				if(callback) callback(null, links);
			});
		}

		this.createResource = function(data, callback) {

			options.generateId(function(err, itemId) {
				repo.store(set.name, itemId, data, function(err, created) {
					if(!callback) return;
					if(err) callback(err);
					else callback(null, new FollowResult(201,
						new Item(set, itemId, created, repo, set.linkFactories)
					));
				});
			});
		};

		this.rehydrate = function(callback) {
			new Set(config, repo, options, this.linkFactories, function(err, set) {
				if(err) { if(callback) callback(err); return; }
				if(!callback) return;
				var result = set ? new FollowResult(200, set) : new FollowResult(404);
				callback(null, result);
			});
		};

		this.addLinkFactory = function(factory) {
			Set.prototype.addLinkFactory.call(set, factory);
			factory.buildSetLink(this);
		};

		initLinks(this.links);
		indexItems(this.links, function(err, links) {
			if(err) { if(callback) callback(err); return; }
			if(!callback) return;
			callback(null, set);
		});
	}
	Set.prototype = new Hypermedia();


	// Item
	function Item(set, itemId, data, repo, linkFactories) {

		this.init();
		this.name = set.name + "/" + itemId;
		this.data = data;
		this.addLinkFactory.apply(this, linkFactories);
		var item = this;

		function initLinks(links) {
			var newLinks = [ new Link.toSet(set), new Link.toSelf(item), new Link.toUpdate(item), new Link.toDelete(item) ];
			forEach(newLinks, function(link) { links.push(link); });
			forEach(item.linkFactories, function(factory) { factory.buildItemLink(set, item); });
		}

		initLinks(this.links);

		function reinitLinks() {
			var links = [];
			initLinks(links);
			item.links = links;
		}
		
		this.rehydrate = function(callback) {

			repo.retrieve(set.name, itemId, function(err, data) {
				if(err) { if(callback) callback(err); return; }
				if(!callback) return;
				if(data) {
					var newItem = new Item(set, itemId, data, repo, item.linkFactories);
					callback(null, new FollowResult(200, newItem));
				} else {
					callback(null, new FollowResult(404, context.NRR));
				}
			});
		};

		this.update = function(data, callback) {
			repo.store(set.name, itemId, data, function(err, updated) {
				if(err) { if(callback) callback(err); return; }
				item.data = updated;
				reinitLinks();
				if(!callback) return;
				callback(null, new FollowResult(200, item));
			});
		};

		this.del = function(callback) {
			repo.remove(set.name, itemId, function(err, removed) {
				if(err){ if(callback) callback(err); return; }
				if(!callback) return;
				callback(null, new FollowResult(200, item));
			});
		};
	}
	Item.prototype = new Hypermedia();


	// LinkFactory
	function buildLinkFactory(transitionConfig) {
		var module = require("./transition-" + transitionConfig.method);
		return new module.LinkFactory(transitionConfig, Link);
	}


	// Link
	function Link(rel, followAction, resource) {
		this.rel = rel;
		this.follow = function() { return followAction.apply(resource, arguments); };
		this.path = resource.name;
	}
	Link.toSelf = function(self) {
		return new Link(
			"self",
			function(callback) { this.rehydrate(callback); },
			self
		);
	};
	Link.toUpdate = function(item) {
		return new Link(
			"update",
			function(data, callback) { this.update(data, callback); },
			item
		);
	};
	Link.toDelete = function(item) {
		return new Link(
			"delete",
			function(callback) { this.del(callback); },
			item
		);
	};
	Link.toCreate = function(set) {
		return new Link(
			"create",
			function(data, callback) { this.createResource(data, callback); },
			set
		);
	};
	Link.toSet = function(set) {
		return new Link(
			"set",
			function(callback) { this.rehydrate(callback); },
			set
		);
	};
	Link.toItem = function(item) {
		return new Link(
			"item",
			function(callback) { this.rehydrate(callback); },
			item
		);
	};


	// FollowResult
	function FollowResult(status, representation) {
		this.status = status;
		this.repr = representation;
	}


	// Hypermedia
	function Hypermedia() {
		this.init = function() {
			this.links = [];
		};

		this.findLink = function(rel, path) {
			for(var i = 0; i < this.links.length; i++) {
				if((this.links[i].rel==rel) && ((!path) || (path==this.links[i].path)))
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

		this.addLinkFactory = function(factory, factoryN) {
			this.linkFactories = this.linkFactories || [];
			for(var i = 0; i < arguments.length; i++) {
				this.linkFactories.push(arguments[i]);
			}
		};
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


	// NullResourceRepresentation
	context.NRR = new Hypermedia();
	context.NRR.init();


	// NullLink
	context.NL = new Link(
		"nothing",
		function() {
			if(arguments.length===0) return;
			var callback = arguments[arguments.length-1];
			callback(null, new FollowResult(404, this));
		},
		context.NRR
	);

}(module.exports));