var http = require("http")
	;

(function(context) {



	context.Repo = function(hostname, port, setPrefix) {

		var agent = new RiakAgent(hostname, port, setPrefix);

		var I = {
			"empty" : empty,
			"store" : storeItem,
			"storeSetMeta" : storeSetMeta,
			"retrieve" : retrieveItem,
			"retrieveSetMeta" : retrieveSetMeta,
			"index" : index,
			"remove" : remove,
			"createLink" : createLink,
			"destroyLink" : destroyLink
		};

		return I;

		function Latch(quantity, completion) {
			var latch = this;
			latch.quantity = quantity;
			this.count = function() { if(--latch.quantity===0) completion(); };
		}

		function empty(setName, callback) {
			index(setName, function(err, keys) {
				if(err) { callback(err); return; }
				if(keys.length===0) { callback(); return; }
				var latch = new Latch(keys.length, callback);
				for(var i = 0; i < keys.length; i++)
					remove(setName, keys[i], latch.count);
			});
		}

		function storeItem(setName, itemId, item, callback) {
			store(setName, "item-" + itemId, item, {}, callback);
		}

		function storeSetMeta(setName, meta, callback) {
			store(setName, "meta", meta, {}, callback);
		}

		function store(setName, key, item, headers, callback) {
			var toWrite = JSON.stringify(item);
			agent.put(setName, key, toWrite, headers, function(err, statusCode) {
				err = err || agent.buildError(statusCode);
				callback(err, item);
			});
		}

		function retrieveItem(setName, itemId, callback) {
			retrieve(setName, "item-" + itemId, callback);
		}

		function retrieveSetMeta(setName, callback) {
			retrieve(setName, "meta", callback);
		}

		function retrieve(setName, key, callback) {
			agent.get(setName, key, function(err, statusCode, body, meta) {
				var data = null;
				err = err || agent.buildError(statusCode);
				if(!err && body) data = JSON.parse(body);
				if(!err) {
					meta = meta || {};
					meta.links = [];
					var links = RiakLinks.parse(meta.link);
					for(var i = 0; i < links.length; i++) {
						if(links[i].isKeyMatch("item-")) {
							meta.links.push(new HypersetLink(links[i], setPrefix));
						}
					}
				}
				callback(err, data, meta);
			});
		}

		function remove(setName, itemId, callback) {
			agent.del(setName, itemId, callback);
		}

		function index(setName, callback) {
			agent.keys(setName, function(err, statusCode, data, meta) {
				var ret = [];
				var links = new RiakLinks.parse(meta.link);
				for(var i = 0; i < links.length; i++) {
					if(links[i].isKeyMatch("item-"))
						ret.push(links[i].key.substr(5));
				}
				callback(err, ret);
			});
		}

		function destroyLink(fromSetName, fromItemId, linkRel, targetsetName, targetItemId, callback) {
			agent.get(fromSetName, "item-" + fromItemId, function(err, statusCode, data, meta) {
				err = err || agent.buildError(statusCode);
				if(err) { callback(err); return; }
				var links = meta.links;
				var toRemove = -1;
				for(var i = 0; i < links.length; i++) {
					if(links[i].matches(setPrefix + "-" + targetsetName, "item-" + targetItemId, linkRel)) {
						toRemove = i;
					}
				}
				if(toRemove>-1) {
					links.splice(toRemove, 1);
				}
				meta = copy(meta, ["content-type", "x-riak-vclock", "etag", "links"]);
				store(fromSetName, "item-" + fromItemId, data, meta, callback);
			});
		}

		function createLink(fromSetName, fromItemId, linkRel, targetSetName, targetItemId, callback) {
			// get data and metadata for an item
			agent.get(fromSetName, "item-" + fromItemId, function(err, statusCode, data, meta) {
				err = err || agent.buildError(statusCode);
				if(err) { callback(err); return; }
				var links = meta.links || [];
				links.push(new RiakLink({
					"set" : setPrefix + "-" + targetSetName,
					"key" : "item-" + targetItemId,
					"rel" : linkRel
				}));
				meta = copy(meta, ["content-type", "x-riak-vclock", "etag", "links"]);
				store(fromSetName, "item-" + fromItemId, data, meta, callback);
			});
		}
	};

	function copy(copyFrom, keys) {
		var ret = {};
		for(var i = 0; i < keys.length; i++)
			if(copyFrom.hasOwnProperty(keys[i])) ret[keys[i]]=copyFrom[keys[i]];
		return ret;
	}

	var RiakLinks = {
		parse: function(linkHeader) {
			var links = linkHeader ? linkHeader.split(",") : [];
			var ret = [];
			for(var i = 0; i < links.length; i++) {
				ret.push(new RiakLink(links[i]));
			}
			return ret;
		},
		stringify: function(links) {
			var slinks = [];
			for(var i = 0; i < links.length; i++) slinks.push(links[i].stringify());
			return slinks.join(", ");
		}
	};

	function HypersetLink(riakLink, setPrefix) {
		this.rel = riakLink.rel;
		this.set = riakLink.set.substr(setPrefix.length + 1);
		this.itemId = riakLink.key.substr(5);
	}

	function RiakLink(linkData) {
		/*
		* "</", not("/") x n, "/"
		* , capture(not("/" or ">") x n)
		* , non-captured("/", capture(not("/") x n)) x 0 or 1
		* , anything x n, ">; "
		* , not-captured("riagtak" or "rel")
		* , "=""
		* , capture(not(""") x n)
		* , """
		*/
		var linkRe = /<\/[^\/]*\/([^\/>]*)(?:\/([^\/]*))?.*>; (?:riaktag|rel)="([^"]*)"/g;

		if(typeof(linkData)=="string") {
			var match = linkRe.exec(linkData);
			if(match) {
				this.set = match[1];
				this.key = match[2];
				this.rel = match[3];
			} else {
				throw new Error("Unable to parse link data:" + linkData);
			}
		} else {
			this.set = linkData.set;
			this.key = linkData.key;
			this.rel = linkData.rel;
		}

		this.stringify = function() {
			return "</riak/" + this.set + "/" + this.key + ">; riaktag=\"" + this.rel + "\"";
		};

		this.isKeyMatch = function(prefix) {
			if(!this.key) return false;
			if(this.key.length < prefix.length) return false;
			return this.key.substr(0, prefix.length) === prefix;
		};

		this.matches = function(set, key, rel) {
			return set==this.set && key==this.key && rel==this.rel;
		};
	}

	function RiakAgent(hostname, port, setPrefix) {
 
		function optify(options) {
			options.hostname = hostname;
			options.port = port;
			options.path = "/riak/" + setPrefix + "-" + options.path;
			options.agent = false;
			options.method = options.method || "GET";
			options.headers = {
				"content-type" : "application/vnd.hyperset+json",
				"host" : hostname
			};
			return options;
		}
		
		function buildRequest(options, headers, callback) {
			options.headers = options.headers || {};
			for(var k in headers) if(k!=="links") options.headers[k] = headers[k];
			var req = http.request(options, function(res) {
				var data = '';
				res.on("data", function(chunk) { data += chunk; }).on("end", function() {
					var headers = res.headers;
					if(headers.link) {
						headers.links = RiakLinks.parse(headers.link);
					}
					callback(null, res.statusCode, data, headers);
				}).on("error", callback);
			}).on("error", callback);
			if(headers.links) {
				for(var i = 0; i < headers.links.length; i++) {
					var link = headers.links[i].stringify();
					req.setHeader("link", link);
				}
			}
			return req;
		}

		this.buildError = function(statusCode) {
			if(!statusCode) return null;
			var ret = null;
			if(statusCode >= 500) {
				ret = new Error("Server error (" + statusCode + ")");
			} else if(statusCode >= 400) {
				ret = new Error("Client error (" + statusCode + ")");
			} else if (statusCode >= 300) {
				ret = new Error("Redirect (" + statusCode + ")");
			} else if (statusCode >= 200) {
				ret = null;
			} else {
				ret = new Error("Unknown error (" + statusCode + ")");
			}
			if(ret) ret.statusCode = statusCode;
			return ret;
		};

		this.put = function(setName, key, item, headers, callback) {
			options = optify({ "path" : setName + "/" + key, "method" : "PUT" });
			var req = buildRequest(options, headers, callback);
			req.write(item);
			req.end();
		};

		this.get = function(setName, key, callback) {
			var options = optify({ "path" : setName + "/" + key });
			var req = buildRequest(options, {}, callback);
			req.end();
		};

		this.keys = function(setName, callback) {
			var options = optify({ "path" : setName + "?keys=true" });
			var req = buildRequest(options, {}, callback);
			req.end();
		};

		this.del = function(setName, key, callback) {
			var options = optify({ "path" : setName + "/" + key, "method" : "DELETE" });
			var req = buildRequest(options, {}, callback);
			req.end();
		};
	}

}(module.exports));