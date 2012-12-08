(function(context) {

	context.Filter = function(LinkConstructor, SetConstructor, options, filterDef) {

		this.filterSetResult = function(result, callback) {
			
			callback(null, result);
		};

		this.filterItemResult = function(result, callback) {
			var item = result.repr;
			var link = buildCopyToLink(item);
			item.links.push(link);
			callback(null, result);
		};


		// helpers


		function buildCopyToLink(item) {
			return new LinkConstructor(
				"copy-to-" + filterDef.target,
				function(callback) {
					item.rehydrate(function(err, result) {
						if(err) { if(callback) callback(err); return; }
						result.repr.purgeLinks("*");
						var createLink = item.formSetLink(filterDef.target, LinkConstructor.toCreate);
						result.repr.links.push(createLink);
						if(!callback) return;
						callback(null, result);
					});
				},
				item
			);
		}

	};

}(module.exports));