module.exports = {
	name: "Versioned publishing workflow",
	description: [
		"0. This scenario is taken from the specification for NearState's Dynamic Forms product",
		"1. This workflow describes a set of forms, each of which can be versioned.",
		"2. Forms can be published to a published set (creating a new copy).",
		"3. When a form is published, it contains a link back to the original version of the form from which it was copied.",
		"3.a. A published form is immutable and can only be copied or deleted",
		"4. Any of the forms in the published set can be chosen to fill in, at which point a copy of the form is made and placed into the working set.",
		"4.a. Forms in the working set can not be deleted, although they can be moved to the abandoned set.",
		"5. When a form is copied into the working set, it contains a link back to the published form from which it was copied, as well as the links to the version of the source form.",
		"6. When a filled-in form is ready to submit, it is moved from the working set to the submitted set. The existing links back to source forms are retained.",
		"7. A form in the submitted or abandoned sets is immutable"
	],
	sets: [
		{
			name: "forms",
			filters: [{
				name: "versioning"
			}, {
				name: "transition",
				target: "published",
				method: "copy",
				description: "Publish form"
			}]
		},
		{
			name: "published",
			filters: [{
				name: "transition",
				target: "working",
				method: "copy",
				description: "Fill form"
			},{
				name: "prune",
				types: [ "update" ]
			}]
		},
		{
			name: "working",
			filters: [{
				name: "transition",
				target: "submitted",
				method: "move",
				description: "Submit form"
			},{
				name: "transition",
				target: "abandoned",
				method: "move",
				description: "Abandon form"
			},{
				name: "prune",
				types: [ "delete" ]
			}]
		},
		{
			name: "submitted",
			filters: [{
				name: "prune",
				types: [ "update" ]
			}]
		},
		{
			name: "abandoned",
			filters: [{
				name: "prune",
				types: [ "update" ]
			}]
		}
	]/*,
	"express": {
		methods : {
			"copy-to-publishedForms" : "get",
			"copy-to-filledForms" : "get"
		}
	}*/
};