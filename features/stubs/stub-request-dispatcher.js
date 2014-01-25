module.exports = {

	"Dispatcher" : Dispatcher,
	"getLastCall" : getLastCall,
	"getConfiguration" : getConfiguration,
	"setNextResponse" : setNextResponse,
	"willReturnError" : willReturnError

};

function getLastCall() {

	return global.stubRequestLastCall;

}

function setLastCall() {

	global.stubRequestLastCall = Array.prototype.slice.call( arguments, 0 );

}

function getConfiguration() {

	return global.stubRequestConfiguration;

}

function setNextResponse( resp ) {

	global.stubRequestNextResponse = resp;

}

function willReturnError( msg ) {

	global.stubRequestReturnError = msg;

}

function Dispatcher( config ) {
	delete global.stubRequestLastCall;
	delete global.stubRequestNextResponse;
	delete global.stubRequestReturnError;
	global.stubRequestConfiguration = config;

	return {

		"dispatch" : dispatch

	};

	function dispatch( internalRequest, next ) {
		setLastCall( internalRequest, next );
		internalRequest.response = global.stubRequestNextResponse || { "text" : "fake response" };
		var err = null;
		if( global.stubRequestReturnError ) err = new Error( global.stubRequestReturnError );
		next( err, internalRequest );

	}

}