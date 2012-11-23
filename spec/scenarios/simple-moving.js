module.exports = {
	name: "Move semantics",
	sets: [
		{
			name: "available"
		},
		{
			name: "underOffer"
		},
		{
			name: "sold"
		}
	],
	transitions: [
		{
			source: "available",
			target: "underOffer",
			method: "move",
			description: "Make an offer"
		},
		{
			source: "underOffer",
			target: "available",
			method: "move",
			description: "Cancel offer"
		},
		{
			source: "underOffer",
			target: "sold",
			method: "move",
			description: "Sell"
		}
	]
};