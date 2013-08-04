/*jslint node: true */
"use strict";
var express = require( "express" );
var whiskers = require( "./whiskers" );

module.exports = {

	"Engine" : Engine,
	"repos" : {

		"json" : require( "./json-repo" )

	}

};

function Factory( config ) {

	return {
		"buildModelCollection" : buildModelCollection,
		"buildCollectionUrl" : buildCollectionUrl,
		"buildItemUrl" : buildItemUrl,
		"buildUpsertLocateRequestsUrl" : buildUpsertLocateRequestsUrl,
		"buildDeleteRequestsUrl" : buildDeleteRequestsUrl,
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

	function buildDeleteRequestsUrl( collectionName ) {

		return buildCollectionUrl( collectionName ) + "/deleteRequests";
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

	app.use( express.bodyParser() );

	app.get(	config.pathname,											renderApp			);
	app.get(	config.pathname + "/:collectionName",						renderCollection	);
	app.get(	config.pathname + "/:collectionName/:itemId",				renderItem			);
	app.get(	config.pathname + "/:collectionName/:itemId/item-edits",	renderItemEditor	);

	app.post(	config.pathname,											addCollection		);
	app.post(	config.pathname + "/:collectionName",						addItem				);
	app.post(	config.pathname + "/:collectionName/upsertLocateRequests",	locateUpsert		);
	app.post(	config.pathname + "/:collectionName/deleteRequests",		deleteItem			);
	app.post(	config.pathname + "/:collectionName/:itemId/item-edits",	upsertItem			);

	app.use( function( err, req, res, next ) {

		if( err.code && !!~[ 404, 409 ].indexOf( err.code ) ) {

			res.send( err.code, err.message );

		} else {

			if ( err ) console.log( err );
			return next( err );

		}

	} );

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

	function renderApp( req, res, next ) {

		repo.getCollections( function( err, collections ) {

			if( err ) return next( err );
			var model = { };
			for( var k in config ) model[ k ] = config[ k ];
			model.collections = collections.map( factory.buildModelCollection );
			res.send( whiskers[ "html-app" ]( model ) );

		} );

	}

	function renderCollection( req, res, next ) {

		repo.getCollection( req.params.collectionName, function( err, model ) {

			if( err ) return next( err );
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.url = factory.buildCollectionUrl( model.name );
			model[ "upsert-item-url" ] = factory.buildUpsertLocateRequestsUrl( model.name );
			model.items.forEach( function( item ) { item.url = factory.buildItemUrl( model.name, item ); } );
			res.send( whiskers[ "html-collection" ]( model ) );

		} );

	}

	function renderItem( req, res, next ) {

		repo.getItem( req.params.collectionName, req.params.itemId, function( err, model ) {

			if( err ) return next( err );
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.collection = { name: req.params.collectionName };
			model.collection.url = factory.buildCollectionUrl( model.collection.name );
			model.url = factory.buildItemUrl( model.collection.name, model );
			model[ "upsert-url" ] = factory.buildItemUpsertUrl( model.collection.name, model );
			model[ "delete-url" ] = factory.buildDeleteRequestsUrl( model.collection.name );
			res.send( whiskers[ "html-item" ]( model ) );

		} );

	}

	function renderItemEditor( req, res, next ) {

		repo.getItemOrTemplate( req.params.collectionName, req.params.itemId, function( err, model, exists ) {

			if( err ) return next( err );
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.collection = { name: req.params.collectionName };
			model.collection.url = factory.buildCollectionUrl( model.collection.name );
			model.url = factory.buildItemUrl( model.collection.name, model );
			model[ "upsert-url" ] = factory.buildItemUpsertUrl( model.collection.name, model );
			model[ "form-description" ] = exists ? "Update item content" : "Create item";
			model[ "form-submit-action" ] = exists ? "Update" : "Create";
			res.send( whiskers[ "html-item-editor" ]( model ) );

		} );

	}

	function addCollection( req, res, next ) {

		var contentType = req.headers[ "content-type" ] || "";

		if( !!~contentType.indexOf( "x-www-form-urlencoded" ) )
			return addCollectionByForm( req, res, next );

		return next( new Error( "Not implemented: Handle invalid content type" ) );

	}

	function addCollectionByForm( req, res, next ) {

		var collectionName = req.body.collectionName;
		repo.addCollection( collectionName, function( err ) {

			if( err ) return next( err );
			res.setHeader( "location", factory.buildCollectionUrl( collectionName ) );
			res.send( 201 );

		} );

	}

	function addItem( req, res, next ) {

		var contentType = req.headers[ "content-type" ] || "";

		if( !!~contentType.indexOf( "x-www-form-urlencoded" ) )
			return addItemByForm( req, res, next );

		return next( new Error( "No implemented: Handle invalid content type" ) );
	}

	function addItemByForm( req, res, next ) {

		var item = { content: req.body.content || null };
		var collectionName = req.params.collectionName;

		repo.upsertItem( collectionName, item, function( err, created ) {

			if( err ) return next( err );
			res.setHeader( "location", factory.buildItemUrl( collectionName, created ) );
			res.send( 201 );

		} );


	}

	function locateUpsert( req, res ) {

		res.redirect( factory.buildItemUpsertUrl( req.params.collectionName, { id: req.body.itemId } ) );

	}

	function upsertItem( req, res, next ) {

		repo.getItemOrTemplate( req.params.collectionName, req.params.itemId, function( err, model, exists ) {

			if( err ) return next( err );
			model.content = req.body.content;
			try {

				repo.upsertItem( req.params.collectionName, model, function( err ) {

					if( err ) return next( err );
					try {

						renderItemEditor( req, res );

					} catch( e ) {

						return next( e );

					}

				} );

			} catch( e ) {

				return next( e );

			}

		} );

	}

	function deleteItem( req, res ) {

		repo.deleteItem( req.params.collectionName, req.body.itemId, function( err ) {

			if( err ) throw err;
			res.redirect( factory.buildCollectionUrl( req.params.collectionName ) );

		} );

	}

}