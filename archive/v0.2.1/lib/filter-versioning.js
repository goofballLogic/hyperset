(function(context) {

	/*
		A note about the purpose of the versioning filter.
		This is not intended to be a bullet-proof ordering mechanism.
		Versioning depends on the millisecond offset at which the version is created in order to calculate order.
		a. This is adequate for a few users versioning a document or resource as they are unlikely to have their requests processed at the same millisecond, and furthermore, simultaneous requests are likely not lost, but merely may occur out of order.
		b. We considered padding the millisecond offsets during the first billenium with a 0 in consideration of users of November 2286, but then realised that any race stupid enough to still be using this software would already have destroyed itself by then.
		Keys are calculated with the following algorithm:
			1. Javascript new Date().valueOf()
			2. Append "-" + nanosecond of hrtime
	*/

	/*
		A brief explanation of the data structure:
		Versioned set has many items, each of which is a pointer (itemId = name of versioned sets) to a versioning set, which makes up the "versioned item"
		Each item versioning set contains one item per version of the "versioned item"
	*/

	context.Filter = function(LinkConstructor, SetConstructor, options, filterDef) {


		var linkFactory = new LinkFactory(LinkConstructor, SetConstructor, options);

		// sets being filtered are either the versioned set, or a versioned-item set
		this.filterSetResult = function(result, callback) {
			var set = result.repr;
			if(set.meta["versioned-item-set"]) {
				// this is the item versions set
				linkFactory.alterItemToItemVersion(set);
				linkFactory.addLatestVersion(set);
				filterOut(set.links, function(link) { return link.rel == "create"; });
			} else {
				// assume that this is the versioned set
				filterOut(set.links, function(link) { return link.rel == "create"; });
				linkFactory.addCreateFirstVersion(set);
			}
			callback(null, result);

		};

		// items being filtered are either a pointer to a versioned-item set, or a version
		this.filterItemResult = function(result, callback) {
			var item = result.repr;
			if(item.setMeta("versioned-item-set")) {
				// a version
				linkFactory.alterSetToVersions(item);
				filterOut(item.links, function(link) { return link.rel == "update"; });
				linkFactory.addSiblingVersions(item, function(err) {
					if(faulted(err, callback)) return;
					callback(null, result);
				});

			} else {
				// a pointer to a versioned-item set
				linkFactory.addVersions(item, function(err) { // add versions
					if(faulted(err, callback)) return;
					filterOut(item.links, function(link) { return link.rel == "update"; }); // remove the update link
					linkFactory.alterDelete(item); // alter the delete link to remove all versions
					constructLatestVersionFacade(item, function(err) { // get the raw data of the latest version
						if(faulted(err, callback)) return;
						linkFactory.addAddVersion(item, function(err) { // ability to add a version
							if(faulted(err, callback)) return;
							callback(null, result);
						});
					});
				});
			}
		};


		// helpers
		function constructLatestVersionFacade(item, callback) {
			/*
				This is a pointer, so:
				1. Go get the set pointed to
				2. Follow the latest link on that set
				3. stick the data into the item being filtered
				4. add previous version using the link factory
			*/
			var setName = item.buildKey().itemId;
			// 1. Go get the set pointed to
			item.findLink("set").follow(function(err, itemSetResult) {
				if(faulted(err, callback)) return;
				var config = itemSetResult.repr.cloneConfig();
				config.name = setName;
				new SetConstructor(config, options, function(err, versionsSet) {
					if(faulted(err, callback)) return;

					// 2. Follow the latest link on that set
					getLatestVersion(versionsSet, { }, function(err, latestVersion) {
						if(faulted(err, callback)) return;

						// 3. Stick the data into the item being filtered
						var newData = latestVersion.data;
						item.data = newData;
						linkFactory.addFacadeVersions(item, latestVersion);
						callback(null);

					});
				});
			});
		}

		function getLatestVersion(versionsSet, options, callback) {
			options = options || {};
			if(isNaN(options.retries)) options.retries = 3;
			if(isNaN(options.backoff)) options.backoff = 10;
			versionsSet.rehydrate(function(err, versionsSetResult) {
				if(faulted(err, callback)) return;
				var latestVersionLink = versionsSetResult.findLink("latest-version");
				latestVersionLink.follow(function(err, result) {
					if(faulted(err, callback)) return;
					if(result.repr.name === latestVersionLink.path) {
						// bingo
						callback(null, result.repr);
						return;
					}
					if(options.retries > 0) {
						// try again
						setTimeout(function() {
							options.retries--;
							getLatestVersion(versionsSetResult.repr, options, callback);
						}, options.backoff);
					} else {
						// give up
						callback(new Error("Failed to load latest version"), null);
					}
				});
			});
		}
	};

	// Link Factory

	function LinkFactory(LinkConstructor, SetConstructor, options) {

		


		// Versioned set methods
		this.addCreateFirstVersion = function(versionedSet) {
			/* follow action should:
				1. create a versioned-item set with the same filters as the versioned set
				2. create the first version item in the versioned-item set
				3. create an item in the versioned set with a pointer to the versioned-item set
			*/
			var link = new LinkConstructor(
				"create",
				function(v1, callback) {
					// 1.a create id for set
					options.generateId(function(err, id) {
						if(faulted(err, callback)) return;
						// 1.b create set
						var config = versionedSet.cloneConfig();
						config.name = "versioned-item-" + id;
						new SetConstructor(config, options, function(err, versionedItemSet) {
							if(faulted(err, callback)) return;

							// 1.c set meta
							versionedItemSet.storeMetaItems({ "versioned-item-set" : true }, function(err) {
								if(faulted(err, callback)) return;
								
								// 2. create the item
								versionedItemSet.findLink("self").follow(function(err, versionedItemSetResult) {
									if(err) { if(callback) callback(err); return; }

									versionedItemSet = versionedItemSetResult.repr;
									var itemId = generateVersionKey();
									var createVersionLink = LinkConstructor.toCreate(versionedItemSet);
									createVersionLink.follow(itemId, v1, function(err, createVersionResult) {
										if(faulted(err, callback)) return;
										
										// 3. store versioned-container item
										versionedSet.createResource(versionedItemSet.name, { }, callback);
									});

								});

							});

						});

					});

				},
				versionedSet
			);
			versionedSet.links.push(link);
		};

		


		// Versioned item methods
		this.addVersions = function(item, callback) {
			/* to build this:
				1. follow the item's set link
				2. clone the set config
				3. form a link to the set */
			item.findLink("set").follow(function(err, result) {
				var config = result.repr.cloneConfig();
				config.name = item.buildKey().itemId;
				new SetConstructor(config, options, function(err, set) {
					if(faulted(err, callback)) return;
					item.links.push(set.findLink("self").cloneAs("versions"));
					callback(null);
				});
			});
		};

		this.addAddVersion = function(item, callback) {
			/* follow action should create a version in the versioned-item set */
			item.findLink("versions").follow(function(err, result) {
				var versionsCreateLink = LinkConstructor.toCreate(result.repr);
				var addVersionLink = new LinkConstructor(
					"add-version",
					function(vNext, callback) {
						var itemId = generateVersionKey();
						versionsCreateLink.follow(itemId, vNext, function(err, result) {
							if(faulted(err, callback)) return;
							// reload the item (picking up the latest version)
							item.rehydrate(function(err, result) {
								if(faulted(err, callback)) return;
								result.status = 201;
								callback(null, result);
							});
						});
					},
					item,
					item.name + "/adding-version"
				);
				item.links.push(addVersionLink);
				callback(err);
			});
		};

		this.alterDelete = function(item) {

			// need to convert the delete link to remove the versions set before deleting the item itself
			var deleteLink = item.findLink("delete");
			var deleteAction = deleteLink.follow;
			deleteLink.follow = function(callback) {
				item.findLink("versions").follow(function(err, result) {
					if(faulted(err, callback)) return;
					result.repr.del(function(err) { // delete the versions set
						if(faulted(err, callback)) return;
						deleteAction(callback); // delete the item as normal
					});
				});
			};
		};

		this.addFacadeVersions = function(item, latestVersion) {
			item.links.push(latestVersion.findLink("self").cloneAs("version"));
			item.links.push(latestVersion.findLink("previous-version").clone());
		};



		// Item versions set methods
		this.alterItemToItemVersion = function(set) {
			foreach(set.findLinks("item"), function(i, link) { link.rel = "item-version"; });
		};

		this.addLatestVersion = function(set) {
			/* to build this, we need to sort the keys for this set in alphabetical order and return a link to the item with the latest key */
			var items = set.findLinks("item-version");
			if(items.length===0) return;
			sortBy(items, function(link) { return link.path; });
			items.reverse(); // latest at the top
			set.links.push(items[0].cloneAs("latest-version"));
		};




		// Item version methods
		this.alterSetToVersions = function(itemVersion) {
			if(itemVersion.findLinks("set").length==1) {
				itemVersion.findLink("set").rel = "versions";
			}
		};

		this.addSiblingVersions = function(itemVersion, callback) {
			/*
				1. Load the item's set
				2. Sort the links
				3. Find myself
				4. Add link to previous in the list
			*/
			var selfLink = itemVersion.findLink("self");
			itemVersion.findLink("versions").follow(function(err, result) {
				if(faulted(err, callback)) return;
				var items = result.findLinks("item-version");
				if(items.length < 2) { callback(null); return; } // only one or no versions
				var match = null;
				sortBy(items, function(link) { return link.path; });
				var i = items.length;
				while(--i >= 0 && match===null)
					if(items[i].path == selfLink.path) match = i;
				if(match===null) { callback(null); return; } // self not found - only if data not yet consistent
				if(match > 0) { // i am not the first version
					var previousLink = items[match - 1];
					itemVersion.links.push(previousLink.cloneAs("previous-version"));
				}
				if(match + 1 < items.length) { // i am not the last version
					var nextLink = items[match + 1];
					itemVersion.links.push(nextLink.cloneAs("next-version"));
				}
				callback(null);
			});
		};

	}
	
	// Utilities
	
	function generateVersionKey() { return new Date().valueOf() + "-" + pad(process.hrtime()[1], 9); }
	
	function faulted(err, callback) {
		if(!err) return false;
		callback(err); return true;
	}

	function pad(number, length) { return ('00000000000000000000000' + number).slice(-1 * length); }

	function filterOut(items, predicate) { foreach(items, function(i, item) { if(predicate(item)) items.splice(i, 1); }); }

	function foreach(items, command) { for(var i = items.length - 1; i >= 0; i--) command(i, items[i]); }

	function sortBy(items, keySelector) {
		items.sort(function(a, b) {
			var keyA = keySelector(a), keyB = keySelector(b);
			return keyA === keyB ? 0 : keyA < keyB ? -1 : 1;
		});
	}

}(module.exports));