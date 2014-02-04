module.exports = {

	"Dispatcher" : Dispatcher

};

function Dispatcher() {

	return {

		"dispatch" : dispatch

	};

	function dispatch( req, res, next ) {

		next();

	}

}