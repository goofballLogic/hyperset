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
	configureForJSON: utilitiesConfigureForJSON,

	behaviours: {
		request: behaviourRequest,
		runThenRequest: behaviourRunThenRequest,
		submitFormWithValues: behaviourSubmitFormWithValues
	},

	first: utilitiesFirst,
	where: utilitiesWhere,
	firstLink: utilitiesFirstLink,
	findLinks: utilitiesFindLinks

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
		else submission += encodeURIComponent( $field.val() );
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

function behaviourRequest( context, method, payload, url, callback ) {

	if( arguments.length == 3 ) return behaviourRequest( context, "get", null, method, payload );

	var config = { };
	if( context.defaultRequestHeaders ) {

		config.headers = JSON.parse( JSON.stringify( context.defaultRequestHeaders ) );

	}
	config.headers = config.headers || { };
	if( !payload && "content-type" in config.headers ) delete config.headers[ "content-type" ];
	if( context.requestHeaders ) {

		for( var k in context.requestHeaders ) config.headers[ k ] = context.requestHeaders[ k ];
		delete context.requestHeaders;

	}
	request( method, url, payload, config, function( res ) {

		context.res = res;
		callback();

	} );

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

	if( payload && typeof payload == "object" ) payload = JSON.stringify( payload );

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
	if( !contentType ) return;
	if( !!~contentType.indexOf( "html" ) ) {

		res.$body = cheerio( body );

	} else if( !!~contentType.indexOf( "json" ) ) {

		try {

			res.json = JSON.parse( body );

		} catch( e ) {

			throw new Error( e.toString() + "\n" + body );

		}

	}

}

function utilitiesRun( configJSON, repo, onReady ) {

	new engine.Engine( configJSON, repo, function( engine ) { }, function( engine ) {

		engine.listen();
		onReady( engine );

	} );

}

function utilitiesConfigureRepo( context ) {

	context.repo = new fakeRepo.Repo();

}

function utilitiesConfigureWidgetsCollections( context, done ) {

	context.repo.addCollection( "collection1", function( err ) {

		context.repo.addCollection( "collection2", done );

	} );

}

function utilitiesConfigureForJSON( context ) {

	context.defaultRequestHeaders = {

		"content-type" : "application/json",
		"accept" : "application/json"

	};

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

function utilitiesWhere( arr, filter ) {

	var matcher = resolveFilter( filter );
	return arr.filter( matcher );

}

function utilitiesFirst( arr, filter ) {

	var matcher = resolveFilter( filter );
	for( var i = 0; i < arr.length; i++ ) {

		var item = arr[ i ];
		if( matcher( item ) ) return item;

	}
	return null;

}

function utilitiesFirstLink( obj, rel ) {

	return utilitiesFirst( obj.links || [], { "rel" : rel } );

}

function utilitiesFindLinks( obj, filter ) {

	filter = filter || function() { return true; };
	if( typeof filter != "function" ) filter = { "rel" : filter };
	return utilitiesWhere( obj.links || [], filter );

}

function resolveFilter( criteria ) {

	if( typeof criteria == "function" ) return criteria;
	return function( item ) {

		for( var k in criteria ) if ( criteria[ k ] != item[ k ] ) return false;
		return true;

	};

}