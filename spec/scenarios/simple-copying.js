module.exports = {
	name: "Copy semantics",
	sets: [
		{
			name: "forms"
		},
		{
			name: "publishedForms"
		},
		{
			name: "filledForms"
		}
	],
	transitions: [
		{
			source: "forms",
			target: "publishedForm",
			method: "copy",
			description: "Publish form"
		},
		{
			source: "publishedForms",
			target: "filledForms",
			method: "copy",
			description: "Fill form"
		}
	]
};