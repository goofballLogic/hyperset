var qs = require("querystring");

(function(context) {


	// Adapter


	context.Adapter = function(sets, config) {
		var root = config.root || "";
		if(root.length===0 || root[root.length-1]!="/") root += "/";

		var protocol = JSON.parse(defaultProtocol);
		var artists = controller.buildArtists(root);
		var analysts = controller.buildAnalysts();

		this.install = function(app) {
			// main protocol
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
	
				function hike() {
					walk(trail, sets.links, function(err, finalLink) {
						if(fault(err, res)) return;

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

						if(protobit.hasPayload) {
							var analyst = analysts.choose(req);
							var payload = analyst.decode(req, buffer);
							finalLink.follow(payload, toRespond);
						} else {
							finalLink.follow(toRespond);
						}

					});
				}

				if(!req._body) {
					var buffer = "";
					req.setEncoding("utf8");
					req.on("data", function(data) { buffer += data; });
					req.on("end", hike);
				} else {
					hike();
				}

			});

		}

	};



	// Hyperset specific utilities



	function walk(trail, links, callback) {
		// nothing to walk?
		if(trail.length === 0) { callback(); return; }
		// find link
		var link = findByRelAndPath(links, trail.shift(), trail.shift());
		// missing link?
		if(link===null) { callback(); return; }
		// at the end of the trail?
		if(trail.length === 0) { callback(null, link); return; }
		// keep walking...
		link.follow(function(err, result) {
			if(err) { callback(err); return; }
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
			},
			":setName/:itemId" : {
				"trail" : [ "self", ":setName", "item", ":setName/:itemId" ],
				"resultType" : "item"
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
		},

		"delete" : {
			":setName/:itemId" : {
				"trail" : [ "self", ":setName", "item", ":setName/:itemId", "delete", ":setName/:itemId" ],
				"resultType" : "item"
			}
		}

	});



	// Content type map


	
	var controller = {
		"application/json" : "json",
		"text/plain" : "text",
		"application/x-www-form-urlencoded" : "html",
		simplify: function(mime) {
			return controller[mime] || "html";
		},
		buildArtists : function(root) {
			return {
				"html" : function() { return new HTMLArtist(root); },
				"json" : function() { return new JSONArtist(root); },
				"text" : function() { return new HTMLArtist(root); },
				choose : function(req) {
					var factory = controller[req.headers.accept] || "html";
					return singleton(this, factory);
				}
			};
		},
		buildAnalysts: function() {
			return {
				"html" : function() { return new HTMLAnalyst(); },
				"json" : function() { return new JSONAnalyst(); },
				"text" : function() { return new TextAnalyst(); },
				"choose" : function(req) {
					var factory = controller[req.headers["content-type"]] || controller[req.headers.accept] || "text";
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
		function alink(href, text) { return "<a href=\"" + root + href + "\">" + text + "</a>"; }
		function openForm(action, method) { return "<form action=\"" + root  + action + "\" method=\"" + method + "\">"; }
		function submit() { return "<input type=\"submit\" name=\"Submit\" />"; }
		function textarea(name, data) { return "<textarea name=\"" + name + "\">" + data + "</textarea>"; }
		function hidden(name, value) { return "<input type=\"hidden\" name=\"" + name + "\" value=\"" + value + "\" />"; }
		function li(stu) { return "<li>" + stu + "</li>"; }
		this.renderSet = function(repr) {
			var json = HTMLArtist.prototype.renderSet(repr);
			var ret = "<h1>" + repr.name + "</h1><ul>";
			var forms = "";
			for(var i = 0; i < repr.links.length; i++) {
				var link = repr.links[i];
				switch(link.rel) {
					case "self":
						ret += li(alink(link.path, repr.name));
						break;
					case "create":
						forms += openForm(link.path, "POST") + "<h2>Create item</h2>" + textarea("data") + submit() + "</form>";
						break;
					default:
						ret += li(alink(link.path, link.rel));
				}
			}
			ret += "</ul>" + forms;
			return "<html><body>" + ret + "</body></html>";
		};
		this.renderItem = function(repr) {
			var json = HTMLArtist.prototype.renderItem(repr);
			var ret = "<h1>" + repr.name + "</h1><ul>";
			var forms = "";
			for(var i = 0; i < repr.links.length; i++) {
				var link = repr.links[i];
				switch(link.rel) {
					case "update":
						forms += openForm(link.path, "POST") + "<h2>Update item</h2>" + hidden("_method", "PUT") + textarea("data", repr.data) + submit() + "</form>";
						break;
					case "delete":
						forms += openForm(link.path, "POST") + "<h2>Delete item</h2>" + hidden("_method", "DELETE") + submit() + "</form>";
						break;
					default:
						ret += li(alink(link.path, link.rel));
				}
			}
			ret += "</ul>" + forms;
			return "<html><body>" + ret + "</body></html>";
		};
	}

	HTMLArtist.prototype = new JSONArtist();


	// Analysts


	function JSONAnalyst() {

		this.decode = function(req, buffer) {
			if(!req._body) req.body = JSON.parse(buffer);
			return JSON.stringify(req.body);
		};
	}

	function HTMLAnalyst() {
		// use a proper analyst
		this.decode = function(req, buffer) {
			if(!req._body) req.body = qs.parse(buffer);
			return req.body.data;
		};
	}

	function TextAnalyst() {
		this.decode = function(req, buffer) {
			if(!req._body) req.body = buffer;
			return req.body;
		};
	}

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