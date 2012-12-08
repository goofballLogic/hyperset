module.exports = {
	name: "Copy semantics",
	sets: [
		{
			name: "forms",
			filters: [{
				name: "transition",
				target: "publishedForms",
				method: "copy",
				description: "Publish form"
			}]
		},
		{
			name: "publishedForms",
			filters: [{
				name: "transition",
				target: "filledForms",
				method: "copy",
				description: "Fill form"
			}]
		},
		{
			name: "filledForms"
		}
	]
};