/*jslint node: true */
"use strict";
var express = require( "express" );
var whiskers = require( "./whiskers" );

module.exports = {

	"Engine" : Engine

};

function Factory( config ) {

	return {
		"buildModelCollection" : buildModelCollection,
		"buildCollectionUrl" : buildCollectionUrl,
		"buildItemUrl" : buildItemUrl,
		"buildUpsertLocateRequestsUrl" : buildUpsertLocateRequestsUrl,
		"buildItemUpsertUrl" : buildItemUpsertUrl
	};

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

	function buildItemEditUrl( collectionName, item ) {

		return buildItemUrl( collectionName, item ) + "/edit";

	}

	function buildUpsertLocateRequestsUrl( collectionName ) {

		return buildCollectionUrl( collectionName ) + "/upsertLocateRequests";

	}

	function buildItemUpsertUrl( collectionName, item ) {

		return buildItemUrl( collectionName, item ) + "/item-edits";

	}

}

function Engine( config, repo, onComplete ) {

	var engine = {
		listen: engineListen,
		close: engineClose
	};

	var server = null;
	var app = express();
	var factory = new Factory( config );

	config.pathname = config.pathname || "/";
	if( config.pathname[ 0 ] !== "/" ) config.pathname = "/" + config.pathname;
	config.appUrl = config.appUrl || "";
	while( config.appUrl[ config.appUrl.length ] == "/" )
		config.appUrl = config.appUrl.substring( 0, config.appUrl.length - 1 );

	app.use( function( req, res, next ) {
		//console.log( req.method, req.url );
		next();
	} );
	app.use( express.bodyParser() );

	app.get(	config.pathname,											renderApp			);
	app.get(	config.pathname + "/:collectionName",						renderCollection	);
	app.get(	config.pathname + "/:collectionName/:itemId",				renderItem			);
	app.get(	config.pathname + "/:collectionName/:itemId/item-edits",	renderItemEditor	);

	app.post(	config.pathname,											addCollection		);
	app.post(	config.pathname + "/:collectionName",						addItem				);
	app.post(	config.pathname + "/:collectionName/upsertLocateRequests",	locateUpsert		);


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

		repo.getCollections( function( err, collections ) {

			if( err ) throw err;
			var model = { };
			for( var k in config ) model[ k ] = config[ k ];
			model.collections = collections.map( factory.buildModelCollection );
			res.send( whiskers[ "html-app" ]( model ) );

		} );

	}

	function renderCollection( req, res ) {

		repo.getCollection( req.params.collectionName, function( err, model ) {

			if( err ) throw err;
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.url = factory.buildCollectionUrl( model.name );
			model["upsert-item-url"] = factory.buildUpsertLocateRequestsUrl( model.name );
			model.items.forEach( function( item ) { item.url = factory.buildItemUrl( model.name, item ); } );
			res.send( whiskers[ "html-collection" ]( model ) );

		} );

	}

	function renderItem( req, res ) {

		repo.getItem( req.params.collectionName, req.params.itemId, function( err, model) {

			if( err ) throw err;
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.collection = { name: req.params.collectionName };
			model.collection.url = factory.buildCollectionUrl( model.collection.name );
			model.url = factory.buildItemUrl( model.collection.name, model );

			res.send( whiskers[ "html-item" ]( model ) );

		} );

	}

	function renderItemEditor( req, res ) {

		repo.getItemOrTemplate( req.params.collectionName, req.params.itemId, function( err, model, exists ) {

			if( err ) throw err;
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.collection = { name: req.params.collectionName };
			model.collection.url = factory.buildCollectionUrl( model.collection.name );
			model.url = factory.buildItemUrl( model.collection.name, model );
			model[ "form-description" ] = exists ? "Update item content" : "Create item";
			model[ "form-submit-action" ] = exists ? "Update" : "Create";
			res.send( whiskers[ "html-item-editor" ]( model ) );

		} );

	}

	function addCollection( req, res ) {

		var contentType = req.headers[ "content-type" ] || "";

		if( !!~contentType.indexOf( "x-www-form-urlencoded" ) )
			return addCollectionByForm( req, res );

		throw "Not implemented: Handle invalid content type";

	}

	function addCollectionByForm( req, res ) {

		var collection = { name: req.body.collectionName };
		repo.addCollection( collection, function( err, created) {

			if( err ) throw err;
			res.setHeader( "location", factory.buildCollectionUrl( created.name ) );
			res.send( 201 );

		} );

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

		repo.addItem( collectionName, item, function( err, created ) {

			if( err ) throw err;
			res.setHeader( "location", factory.buildItemUrl( collectionName, created ) );
			res.send( 201 );

		} );


	}

	function locateUpsert( req, res ) {

		res.redirect( factory.buildItemUpsertUrl( req.params.collectionName, { id: req.body.itemId } ) );

	}

}