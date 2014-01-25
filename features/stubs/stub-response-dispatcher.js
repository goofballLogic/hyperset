module.exports = {

	"Dispatcher" : Dispatcher,
	"getLastCall" : getLastCall,
	"getConfiguration" : getConfiguration

};

function getLastCall() {

	return global.stubResponseLastCall;

}

function setLastCall() {

	global.stubResponseLastCall = Array.prototype.slice.call( arguments, 0 );

}

function getConfiguration() {

	return global.stubResponseConfiguration;

}

function willReturnError( msg ) {

	global.stubResponseReturnError = msg;

}

function Dispatcher( config ) {
	delete global.stubResponseLastCall;
	global.stubResponseConfiguration = config;

	return {

		"dispatch" : dispatch

	};

	function dispatch( err, internalRequest, res, next ) {
		setLastCall( err, internalRequest, res, next );
		next( err, internalRequest );

	}

}