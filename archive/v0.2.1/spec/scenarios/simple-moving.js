module.exports = {
	name: "Move semantics",
	sets: [
		{
			name: "available",
			filters: [{
				name: "transition",
				target: "underOffer",
				method: "move",
				description: "Make an offer"
			}]
		},
		{
			name: "underOffer",
			filters: [{
				name: "transition",
				target: "available",
				method: "move",
				description: "Cancel offer"
			},{
				name: "transition",
				target: "sold",
				method: "move",
				description: "Sell"
			}]
		},
		{
			name: "sold"
		}
	]
};