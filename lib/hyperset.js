(function(context) {

	function generateUUID() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	context.Set = function(repository) {

		var config = {
			generateId: generateUUID,
			repo: repository
		};

		this.initialise = function(script, callback) {
			if(script.hasOwnProperty("sets"))
				defineItems(script.sets, callback);
		};

		function defineItems(sets, callback) {
			var endpoints = {};
			for(var i = 0; i < sets.length; i++) {
				var setName = sets[i].name;
				var setEndPoints = endpoints[setName] = [];
				setEndPoints.push({
					"rel" : "get-items",
					"action" : setVerb("get", setName)
				});
				setEndPoints.push({
					"rel" : "get-item",
					"action" : itemVerb("get", setName)
				});
				setEndPoints.push({
					"rel" : "post-item",
					"action" : setVerb("post", setName)
				});
				setEndPoints.push({
					"rel" : "put-item",
					"action" : itemVerb("put", setName)
				});
				setEndPoints.push({
					"rel" : "delete-item",
					"action" : itemVerb("delete", setName)
				});
			}
			callback(endpoints);
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
				return {
					"id" : itemId,
					"links" : [ { "rel" : "self", "href" : setName + "/" + itemId } ],
					"item" : item
				};
			},
			set: function(setName, set) {
				var items = [];
				for(var id in set) {
					items.push(hyperize.item(setName, id, set[id]));
				}
				return {
					"name" : setName,
					"links" : [ { "rel" : "self", "href" : setName } ],
					"items" : items
				};
			}
		};

		function setVerb(verb, setName) {
			verb = (verb || "").toLowerCase();

			var ret = null;

			if(verb=="post")
				ret = function(item) {
					if(item===null) return Result.badRequest(
						"No content to add"
					);
					var id = config.generateId();
					var ret = config.repo.store(setName, id, item);
					return Result.created(
						hyperize.item(setName, id, ret)
					);
				};
			else if(verb == "get")
				ret = function() {
					var ret = config.repo.retrieve(setName);
					return Result.ok(
						hyperize.set(setName, ret)
					);
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
					var ret = config.repo.retrieve(setName, parameters.id);
					if(ret===undefined) return Result.notFound();
					return Result.ok(
						hyperize.item(setName, parameters.id, ret)
					);
				};
			else if(verb == "put")
				ret = function(parameters, item) {
					var id = parameters.id;
					if(!id) return Result.badRequest(
						"No item id supplied"
					);
					var ret = config.repo.store(setName, id, item);
					return Result.ok(
						hyperize.item(setName, id, ret)
					);
				};
			else if(verb == "delete")
				ret = function(parameters) {
					var id = parameters.id;
					if(!id) return Result.badRequest(
						"No item id supplied"
					);
					var ret = config.repo.remove(setName, id);
					if(ret===undefined) return Result.notFound();
					return Result.ok(
						hyperize.item(setName, id, ret)
					);
				};
			else
				throw new Error("Unknown verb: " + verb.toUpperCase());

			return ret;
		}

	};

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