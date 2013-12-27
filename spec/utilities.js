/*jslint node: true */
"use strict";

var engine = require( ".." );
var http = require( "http" );
var url = require( "url" );
var cheerio = require( "cheerio" );
var fakeRepo = require( "./fake-repo" );

module.exports = {

	configureWidgets: utilitiesConfigureWidgets,
	configureRepo: utilitiesConfigureRepo,

	configureWidgetsCollections: utilitiesConfigureWidgetsCollections,
	configureUserCollection: utilitiesConfigureUserCollection,
	configureStaticContentCollection: utilitiesConfigureStaticContentCollection,

	configureForJSON: utilitiesConfigureForJSON,
	configurePolicy: utilitiesConfigurePolicy,
	configureUserProfile: utilitiesConfigureUserProfile,

	behaviours: {

		request: behaviourRequest,
		runThenRequest: behaviourRunThenRequest,
		submitFormWithValues: behaviourSubmitFormWithValues

	},

	first: utilitiesFirst,
	where: utilitiesWhere,
	firstLink: utilitiesFirstLink,
	findLinks: utilitiesFindLinks,

	dispose: utilitiesDispose,

	Latch: utilitiesLatch

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

	context.config = context.config || { };
	context.config.profileServiceUrl = "http://localhost:3125/profile";
	// run the engine
	if( context.server ) throw new Error( "Server not disposed" );
	new engine.Engine( context.config, context.repo, function( engine ) {

		context.server = engine;
		// run the profile server
		if( context.profileServer ) throw new Error( "Profile server not disposed" );
		context.profileServer = http.createServer( function( req, res ) {

			var profile = context.currentUserProfile ? JSON.stringify( context.currentUserProfile ) : "{}";
			res.write( profile, "utf8" );
			res.end();

		} );
		context.profileServer.listen( 3125, function() {

			// once the profile server is ready, start the engine listening
			engine.listen( function() {

				behaviourRequest( context, url, callback );

			} );

		} );

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

function utilitiesDispose( context ) {

	if( context.server ) {

		context.server.close();
		context.server = null;

	}
	if( context.profileServer ) {

		context.profileServer.close();
		context.profileServer = null;

	}

}

function utilitiesConfigureRepo( context ) {

	context.repo = new fakeRepo.Repo();

}

function utilitiesConfigureWidgetsCollections( context, done ) {

	context.repo.addCollection( "collection1", function( err ) {

		context.repo.addCollection( "collection2", done );

	} );

}

function utilitiesConfigureUserCollection( context, userProfile, done ) {

	var collectionName = "user-" + userProfile.id + "-stuff";
	context.repo.addCollection( collectionName, function() {

		context.repo.upsertItem( collectionName, { content: userProfile.id + " item-content" }, done );

	} );

}

function utilitiesConfigureStaticContentCollection( context, done ) {

	context.repo.addCollection( "static-content", function() {

		context.repo.upsertItem( "static-content", { "content" : "This is the general blurb for the web-site" }, done );

	} );

}

function utilitiesConfigureForJSON( context ) {

	context.defaultRequestHeaders = context.defaultRequestHeaders || { };
	context.defaultRequestHeaders[ "content-type" ] = "application/json; charset=UTF-8";
	context.defaultRequestHeaders[ "accept" ] = "application/json";

}

function utilitiesConfigureWidgets( context ) {

	context.config = context.config || { };
	context.config[	"name" ] = "Widgets";
	context.config[ "hostname" ] = "localhost";
	context.config[ "port" ] = 3124;
	context.config[	"protocol" ] = "http";
	context.config[ "pathname" ] = "api";
	context.config[ "appUrl" ] = "http://localhost:3124/api";

}

function utilitiesConfigurePolicy( context, policyName ) {

	context.config = context.config || { };
	context.config.policy = __dirname + "/policy/" + policyName + ".json";

}

function utilitiesConfigureUserProfile( context, profile ) {

	context.currentUserProfile = profile;

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

function utilitiesLatch( countdown, onComplete ) {
	/* jshint validthis: true */

	if( countdown <= 0 ) onComplete();
	this.count = function() { if( --countdown === 0) onComplete(); };
	this.bust = function() { countdown = 0; onComplete(); };

}

function resolveFilter( criteria ) {

	if( typeof criteria == "function" ) return criteria;
	return function( item ) {

		for( var k in criteria ) if ( criteria[ k ] != item[ k ] ) return false;
		return true;

	};

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

	// enable for local debugging proxy
	if( false ) {

		parsed.hostname = "127.0.0.1";
		parsed.port = "8888";
		parsed.path = requestUrl;

	}

	parsed.method = method;
	for( var k in config ) parsed[ k ] = config[ k ];

	if( payload && typeof payload == "object" ) payload = JSON.stringify( payload ) + "\n";
	if( payload ) parsed.headers[ "Content-Length" ] = Buffer.byteLength( payload );

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
	if( payload ) req.write( payload, "utf8" );
	req.end();
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