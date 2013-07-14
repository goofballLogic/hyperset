/*jslint node: true */
"use strict";

var engine = require( ".." );
var http = require( "http" );
var url = require( "url" );
var cheerio = require( "cheerio" );

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

	if( callback == null && typeof(formValues) == "function" ) {
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
		else submission += encodeURIComponent( $field.val( name ) );
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

	var collections = { };

	function findCollection( collectionName, callback ) {

		var collection = collections[ collectionName ];
		if( !collection ) return callback( new Error( "Collection does not exist") );
		callback( null, collection );

	}

	context.repo = {

		addCollection: function( collection, callback ) {

			collections[ collection.name ] = clone( collection );
			context.repo.getCollection( collection.name, callback );

		},

		addItem: function( collectionName, item, callback ) {

			findCollection( collectionName, function( err, collection ) {

				if(err) return callback( err );

				collection.items = collection.items || { };
				var newItem = { };
				for( var k in item ) newItem[ k ] = item[ k ];
				newItem.id = newItem.id || generateUUID();
				collection.items[ newItem.id ] = newItem;

				context.repo.getItem( collectionName, newItem.id, callback );

			} );

		},

		getCollections: function( callback ) {

			var ret = [];
			var collectionNames = Object.keys( collections );
			var latch = new Latch( collectionNames.length, function() {

				callback( null, ret );

			} );
			collectionNames.forEach( function( name ) {

				context.repo.getCollection( name, function( err, collection ) {

					if( err ) {
						callback( err );
						callback = new Function();
					}
					ret.push( collection );
					latch.countdown();

				} );

			} );

		},

		getCollection: function( collectionName, callback ) {

			findCollection( collectionName, function( err, collection ) {

				if( err ) return callback( err );

				var ret = clone( collection );
				ret.items = Object.keys( ret.items || { } ).map( function( itemId ) { return { "id" : itemId }; } );
				callback( null, ret );

			} );

		},

		getItem: function( collectionName, itemId, callback ) {

			findCollection( collectionName, function( err, collection ) {

				if( err ) return callback( err );
				if( !( itemId in ( collection.items || { } ) ) )
					return callback( new Error( "Item does not exist" ) );

				callback( null, collection.items[ itemId ] );

			} );

		},

		getItemOrTemplate: function( collectionName, itemId, callback ) {

			findCollection( collectionName, function( err, collection ) {

				if( err ) throw err;
				var exists = itemId in ( collection.items || { } );
				var ret = exists ? collection.items[ itemId ] : { id: itemId };
				callback( null, ret, exists );

			} );

		}

	};

}

function Latch( countdown, done ) { if(countdown===0) done(); this.countdown = function() { if(--countdown === 0) done(); }; }

function clone( jsonObject ) {

	return JSON.parse( JSON.stringify( jsonObject ) );

}

function generateUUID() {

	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {

		var r = Math.random() * 16 | 0, v = c == 'x' ? r : ( r & 0x3 | 0x8);
		return v.toString( 16 );

	} );

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