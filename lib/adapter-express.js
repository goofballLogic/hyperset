(function(context) {


	// Adapter


	context.Adapter = function(sets, config) {
		var root = config.root || "";
		if(root.length===0 || root[root.length-1]!="/") root += "/";

		var protocol = JSON.parse(defaultProtocol);
		var artists = contentTypeMap.buildArtists(root);

		this.install = function(app) {
			for(var method in protocol)
				for(var path in protocol[method])
					build(app, method, path);
		};

		function build(app, method, path) {

			app[method](root + path, function(req, res) {
				// the bit of the protocol we are dealing with
				var protobit = protocol[method][path];
				// make a copy of the trail
				var trail = copyArray(protobit.trail);
				// populate the trail with the url parameters
				for(var key in req.params) replaceInAll(trail, ":" + key, req.params[key]);
				// walk the trail, returning the final link
				walk(trail, sets.links, function(finalLink) {

					if(!finalLink || finalLink.rel=="nothing") {
						res.send(404, "Resource or action not found");
						return;
					}

					function toRespond(err, result) {
						if(fault(err, res)) return;
						var artist = artists.choose(req);
						var rendered = artist.render(protobit.resultType, result.repr);
						res.setHeader("content-type", artist.contentType);
						res.send(result.status, rendered);
					}

					var buffer = "";
					req.on("data", function(data) { buffer += data; });
					req.on("end", function() {
						if(protobit.hasPayload) {
							finalLink.follow(buffer, toRespond);
						} else {
							finalLink.follow(toRespond);
						}
					});

				});

			});

		}

	};



	// Hyperset specific utilities



	function walk(trail, links, callback) {
		// nothing to walk?
		if(trail.length === 0) { callback(null); return; }
		// find link
		var link = findByRelAndPath(links, trail.shift(), trail.shift());
		// missing link?
		if(link===null) { callback(null); return; }
		// at the end of the trail?
		if(trail.length === 0) { callback(link); return; }
		// keep walking...
		link.follow(function(err, result) {
			if(err) throw err;
			var resultLinks = result.repr.links || [];
			walk(trail, resultLinks, callback);
		});
	}

	function fault(err, res) {
		if(!err) return false;
		res.send(500, err);
		return true;
	}

	function findByRelAndPath(links, rel, path) {
		for(var i = 0; i < links.length; i++)
			if(links[i].rel==rel && links[i].path==path)
				return links[i];
		return null;
	}


	// Protocol



	var defaultProtocol = JSON.stringify({
		"get" : {
			":setName" : {
				"trail" : [ "self", ":setName" ],
				"resultType" : "set"
			}
		},

		"post" : {
			":setName" : {
				"trail" : [ "self", ":setName", "create", ":setName" ],
				"resultType" : "item",
				"hasPayload" : true
			}
		},

		"put" : {
			":setName/:itemId" : {
				"trail" : [ "self", ":setName", "item", ":setName/:itemId", "update", ":setName/:itemId" ],
				"resultType" : "item",
				"hasPayload" : true
			}
		}

	});



	// Content type map


	
	var contentTypeMap = {
		"application/json" : "json",
		buildArtists : function(root) {
			return {
				"html" : function() { return new HTMLArtist(root); },
				"json" : function() { return new JSONArtist(root); },
				choose : function(req) {
					var factory = contentTypeMap[req.headers.accept] || "html";
					return singleton(this, factory);
				}
			};
		}
	};



	// Artists



	function JSONArtist(root) {
		this.root = root;
		this.contentType = "application/json";
		this.render = function(reprType, repr) {
			if(reprType=="set") return this.renderSet(repr);
			if(reprType=="item") return this.renderItem(repr);
			throw "Unrecognised type: " + reprType;
		};
		this.renderSet = function(repr) {
			var ret = {
				"name" : repr.name,
				"links" : []
			};
			for(var i = 0; i < repr.links.length; i++) {
				ret.links.push({ "rel" : repr.links[i].rel, "href" : this.root + repr.links[i].path });
			}
			return ret;
		};
		this.renderItem = function(repr) {
			var ret = this.renderSet(repr);
			ret.data = repr.data;
			return ret;
		};
	}

	function HTMLArtist(root) {
		this.root = root;
		this.contentType = "text/html; charset=UTF-8";
		this.renderSet = function(repr) {
			var json = HTMLArtist.prototype.renderSet(repr);
			var ret = "<h1>" + repr.name + "</h1>";
			for(var i = 0; i < repr.links.length; i++) {
				var link = repr.links[i];
				var action = link.href;
				switch(link.rel) {
					case "self":
						ret += "<a href=\"" + link.href+ "\">" + this.name + "</a>";
						break;
					case "create":
						ret += "<form action=\"" + link.href + "\" method=\"POST\" ><h2>Create item</h2><textarea name=\"data\"></textarea><input type=\"submit\" name=\"Submit\" /></form>";
						break;
				}
			}
			return "<html><body>" + ret + "</body></html>";
		};
	}

	HTMLArtist.prototype = new JSONArtist();


	// Generic utilities


	function singleton(context, factoryMethod) {
		var val = context[factoryMethod]();
		context[factoryMethod] = function() { return val; };
		return val;
	}

	function Latch(quantity, completion) {
		var latch = this; latch.quantity = quantity;
		this.count = function() { if(--latch.quantity===0) completion(); };
	}

	function copyArray(array) {
		return Array.prototype.slice.call(array, 0);
	}
	
	function replaceInAll(array, theOld, theNew) {
		for(var i = 0; i < array.length; i++) {
			array[i] = array[i].replace(theOld, theNew);
		}
	}


})(module.exports);