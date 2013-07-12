/*jslint node: true */
"use strict";
var express = require( "express" );
var whiskers = require( "./whiskers" );

module.exports = {

	"Engine" : Engine

};

function Engine( config, repo, onComplete ) {

	var engine = {
		listen: engineListen,
		close: engineClose
	};

	var server = null;
	var app = express();

	config.pathname = config.pathname || "/";
	if( config.pathname[ 0 ] !== "/" ) config.pathname = "/" + config.pathname;
	config.appUrl = config.appUrl || "";
	while( config.appUrl[ config.appUrl.length ] == "/" )
		config.appUrl = config.appUrl.substring( 0, config.appUrl.length - 1 );

	app.use( function( req, res, next ) {
//		console.log( req.method, req.url );
		next();
	} );
	app.use( express.bodyParser() );

	app.get(	config.pathname,									renderApp			);
	app.get(	config.pathname + "/:collectionName",				renderCollection	);
	app.get(	config.pathname + "/:collectionName/:itemId",		renderItem			);

	app.post(	config.pathname,									addCollection		);
	app.post(	config.pathname + "/:collectionName",				addItem				);

	if( onComplete ) whiskers.ensureLoaded( function() { onComplete( engine ); } );

	return engine;

	function engineListen() {

		server = app.listen( config.port );
		return engine;

	}

	function engineClose() {

		server.close();
		return engine;

	}

	function renderApp( req, res ) {

		var model = { };
		for( var k in config ) model[ k ] = config[ k ];
		model.collections = repo.getCollections().map( buildModelCollection );
		res.send( whiskers[ "html-app" ]( model ) );

	}

	function renderCollection( req, res ) {

		var model = repo.getCollection( req.params.collectionName );
		model.app = { };
		for( var k in config ) model.app[ k ] = config[ k ];
		model.url = buildCollectionUrl( model.name );
		res.send( whiskers[ "html-collection" ]( model ) );
	}

	function renderItem( req, res ) {

		var model = repo.getItem( req.params.collectionName, req.params.itemId );
		model.app = { };
		for( var k in config ) model.app[ k ] = config[ k ];
		model.collection = { name: req.params.collectionName };
		model.collection.url = buildCollectionUrl( model.collection.name );
		model.url = buildItemUrl( model.collection.name, model );

		res.send( whiskers[ "html-item" ]( model ) );

	}

	function buildModelCollection( collection ) {

		var ret = JSON.parse( JSON.stringify( collection ));
		ret.href = buildCollectionUrl( ret.name );
		return ret;

	}

	function buildCollectionUrl( collectionName ) {

		return config.appUrl + "/" + collectionName;

	}

	function buildItemUrl( collectionName, item ) {

		return buildCollectionUrl( collectionName ) + "/" + item.id;

	}

	function addCollection( req, res ) {

		var contentType = req.headers[ "content-type" ] || "";

		if( !!~contentType.indexOf( "x-www-form-urlencoded" ) )
			return addCollectionByForm( req, res );

		throw "Not implemented: Handle invalid content type";

	}

	function addCollectionByForm( req, res ) {

		var collection = { name: req.body.collectionName };
		var created = repo.addCollection( collection );
		res.setHeader( "location", buildCollectionUrl( created.name ) );
		res.send( 201 );

	}

	function addItem( req, res ) {

		var contentType = req.headers[ "content-type" ] || "";

		if( !!~contentType.indexOf( "x-www-form-urlencoded" ) )
			return addItemByForm( req, res );

		throw "No implemented: Handle invalid content type";
	}

	function addItemByForm( req, res ) {

		var item = { content: req.body.content || null };
		var collectionName = req.params.collectionName;

		var created = repo.addItem( collectionName, item );

		res.setHeader( "location", buildItemUrl( collectionName, created ) );
		res.send( 201 );

	}


}