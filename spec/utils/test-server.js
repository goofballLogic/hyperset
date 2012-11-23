module.exports.Server = function() {

	var I = {
		build: function(endpoints) {
			for(var setName in endpoints) {
				I[setName] = {};
				flatten(endpoints[setName], I[setName]);
			}
		}
	};

	return I;

	function flatten(actions, setEndPoint) {
		for(var i=0; i<actions.length; i++) {
			var act = actions[i];
			setEndPoint[act.rel] = act.action;
		}
	}

};