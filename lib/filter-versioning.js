(function(context) {

	context.Filter = function(LinkConstructor, SetConstructor, options, filterDef) {

		this.filterSetResult = function(result, callback) {
			var set = result.repr;
			if(!set.meta["versioning-item-versions"])
			{
				filterOut(set.links, function(link) { return link.rel == "create"; });
				set.links.push(buildCreateFirstVersionLink(set));
			}
			callback(null, result);
		};

		this.filterItemResult = function(result, callback) {
			var item = result.repr;
			filterOut(item.links, function(link) { return link.rel == "update"; });
			convertSetLinkIntoVersionsLink(item);
			alterDeleteLinkToHonourVersionLinks(item);

			buildAddVersionLink(item, function(err) {
				if(faulted(err, callback)) return;
				callback(null, result);
			});
		};


		// helpers
		

		function buildCreateFirstVersionLink(set) {
			/* follow action should:
				1. create a item-versions- set
				2. create an item in the versions set
			*/
			return new LinkConstructor(
				"create",
				function(v1, callback) {
					// 1.a create id for set
					options.generateId(function(err, id) {
						if(faulted(err, callback)) return;
						
						// 1.b create set
						var config = { name: "version-container" + id, filters: [ { name: "versioning" } ] };
						new SetConstructor(config, options, function(err, set) {
							if(faulted(err, callback)) return;

							// 1.c set meta
							set.storeMetaItems({ "versioning-item-versions" : true }, function(err) {
								if(faulted(err, callback)) return;
								
								// 2. create the item
								set.findLink("self").follow(function(err, set) {
									if(err) { if(callback) callback(err); return; }
									set.findLink("create").follow(v1, callback);
								});
							});
						});
					});
				},
				set
			);
		}


		function buildAddVersionLink(item, callback) {
			/* follow action should:
				1. create item from item-versions- set
				2. add next-version link
				3. add previous-version link to new version
			*/

			item.findLink("versions").follow(function(err, result) {
				var versionsCreateLink = result.findLink("create");
				var addVersionLink = new LinkConstructor(
					"add-version",
					function(vNext, callback) {

						// 1. create item
						versionsCreateLink.follow(vNext, function(err, result) {
							if(faulted(err, callback)) return;
							
							// 2. add next-version link
							var createdVersion = result.repr;
							var nextLink = createdVersion.findLink("self").cloneAs("next-version");
							item.createLink(nextLink, function(err, result) {
								if(faulted(err, callback)) return;

								// 3. add previous-version link to new version
								var previousVersionLink = item.findLink("self").cloneAs("previous-version");
								createdVersion.createLink(previousVersionLink, function(err, result) {
									if(faulted(err, callback)) return;
									if(callback) callback(null, createdVersion);
								});
							});
						});
					},
					item
				);
				addVersionLink.path += "/next-version";
				item.links.push(addVersionLink);
				callback(err);
			});
		}


		function convertSetLinkIntoVersionsLink(item) {
			for(var i = 0; i < item.links.length; i++) {
				if(item.links[i].rel=="set") item.links[i].rel = "versions";
			}
		}


		function alterDeleteLinkToHonourVersionLinks(item) {
			/* Follow action should:
				1. Follow previous link
				2. Follow next link
				3. Update previous to point to next
				4. Update next to point to previous
				5. Proceed with delete
			*/
			var deleteLink = item.findLink("delete");
			var executeOriginalDeleteAction = deleteLink.follow;
			deleteLink.follow = function(callback) {

				// 1. Find previous
				var previousResult = null, nextResult = null;
				item.findLink("previous-version").follow(function(err, result) {
					if(faulted(err, callback)) return;

					previousResult = result;

					// 2. Find next
					item.findLink("next-version").follow(function(err, result) {
						if(faulted(err, callback)) return;

						nextResult = result;
						// 3. update previous
						var oldNextLink = previousResult.findLink("next-version");
						previousResult.repr.destroyLink(oldNextLink, function(err) {
							if(faulted(err, callback)) return;

							var newNextLink = nextResult.findLink("self").cloneAs("next-version");
							previousResult.repr.createLink(newNextLink, function(err) {
								if(faulted(err, callback)) return;

								// 4. update next
								var oldPreviousLink = nextResult.findLink("previous-version");
								nextResult.repr.destroyLink(oldPreviousLink, function(err) {
									if(faulted(err, callback)) return;

									var newPreviousLink = previousResult.findLink("self").cloneAs("previous-version");
									nextResult.repr.createLink(newPreviousLink, function(err) {
										if(faulted(err, callback)) return;

										// 5. proceed with delete
										executeOriginalDeleteAction(callback);

									});
								});
							});
						});
					});
				});
			};
		}

		function faulted(err, callback) {
			if(!err) return false;
			if(callback) callback(err);
			return true;
		}

		function filterOut(items, predicate) {
			for(var i = items.length-1; i >= 0; i--) {
				if(predicate(items[i])) items.splice(i, 1);
			}
		}

	};

}(module.exports));