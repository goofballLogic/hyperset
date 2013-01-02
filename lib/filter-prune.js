(function(context) {

	context.Filter = function(LinkConstructor, SetConstructor, options, filterDef) {
		this.filterSetResult = function(result, callback) {
			var ret = prune(result, filterDef.setTypes);
			callback(null, ret);
		};

		this.filterItemResult = function(result, callback) {
			var ret = prune(result, filterDef.itemTypes);
			callback(null, ret);
		};

		function prune(result, defs) {
			defs = defs || [];
			for(var i = 0; i < defs.length; i++) {
				result.repr.purgeLinks(defs[i]);
			}
			return result;
		}
	};

}(module.exports));