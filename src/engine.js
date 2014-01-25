/* jslint node: true */
"use strict";

module.exports = {

	"Coordinator" : Coordinator

};

function Coordinator( config ) {

	var policyDispatcher = buildDispatcher( config, "policy-dispatcher", "./dispatch/policy-dispatcher" );
	var requestDispatcher = buildDispatcher( config, "request-dispatcher", "./dispatch/request-dispatcher" );
	var responseDispatcher = buildDispatcher( config, "response-dispatcher", "./dispatch/response-dispatcher" );

	return {

		"attach" : coordinatorAttach

	};

	function coordinatorAttach( app ) {

		app.use( middleware );

	}

	function middleware( err, req, res, next ) {

		var internalRequest = req.HSRequest;
		if( !( internalRequest instanceof Object ) ) return next( new Error( "Request must be an object" ) );

		policyDispatcher.dispatch( err, req, internalRequest, function( err, requestAfterPolicy ) {

			// error handling
			addErrorResponse( requestAfterPolicy, err );

			// pre-empting of request dispatcher
			if( requestAfterPolicy.response ) {

				return responseDispatcher.dispatch( err, requestAfterPolicy, res, next );

			}

			// request dispatch approved
			requestDispatcher.dispatch( requestAfterPolicy, function( err, requestWithResponse ) {

				// error handling
				addErrorResponse( requestWithResponse, err );

				// successful
				return responseDispatcher.dispatch( err, requestWithResponse, res, next );

			} );

		} );

	}

}

function addErrorResponse( internalRequest, err ) {

	if( !err ) return;
	var response = internalRequest.response = internalRequest.response || { };
	response.code = 500;
	response.message = err.message;
	response.err = err;

}

function buildDispatcher( config, key, defaultPath ) {

	var modulePath = config[ key ] || defaultPath;
	var module = require( modulePath );
	return new module.Dispatcher( config );

}