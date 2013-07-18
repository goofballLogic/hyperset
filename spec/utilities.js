/*jslint node: true */
"use strict";

var engine = require( ".." );
var http = require( "http" );
var url = require( "url" );
var cheerio = require( "cheerio" );
var fakeRepo = require( "./fake-repo" );

module.exports = {
	run: utilitiesRun,

	configureWidgets: utilitiesConfigureWidgets,
	configureRepo: utilitiesConfigureRepo,
	configureWidgetsCollections: utilitiesConfigureWidgetsCollections,

	get: utilitiesGet,

	behaviours: {
		request: behaviourRequest,
		runThenRequest: behaviourRunThenRequest,
		submitFormWithValues: behaviourSubmitFormWithValues
	}
};

function behaviourSubmitFormWithValues( context, formSelector, formValues, callback ) {

	if( typeof callback === "undefined" && typeof formValues == "function" ) {
		callback = formValues;
		formValues = formSelector;
		formSelector = "form";
	}

	var form = context.res.$body.find( formSelector );

	var payload = [];
	form.find( "*[name]" ).each( function( i, field ) {
		var $field = cheerio( field );
		var name = $field.attr( "name" );
		var submission = name + "=";
		if( name in formValues ) submission += encodeURIComponent( formValues[name] );
		else submission += encodeURIComponent( $field.val( ) );
		payload.push( submission );
	} );

	var config = { headers: { "content-type" : "application/x-www-form-urlencoded" } };
	var method = form.attr( "method" ) || "POST";
	var action = form.attr( "action" );

	request( method, action, payload.join( "&" ), config, function( res ) {

		context.res = res;
		callback();

	} );

}

function behaviourRunThenRequest( context, url, callback ) {

	utilitiesRun( context.config, context.repo, function( server ) {

		context.server = server;
		behaviourRequest( context, url, callback );

	} );

}

function behaviourRequest( context, url, callback ) {

	utilitiesGet( url, function( res ) {

		context.res = res;
		callback();

	} );

}

function utilitiesGet( getUrl, config, callback ) {

	if(!callback && typeof config == "function") {
		callback = config;
		config = null;
	}

	request( "get", getUrl, null, config, callback );

}

function request( method, requestUrl, payload, config, callback ) {

	config = config || {};
	callback = callback || function() { };

	if( callback.length < 2 ) {

		var _callback = callback;
		callback = function( err, res ) {
			if( err ) throw err;
			_callback( res );
		};
	}

	var parsed = url.parse( requestUrl );
	parsed.method = method;
	for( var k in config ) parsed[ k ] = config[ k ];

	var req = http.request( parsed, function( res ) {

		var body = null;
		res.setEncoding( "utf8" );
		res.on( "data", function( chunk ) {

			body = (body || "") + chunk;

		} );
		res.on( "end", function() {

			parseBody( res, body );
			callback( null, res );

		} );

	} );

	req.on( "error", callback );
	if( payload ) req.write( payload );
	req.end();

}

function parseBody( res, body ) {

	if( body ) res.body = body;
	var contentType = res.headers["content-type"];

	if( contentType && !!~contentType.indexOf( "html" ) ) {
		res.$body = cheerio( body );
	}

}

function utilitiesRun( configJSON, repo, onReady ) {

	new engine.Engine( configJSON, repo, function( engine ) {
		engine.listen();
		onReady( engine );
	} );

}

function utilitiesConfigureRepo( context ) {

	context.repo = new fakeRepo.Repo();

}

function utilitiesConfigureWidgetsCollections( context, done ) {

	context.repo.addCollection( { name: "collection1" }, function( err ) {

		context.repo.addCollection( { name: "collection2" }, done );

	} );
}

function utilitiesConfigureWidgets( context ) {

	context.config = {
		"name" : "Widgets",
		"hostname" : "localhost",
		"port" : 3124,
		"protocol" : "http",
		"pathname" : "api",
		"appUrl" : "http://localhost:3124/api"
	};

}