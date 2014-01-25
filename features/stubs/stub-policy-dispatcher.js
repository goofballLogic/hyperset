module.exports = {

	"Dispatcher" : Dispatcher,
	"getLastCall" : getLastCall,
	"getConfiguration" : getConfiguration,
	"setNextResponse" : setNextResponse,
	"willReturnError" : willReturnError

};

function getLastCall() {

	return global.stubPolicyLastCall;

}

function setLastCall() {

	global.stubPolicyLastCall = Array.prototype.slice.call( arguments, 0 );

}

function getConfiguration() {

	return global.stubPolicyConfiguration;

}

function setNextResponse( resp ) {

	global.stubPolicyNextResponse = resp;

}

function willReturnError( msg ) {

	global.stubPolicyReturnError = msg;

}

function Dispatcher( config ) {
	delete global.stubPolicyLastCall;
	delete global.stubPolicyNextResponse;
	delete global.stubPolicyReturnError;
	global.stubPolicyConfiguration = config;

	return {

		"dispatch" : dispatch

	};

	function dispatch( err, req, internalRequest, next ) {
		setLastCall( err, req, internalRequest, next );

		internalRequest.response = global.stubPolicyNextResponse;
		if( global.stubPolicyReturnError ) err = new Error( global.stubPolicyReturnError );
		next( err, internalRequest );

	}

}