(function(context) {

	context.Set = function(repository) {

		var config = {
			generateId: generateUUID,
			repo: repository
		};

		this.initialise = function(script, callback) {
			var endpoints = {};
			if(script.hasOwnProperty("sets"))
			{
				defineSets(script.sets, endpoints);
				defineItems(script.sets, endpoints);
			}
			if(script.hasOwnProperty("transitions"))
				defineTransitions(script.transitions, endpoints);
			callback(endpoints);
		};

		function defineItems(sets, endpoints) {

		}

		function defineSets(sets, endpoints) {
			for(var i = 0; i < sets.length; i++) {
				var setName = sets[i].name;
				var setEndpoints = endpoints[setName] = [];
				setEndpoints.push({ "rel" : "get-items", "action" : setVerb("get", setName) });
				setEndpoints.push({ "rel" : "get-item", "action" : itemVerb("get", setName) });
				setEndpoints.push({ "rel" : "post-item", "action" : setVerb("post", setName) });
				setEndpoints.push({ "rel" : "put-item", "action" : itemVerb("put", setName) });
				setEndpoints.push({ "rel" : "delete-item", "action" : itemVerb("delete", setName) });
			}
		}

		function defineTransitions(transitions, endpoints) {
			for(var i = 0; i < transitions.length; i++) {
				var transition = transitions[i];
				validateTransition(transition, endpoints);
				var setEndpoints = endpoints[transition.source];
				var rel = transition.method + "-to-" + transition.target;
				setEndpoints.push({ "rel" : rel, "action" : transitionVerb(transition) });
			}
		}

		function validateTransition(transition, endpoints) {
			if(!endpoints.hasOwnProperty(transition.source)) throw new Error("Undefined source for transition: " + transition);
			if(!endpoints.hasOwnProperty(transition.target)) throw new Error("Undefined target for transition: " + transition);
		}

		function transitionVerb(transition) {
			var verb = (transition.method || "").toLowerCase(),
				source = transition.source,
				target = transition.target,
				ret = null
				;

			if(verb=="copy")
				ret = function(parameters) {
					var id = findRequiredId();
					var original = config.repo.retrieve(source, id);
					if(original===undefined) return Result.notFound();
					var copy = JSON.parse(JSON.stringify(original));
					var newId = config.generateId();
					var ret = config.repo.store(target, newId, copy);
					var hyperItem = hyperize.item(target, id, ret);
					return Result.ok(hyperItem);
				};

		}

		function setVerb(verb, setName) {
			verb = (verb || "").toLowerCase();

			var ret = null;

			if(verb=="post")
				ret = function(item) {
					if(item===null) return Result.badRequest("No content to add");
					var id = config.generateId();
					var ret = config.repo.store(setName, id, item);
					var hyperItem = hyperize.item(setName, id, ret);
					return Result.created(hyperItem);
				};
			else if(verb == "get")
				ret = function() {
					var ret = config.repo.retrieve(setName);
					var hyperSet = hyperize.set(setName, ret);
					return Result.ok(hyperSet);
				};
			else
				throw new Error("Unknown verb: " + verb.toUpperCase());

			return ret;
		}

		function itemVerb(verb, setName) {
			verb = (verb || "").toLowerCase();
			var ret = null;
			if(verb == "get")
				ret = function(parameters) {
					var id = findRequiredId(parameters);
					var ret = config.repo.retrieve(setName, id);
					if(ret===undefined) return Result.notFound();
					var hyperItem = hyperize.item(setName, id, ret);
					return Result.ok(hyperItem);
				};
			else if(verb == "put")
				ret = function(parameters, item) {
					var id = findRequiredId(parameters);
					var ret = config.repo.store(setName, id, item);
					var hyperItem = hyperize.item(setName, id, ret);
					return Result.ok(hyperItem);
				};
			else if(verb == "delete")
				ret = function(parameters) {
					var id = findRequiredId(parameters);
					var ret = config.repo.remove(setName, id);
					if(ret===undefined) return Result.notFound();
					var hyperItem = hyperize.item(setName, id, ret);
					return Result.ok(hyperItem);
				};
			else
				throw new Error("Unknown verb: " + verb.toUpperCase());

			return ret;
		}

	};

	function findRequiredId(parameters) {
		if(!parameters || !parameters.id) return Result.badRequest("No item id supplied");
		return parameters.id;
	}

	function generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	function isArray(arr) {
		return Object.prototype.toString.call( arr );
	}

	function findLinkByRel(links, rel) {
		if(!isArray(links) || !rel) return null;
		for(var i = 0; i < links.length; i++) {
			if(links[i].hasOwnProperty("rel") && rel == links[i].rel)
				return links[i];
		}
		return null;
	}

	var hyperize = {
		item: function(setName, itemId, item) {
			if(!item) return null;
			item = JSON.parse(JSON.stringify(item));
			return HyperRepresentation.ofItem(itemId, setName, { "item" : item });
		},
		set: function(setName, set) {
			var items = [];
			for(var id in set)
				items.push(hyperize.item(setName, id, set[id]));
			return HyperRepresentation.ofSet(setName, { "items" : items });
		}
	};

	// HyperRepresentation

	function HyperRepresentation(data) {
		for(var key in data) this[key] = data[key];
		this["links"] = this["links"] || [];
	}
	HyperRepresentation.prototype.findLinkByRel = function(rel) {
		if(!this.links) return null;
		for(var i = 0; i < this.links.length; i++)
			if(this.links[i].rel==rel) return this.links[i];
		return null;
	};
	HyperRepresentation.ofSet = function(setName, data) {
		var ret = new HyperRepresentation(data);
		if(!ret.findLinkByRel("self"))
			ret.links.push(new Link.toSet("self", "get-items", setName));
		if(!ret.findLinkByRel("create"))
			ret.links.push(new Link.toSet("create", "post-item", setName));
		if(!ret.hasOwnProperty("name")) ret.name = setName;
		return ret;
	};
	HyperRepresentation.ofItem = function(itemId, setName, data) {
		var ret = new HyperRepresentation(data);
		if(!ret.findLinkByRel("self"))
			ret.links.push(new Link.toItem("self", "get-item", setName, itemId));
		if(!ret.findLinkByRel("update"))
			ret.links.push(new Link.toItem("update", "put-item", setName, itemId));
		if(!ret.findLinkByRel("delete"))
			ret.links.push(new Link.toItem("delete", "delete-item", setName, itemId));
		if(!ret.hasOwnProperty("id")) ret.id = itemId;
		return ret;
	};

	// Link

	function Link(rel, method, action) {
		this.rel = rel;
		this.method = method;
		this.action = action;
	}
	Link.toItem = function(rel, method, setName, itemId) {
		return new Link(rel, method, { "id": itemId, "setName" : setName });
	};
	Link.toSet = function(rel, method, setName) {
		return new Link(rel, method, { "setName" : setName });
	};

	// Result

	function Result(statusCode, item, reason) {
		this.statusCode = statusCode;
		this.data = item;
		this.reason = reason;
	}
	Result.created = function(item) {
		return new Result(201, item);
	};
	Result.ok = function(item) {
		return new Result(200, item);
	};
	Result.notFound = function() {
		return new Result(404);
	};
	Result.badRequest = function(reason) {
		return new Result(400,null,reason);
	};

})(module.exports);