module.exports = {
	name: "Simplest scenario",
	sets: [
		{
			name: "immutables",
			filters: [{
				name: "prune",
				itemTypes: [ "update", "delete" ]
			}]
		}
	]
};