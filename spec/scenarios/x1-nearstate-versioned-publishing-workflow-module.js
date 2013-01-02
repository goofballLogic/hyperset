(function(context) {

	context.onTransition = [{
		test : function(transitionType, link, item, args) { return "copied" == transitionType && args && args[1] && 201 == args[1].status; },
		handler: function(transitionType, link, item, args) {
			var created = args[1].repr;
			//console.log(created);
			//console.log(item.findLink("self"));
		}
	}];

})(module.exports);