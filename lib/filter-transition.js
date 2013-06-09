(function(context) {

	context.Filter = function(LinkConstructor, SetConstructor, options, filterDef) {


		// filter interfacce
		this.filterSetResult = function(result, callback) {
			callback(null, result);
		};

		this.filterItemResult = function(result, callback) {
			strategy.call(this, result.repr);
			callback(null, result);
		};


		// find strategy for this filter
		var strategyFactories = {
			"copy" : buildCopyToLink,
			"move" : buildMoveToLink
		};
		var strategyFactory = strategyFactories[filterDef.method];
		if(!strategyFactory) throw "Filter method unrecognised: " + filterDef.method;
		var strategy = strategyFactory();


		// copy strategy
		function buildCopyToLink() {
			var rel = "copy-to-" + filterDef.target;
			var commandName = "/copying-to-" + filterDef.target;
			return function(item) {
				return buildLink(item, rel, "copy", buildExecuteCopyLink, item.name + commandName);
			};
		}

		function buildExecuteCopyLink(item, path) {
			return buildExecuteLink(item, "execute-copy", "copying", "copied", executeCopyTransition, path);
		}

		function executeCopyTransition(item, copyDef, callback) {
			item.formSetLink(copyDef.target).follow(function(err, result) {
				if(faulted(err, callback)) return;
				result.findLink("create").follow(item.data, callback);
			});
		}


		// move strategy
		function buildMoveToLink() {
			var rel = "move-to-" + filterDef.target;
			var commandName = "/moving-to-" + filterDef.target;
			return function(item) {
				return buildLink(item, rel, "move", buildExecuteMoveLink, item.name + commandName);
			};
		}

		function buildExecuteMoveLink(item, path) {
			return buildExecuteLink(item, "execute-move", "moving", "moved", executeMoveTransition, path);
		}

		function executeMoveTransition(item, moveDef, callback) {
			item.formSetLink(moveDef.target).follow(function(err, result) {
				if(faulted(err, callback)) return;
				var createLink = result.findLink("create");
				var deleteLink = item.findLink("delete");
				var deleteAction = deleteLink.rel=="delete" ? deleteLink.follow : item.del;
				deleteAction(function(err, result) {
					if(faulted(err, callback)) return;
					createLink.follow(result.repr.data, callback);
				});

			});
		}

		// generic builders
		function buildLink(item, rel, commandName, buildExecuteLinkStrategy, path) {
			/* on follow:
				1. rehydrate the item
				2. hash the current state
				3. prepare command payload
				4. build an execute link
				5. purge all other links
			 */
			var link = new LinkConstructor(
				rel,
				function(callback) {
					this.rehydrate(function(err, result) {
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
						result.repr.name = result.repr.name + "/commands/" + commandName;
						var executeLink = buildExecuteLinkStrategy(item, path);
						result.repr.purgeLinks("*");
						result.repr.links.push(executeLink);
						if(!callback) return;
						callback(null, result);
					});
				},
				item,
				path
			);
			item.links.push(link);
		}

		function buildExecuteLink(item, rel, followingTransitionType, followedTransitionType, executeStrategy, path) {
			/* on follow:
				1. emit "transitioning" event
				2. rehydrate the item
				3. verify the hash is still valid
				4. execute the transition
				5. emit the "transitioned" event
				6. return results
			*/
			var link = new LinkConstructor(
				rel,
				function(transitionDef, callback) {
					if(typeof transitionDef != "object") throw new Error("Invalid transition definition");
					var self = this;
					emitTransitionEvent(link, [ followingTransitionType, transitionDef, item ], item, function() {
						self.rehydrate(function(err, result) {
							if(faulted(err, callback)) return;
							if(!result.repr.verifyHash(transitionDef.hash)) {
								result.repr.buildResult(409, callback);
								return;
							}

							var freshItem = result.repr;
							executeStrategy(freshItem, transitionDef, function(err, result) {
								var toCopy = freshItem.loadedLinks.slice(0);
								copyLinks(toCopy, result.repr, function(err, copyingResult) {
									result.repr.rehydrate(function(err, result) {
										emitTransitionEvent(link, [ followedTransitionType, transitionDef, freshItem, result ], item, function() {
											if(faulted(err, callback)) return;
											callback(null, result);
										});
									});
								});
							});

						});

					});
				},
				item,
				path + "/execute"
			);
			return link;
		}

	};

	// helpers

	function copyLinks(linksToCopy, item, callback) {
		if(linksToCopy.length===0) callback(null);
		else {
			var toCopy = linksToCopy.shift().clone();
			item.createLink(toCopy, function(err) {
				if (faulted(err, callback)) return;
				copyLinks(linksToCopy, item, callback);
			});
		}
	}

	function faulted(err, callback) { if(!err) return false; callback(err, null); return true; }

	function emitTransitionEvent(context, args, emitter, callback) {
		args.unshift("transition");
		args.push(callback);
		emitter.emit.apply(context, args);
	}

}(module.exports));