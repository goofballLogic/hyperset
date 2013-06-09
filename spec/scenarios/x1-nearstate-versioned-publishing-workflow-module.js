(function(context) {

	function whenCopiedTo(target) {
		return function(transitionType, def, item, result) {
			return target == def.target && whenCopied.apply(this, arguments);
		};
	}

	function whenCopied(transitionType, def, item, result) {
		return "copied" == transitionType && result && 200 == result.status;
	}

	context.onTransition = [{
		test : whenCopiedTo("published"),
		handler: function(transitionType, def, item, result, callback) {
			var originalLink = item.findLink("version").cloneAs("original");
			if(!originalLink.path) originalLink = item.findLink("self").cloneAs("original");
			createLink(originalLink, result, callback);
		}
	}, {
		test: whenCopiedTo("working"),
		handler: function(transitionType, def, item, result, callback) {
			var sourceFormLink = item.findLink("original").cloneAs("source-form");
			var blankFormLink = item.findLink("self").cloneAs("blank-form");
			createLink(sourceFormLink, result, function() {
				createLink(blankFormLink, result, callback);
			});
		}
	}];

	function createLink(link, result, callback) {
		result.repr.createLink(link, checked(callback, function(err) {
			result.repr.findLink("self").follow(checked(callback, function(err, newResult) {
				result.repr = newResult.repr;
				callback();
			}));
		}));
	}

	function checked(onError, onOk) {
		return function(err) {
			if(err) { onError(err); return; }
			onOk.apply(this, arguments);
		};
	}

})(module.exports);