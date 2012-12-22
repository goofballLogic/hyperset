var qs = require("querystring"),
	url = require("url");

(function(context) {


	// Adapter


	context.Adapter = function(sets, config) {
		var root = config.root || "";
		if(root.length > 0 && root[root.length - 1] == "/") root = root.substring(0, root.substring.length - 1);

		var trailBuilder = new RegExp(root + "(?:/([^/]*))?(?:/([^/]*))?(?:/([^/]*))?(?:/([^/]*))?(?:/([^/]*))?", "g");
		var protocol = JSON.parse(defaultProtocol);
		if(config.methods) {
			for(var rel in config.methods) {
				var verb = config.methods[rel];
				protocol[verb] = protocol[verb] || [];
				protocol[verb].push(rel);
			}
		}
		var artists = controller.buildArtists(root);
		var analysts = controller.buildAnalysts();

		this.install = function(app) {
			// main protocol
			app.all(root + "/*", function(req, res) {

				debugLog(config, "handling", req.url);
	
				if(!req._body) {
					var buffer = "";
					req.setEncoding("utf8");
					req.on("data", function(data) { buffer += data; });
					req.on("end", function() { hike(req, res, buffer); });
				} else {
					hike(req, res);
				}

			});
		};

		function hike(req, res, buffer) {
			var trail = trailBuilder.exec(req.url);
			trailBuilder.lastIndex = 0;
			trail.shift(); // get rid of the root
			clean(trail); // clean unmatched groups

			if(trail.length === 0) { res.send(400, "Set name not supplied"); return; }

			var setLink = findByRelAndPath(sets.links, trail[0], trail[0]);
			if(!setLink) { res.send(401, "Set not found"); return; }

			setLink.follow(function(err, result) {
				if(fault(err, res)) return;

				debugLog(config, "Walking", result.repr.name);

				var verb = req.method.toLowerCase();

				walk(trail.join("/"), result.repr.links, verb, protocol, function(err, finalLink) {
					if(fault(err, res)) return;

					if(!finalLink || finalLink.rel=="nothing") {
						res.send(404, "Resource or action not found");
						return;
					}

					debugLog(config, "Final link", finalLink.rel, finalLink.path);

					function toRespond(err, result) {
						if(fault(err, res)) return;
						var artist = artists.choose(req);
						var rendered = artist.render(result.repr);
						res.setHeader("content-type", artist.contentType);
						res.send(result.status, rendered);
					}

					if(!~protocol["payloaded"].indexOf(verb)) {
						finalLink.follow(toRespond);
					} else {
						var analyst = analysts.choose(req);
						var payload = analyst.decode(req, buffer);
						finalLink.follow(payload, toRespond);
					}
				});

			});

		}

	};



	// BitLinks
	
	function BitLinks(links) {
		var bitLinks = [];
		for(var i = 0; i < links.length; i++) {
			bitLinks.push(new BitLink(links[i]));
		}
		this.findFullMatch = function(verb, protocol, path) {
			for(var i = 0; i < bitLinks.length; i++) {
				if(bitLinks[i].isFullMatch(verb, protocol, path)) return bitLinks[i];
			}
		};
		this.sort = function() {
			bitLinks.sort(function(a, b) {
				return b.bits.length - a.bits.length;
			});
		};
		this.ofVerb = function(verb, protocol) {
			var links = [];
			for(var i = 0; i < bitLinks.length; i++) {
				if(!!~protocol[verb].indexOf(bitLinks[i].rel))
					links.push(bitLinks[i].link);
			}
			return new BitLinks(links);
		};
		this.visit = function(callback) {
			for(var i = 0; i < bitLinks.length; i++) callback.call(bitLinks[i]);
		};
	}
	function BitLink(link) {
		this.rel = link.rel;
		this.bits = link.path.split("/");
		this.link = link;
		this.hashCode = link.rel + "///" + link.path;
		this.isPartialMatch = function(verb, protocol, path) {
			// rel must match verb
			if(!~protocol[verb].indexOf(this.rel)) return false;
			var pathLinks = path.split("/");
			// can contain path?
			if(this.bits.length > pathLinks.length) return false;
			// do all the path's bits match
			for(var i = 0; i < this.bits.length; i++) if(pathLinks[i].toLowerCase()!=this.bits[i].toLowerCase()) return false;
			// match
			return true;
		};
		this.isFullMatch = function(verb, protocol, path) {
			return this.isPartialMatch(verb, protocol, path) && this.link.path.toLowerCase() == path.toLowerCase();
		};
	}



	// Hyperset specific utilities



	function walk(path, links, verb, protocol, callback, walkStack) {
		// if the trail is empty, callback nothing and return;
		if(path.length === 0) { callback("Nothing to walk"); return; }
		// if any of the links match callback with the link, clear the walk stack, and return;
		var bitLinks = new BitLinks(links);
		var match = bitLinks.findFullMatch(verb, protocol, path);
		if(match) { callback(null, match.link); return; }
		// for each of the links matching a rel in the get part of the protocol (from most to least complex)
		bitLinks = bitLinks.ofVerb("get", protocol);
		bitLinks.sort();
		// push any not already in history on to the walk stack
		walkStack = walkStack || [];
		bitLinks.visit(function() {
			if(!this.isPartialMatch("get", protocol, path)) return;
			walkStack.history = walkStack.history || [];
			if(!!~walkStack.history.indexOf(this.hashCode)) return;
			walkStack.history.push(this.hashCode);
			walkStack.push(this.link);
		});
		// if the walk stack contains a link
		var popped = walkStack.pop();
		if(popped) {
			// pop it off, follow it, then try to walk the links returned
			popped.follow(function(err, result) {
				if(err) { callback(err); return; }
				if(result.repr.links) walk(path, result.repr.links, verb, protocol, callback, walkStack);
			});
		} else {
			callback(null, null);
		}
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
		"get" : [ "self", "item", "set" ],
		"post" : [ "create" ],
		"put" : [ "update" ],
		"delete" : [ "delete" ],
		"payloaded" : [ "post", "put" ]
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
		this.render = function(repr) {
			var reprType = repr.disposition();
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
				ret.links.push({ "rel" : repr.links[i].rel, "href" : this.root + "/" + repr.links[i].path });
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
		function alink(href, text) { return "<a href=\"" + root + "/" + href + "\">" + text + "</a>"; }
		function openForm(action, method) { return "<form action=\"" + root  + "/" + action + "\" method=\"" + method + "\">"; }
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

	function debugLog(config) {
		if(!config.debug || !config.debug.log) return;
		var args = copyArray(arguments);
		args.shift();
		config.debug.log.apply(this, args);
	}

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

	function clean(array) {
		for(var i = array.length - 1; i >= 0; i--) {
			if(typeof array[i]=="undefined") array.splice(i, 1);
		}
	}


})(module.exports);