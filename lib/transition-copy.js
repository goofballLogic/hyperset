(function(context) {

	context.LinkFactory = function(transition, LinkConstructor) {
		this.buildSetLink = function(set) {
			// no set links
		};
		this.buildItemLink = function(set, item) {
			item.links.push(new LinkConstructor(
				"copy-to-" + transition.target.name,
				function(callback) {
					item.rehydrate(function(err, result) {
						if(err) { if(callback) callback(err); return; }
						result.repr.purgeLinks("*");
						var createLink = LinkConstructor.toCreate(transition.target);
						result.repr.links.push(createLink);
						if(!callback) return;
						callback(null, result);
					});
				},
				item
			));
		};
	};

}(module.exports));