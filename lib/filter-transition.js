(function(context) {

	context.Filter = function(LinkConstructor, SetConstructor, options, filterDef) {

		var itemStrategies = {
			"copy" : buildCopyToLink,
			"move" : buildMoveToLink
		};

		function faulted(err, callback) { if(!err) return false; callback(err, null); return true; }

		this.filterSetResult = function(result, callback) {
			callback(null, result);
		};

		this.filterItemResult = function(result, callback) {
			var item = result.repr;
			var strategy = itemStrategies[filterDef.method];
			if(!strategy) throw "Filter method unrecognised: " + filterDef.method;
			strategy.call(this, item);
			callback(null, result);
		};


		// helpers


		function buildCopyToLink(item) {
			var link = new LinkConstructor(
				"copy-to-" + filterDef.target,
				function(callback) {
					item.rehydrate(function(err, result) {
						if(faulted(err, callback)) return;
						result.repr.purgeLinks("*");
						var createLink = item.formSetLink(filterDef.target, LinkConstructor.toCreate);
						result.repr.links.push(createLink);
						if(!callback) return;
						callback(null, result);
					});
				},
				item,
				item.name + "/copying-to-" + filterDef.target
			);
			item.links.push(link);
		}

		function buildMoveToLink(item) {
			var link = new LinkConstructor(
				"move-to-" + filterDef.target,
				function(callback) {
					item.rehydrate(function(err, result) {
						if(!callback) return;
						if(faulted(err, callback)) return;
						var hash = result.repr.calcHash();
						result.repr.data = {
							"item" : result.repr.data,
							"command" : {
								"hash" : hash,
								"target" : filterDef.target
							}
						};
						result.repr.name = result.repr.name + "/commands/move";
						var executeLink = buildExecuteMoveLink(item);
						result.repr.purgeLinks("*");
						result.repr.links.push(executeLink);
						callback(null, result);
					});
				},
				item,
				item.name + "/moving-to-" + filterDef.target
			);
			item.links.push(link);
		}

		function buildExecuteMoveLink(item) {
			return new LinkConstructor(
				"execute-move",
				function(moveDef, callback) {
					this.rehydrate(function(err, result) {
						if(faulted(err, callback)) return;
						
						if(!result.repr.verifyHash(moveDef.hash)) { result.repr.buildResult(409, callback); return; }

						var freshItem = result.repr;
						freshItem.formSetLink(moveDef.target).follow(function(err, result) {
							if(faulted(err, callback)) return;
							var createLink = result.findLink("create");
							freshItem.findLink("delete").follow(function(err, result) {
								if(faulted(err, callback)) return;
								createLink.follow(result.repr.data, function(err, result) {
									if(faulted(err, callback)) return;
									callback(null, result);
								});
							});
						});
					});
				},
				item
			);
		}


	};

}(module.exports));