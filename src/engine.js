/*jslint node: true */
"use strict";
var express = require( "express" );
var whiskers = require( "./whiskers" );
var mimeContent = require( "./mime-content" );
var policy = require( "./policy" );
var profile = require( "./profile" );

module.exports = {

	"Engine" : Engine,
	"repos" : {

		"json" : require( "./json-repo" )

	}

};

function Engine( config, repo, onPreInitialise, onComplete ) {

	var engine = {
		listen: engineListen,
		close: engineClose,
		app: express()
	};

	if( onPreInitialise ) onPreInitialise( engine );

	var server = null;
	var app = engine.app;
	var factory = new Factory( config );

	config.pathname = config.pathname || "";
	if( config.pathname[ 0 ] !== "/" ) config.pathname = "/" + config.pathname;
	if( config.pathname[ config.pathname.length - 1 ] != "/" ) config.pathname = config.pathname + "/";
	config.appUrl = config.appUrl || "";
	while( config.appUrl[ config.appUrl.length - 1 ] == "/" )
		config.appUrl = config.appUrl.substring( 0, config.appUrl.length - 1 );

	app.use( function( req, res, next ) {

		req.contented = new mimeContent.Contented( req );
		next();

	} );

	app.use( express.bodyParser() );
	profile.attach( app, config );
	policy.attach( app, config );
	app.use( function( req, res, next ) {

		req.entitlementContext( req );
		next( req.policyInterrupt );

	} );

	app[ "get" ](		config.pathname,											renderApp					);
	app[ "get" ](		config.pathname.replace( /\/$/, "" ),						renderApp					);
	app[ "get" ](		config.pathname + "collections/:pageNumber",				renderCollectionList		);
	app[ "get" ](		config.pathname + ":collectionName",						renderCollection			);
	app[ "get" ](		config.pathname + ":collectionName/delete",					renderCollectionDelete		);
	app[ "get" ](		config.pathname + ":collectionName/:itemId/edit",			renderItemEdit				);
	app[ "get" ](		config.pathname + ":collectionName/:itemId",				renderItem					);

	app[ "post" ](		config.pathname,											addCollection				);
	app[ "post" ](		config.pathname.replace( /\/$/, "" ),						addCollection				);
	app[ "post" ](		config.pathname + ":collectionName",						addItem						);
	app[ "post" ](		config.pathname + ":collectionName/delete/requests",		deleteCollection			);
	app[ "post" ](		config.pathname + ":collectionName/upsertLocateRequests",	locateUpsert				);
	app[ "post" ](		config.pathname + ":collectionName/delete-item/requests",	deleteItem					);
	app[ "post" ](		config.pathname + ":collectionName/:itemId",				upsertItem					);

	app[ "put" ](		config.pathname + ":collectionName/:itemId",				upsertItem					);

	app[ "delete" ](	config.pathname + ":collectionName",						deleteCollection			);
	app[ "delete" ](	config.pathname + ":collectionName/:itemId",				deleteItem					);

	app.use( function( err, req, res, next ) {

		if( err.code && !!~[ 403, 404, 409 ].indexOf( err.code ) )
			return res.send( err.code, err.message );

		if ( err ) console.log( "ERROR: ", err );
			return next( err );

	} );

	if( onComplete ) whiskers.ensureLoaded( function() { onComplete( engine ); } );

	return engine;

	function Factory( config ) {

		var _ = this;
		this.buildModelCollection = function( collection ) {

			var ret = JSON.parse( JSON.stringify( collection ));
			ret.href = _.buildCollectionUrl( ret.name );
			return ret;

		};
		this.buildCollectionUrl = function( collectionName ) { return config.appUrl + "/" + collectionName; };
		this.buildItemUrl = function( collectionName, item ) { return _.buildCollectionUrl( collectionName ) + "/" + item.id; };
		this.buildUpsertLocateRequestsUrl = function( collectionName ) { return _.buildCollectionUrl( collectionName ) + "/upsertLocateRequests"; };
		this.buildDeleteItemRequestsUrl = function( collectionName ) { return _.buildCollectionUrl( collectionName ) + "/delete-item/requests"; };
		this.buildDeleteCollectionStateUrl = function( collectionName ) { return _.buildCollectionUrl( collectionName ) + "/delete"; };
		this.buildDeleteCollectionRequestsUrl = function( collectionName ) { return _.buildCollectionUrl( collectionName) + "/delete/requests"; };
		this.buildItemEditUrl = function( collectionName, item ) { return _.buildItemUrl( collectionName, item ) + "/edit"; };
		this.buildCollectionsPageUrl = function( pageNumber ) { return config.appUrl + "/collections/" + pageNumber; };

	}

	function engineListen( done ) {

		done = done || function() { };
		server = app.listen( config.port, done );
		return engine;

	}

	function engineClose() {

		server.close();
		return engine;

	}

	function sendResponse( req, res, next ) {

		if( "resourceName" in res && "model" in res ) {

			res.contentType( req.contented.mimeType( res.resourceName ) );
			var body = whiskers[ req.contented.prefix( res.resourceName ) ]( res.model );
			return res.send( res.statusCode || 200,  body );

		}

		if( res.sendEmpty )
			return res.send( res.statusCode );

		return next();

	}

	function renderApp( req, res, next ) {

		var entitlements = req.entitlementContext( req );
		var model = { permissions: { } };
		for( var k in config ) model[ k ] = config[ k ];
		// expose entitlement: addCollection
		model.permissions.addCollection = entitlements.check( policy.entitlements.addCollection );
		// expose entitlement: listCollections
		model.permissions.listCollections = entitlements.check( policy.entitlements.listCollections );
		res.model = model;
		res.resourceName = "app";
		// require entitlement: listCollections
		if( model.permissions.listCollections ) {

			model[ "first-page-collections-url" ] = factory.buildCollectionsPageUrl( 1 );

		}
		return sendResponse( req, res, next );

	}

	function renderCollectionList( req, res, next ) {

		var model = { permissions: { } };
		for( var k in config ) model[ k ] = config[ k ];
		res.model = model;
		res.resourceName = "collection-list";
		repo.getCollections( function( err, collections ) {

			if( err ) return next( err );
			model.collections = collections.map( factory.buildModelCollection );
			if( model.collections.length > 0 ) model.collections[ model.collections.length - 1 ].last = true;
			return sendResponse( req, res, next );

		} );

	}

	function renderCollection( req, res, next ) {

		var entitlements = req.entitlementContext( req, req.params.collectionName );
		// require entitlement: viewCollection
		if( !entitlements.check( policy.entitlements.viewCollection ) ) return res.send( 403 );
// TODO: do not query for items if there is no permission to view them
		repo.getCollection( req.params.collectionName, function( err, model ) {

			if( err ) return next( err );
			// expose entitlements: upsertItem, deleteCollection, listItems, addItem
			model.permissions = {

				upsertItem: entitlements.check( policy.entitlements.upsertItem ),
				deleteCollection: entitlements.check( policy.entitlements.deleteCollection ),
				listItems: entitlements.check( policy.entitlements.listItems ),
				addItem: entitlements.check( policy.entitlements.addItem )

			};
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.url = factory.buildCollectionUrl( model.name );
			model[ "upsert-item-url" ] = factory.buildUpsertLocateRequestsUrl( model.name );
			model[ "delete-collection-url"] = factory.buildDeleteCollectionStateUrl( model.name );
			// require entitlement: listItems
			if( !model.permissions.listItems )
			{

				model.items = [];

			} else {

				model.items.forEach( function( item ) {

					var itemEntitlements = req.entitlementContext( req, req.params.collectionName, item.id );
					item.url = factory.buildItemUrl( model.name, item );
					// expose entitlements: viewItem, upsertItem, deleteItem
					var verbs = determineVerbs(itemEntitlements, {

						"GET" : policy.entitlements.viewItem,
						"PUT" : policy.entitlements.upsertItem,
						"DELETE" : policy.entitlements.deleteItem

					});
					item.verbs = JSON.stringify( verbs );

				} );

			}
			res.model = model;
			res.resourceName = "collection";
			return sendResponse( req, res, next );

		} );

	}

	function renderCollectionDelete( req, res, next ) {

		var entitlements = req.entitlementContext( req, req.params.collectionName );
		// require entitlement: deleteCollection
		if( !entitlements.check( policy.entitlements.deleteCollection ) ) return res.send( 403 );
		repo.getCollection( req.params.collectionName, function( err, model ) {

			if( err ) return next( err );
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.url = factory.buildDeleteCollectionRequestsUrl( model.name );
			res.model = model;
			res.resourceName = "collection-delete";
			return sendResponse( req, res, next);

		} );

	}

	function renderItem( req, res, next ) {

		var entitlements = req.entitlementContext( req, req.params.collectionName, req.params.itemId );
		// require entitlement: viewItem
		if( !entitlements.check( policy.entitlements.viewItem ) ) return res.send( 403 );
		repo.getItem( req.params.collectionName, req.params.itemId, function( err, model ) {

			if( err ) return next( err );
			/*** main model ***/
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.collection = { name: req.params.collectionName };
			model.collection.url = factory.buildCollectionUrl( model.collection.name );
			model.url = factory.buildItemUrl( model.collection.name, model );
			model[ "edit-url" ] = factory.buildItemEditUrl( model.collection.name, model );
			model[ "delete-url" ] = factory.buildDeleteItemRequestsUrl( model.collection.name );

			/*** model.verbs ***/
			// expose entitlements: viewItem, upsertItem, deleteItem
			var verbs = determineVerbs( entitlements, {

				"GET" : policy.entitlements.viewItem ,
				"PUT" : policy.entitlements.upsertItem,
				"DELETE" : policy.entitlements.deleteItem

			} );
			model[ "verbs" ] = JSON.stringify( verbs );
			/*** model.collection-verbs ***/
			// expose entitlements: viewCollection, deleteCollection
			var collectionEntitlements = req.entitlementContext( req, req.params.collectionName );
			var collectionVerbs = determineVerbs( collectionEntitlements, {

				"GET" : policy.entitlements.viewCollection,
				"DELETE" : policy.entitlements.deleteCollection

			});
			model[ "collection-verbs" ] = JSON.stringify( collectionVerbs );
			/*** model.permissions ***/
			model.permissions = {

				upsertItem: !!~verbs.indexOf( "PUT" ),
				deleteItem: !!~verbs.indexOf( "DELETE" ),
				viewItem: !!~verbs.indexOf( "GET" )

			};
			res.model = model;
			res.resourceName = "item";
			return sendResponse( req, res, next );

		} );

	}

	function renderItemEdit( req, res, next ) {

		repo.getItemOrTemplate( req.params.collectionName, req.params.itemId, function( err, model, exists ) {

			if( err ) return next( err );
			model.app = { };
			for( var k in config ) model.app[ k ] = config[ k ];
			model.collection = { name: req.params.collectionName };
			model.collection.url = factory.buildCollectionUrl( model.collection.name );
			model.url = factory.buildItemUrl( model.collection.name, model );
			model[ "upsert-url" ] = factory.buildItemUrl( model.collection.name, model );
			model[ "form-description" ] = exists ? "Update item content" : "Create item";
			model[ "form-submit-action" ] = exists ? "Update" : "Create";
			res.model = model;
			res.resourceName = "item-editor";
			return sendResponse( req, res, next );

		} );

	}

	function addCollection( req, res, next ) {

		// add-collection entitlement required within the addCollectionByForm function
		var contentType = req.headers[ "content-type" ] || "";
		if( !!~contentType.indexOf( "x-www-form-urlencoded" ) )
			return addCollectionByForm( req, res, next );
		if( !!~contentType.indexOf( req.contented.mimeType( "collection" ) ) )
			return addJSONCollection( req, res, next );
		if( !!~contentType.indexOf( "json" ) )
			return addJSONCollection( req, res, next );
		return next( new Error( "Not implemented: Handle invalid content type" ) );

	}

	function addJSONCollection( req, res, next ) {

		addCollectionByForm( req, res, next );

	}

	function addCollectionByForm( req, res, next ) {

		var collectionName = req.body.collectionName;
		var entitlements = req.entitlementContext( req, collectionName );
		// require entitlement: add-collection
		if( !entitlements.check( policy.entitlements.addCollection ) ) return res.send( 403 );
		repo.addCollection( collectionName, function( err ) {

			if( err ) return next( err );
			res.setHeader( "location", factory.buildCollectionUrl( collectionName ) );
			res.statusCode = 201;
			res.sendEmpty = true;
			return sendResponse( req, res, next );

		} );

	}

	function addItem( req, res, next ) {

		var entitlements = req.entitlementContext( req, req.params.collectionName );
		// require entitlement: add-item
		if( !entitlements.check( policy.entitlements.addItem ) ) return res.send( 403 );
		switch( req.contented.protocolType ) {

			case "html": return addItemByForm( req, res, next );
			case "json": return addJSONItem( req.body, req, res, next );

		}
		return next( new Error( "Not implemented: Handle invalid content type " + req.contented.protocolType ) );

	}

	function addItemByForm( req, res, next ) {

		addJSONItem( { content: req.body.content || null }, req, res, next );

	}

	function locateUpsert( req, res ) {

		var entitlements = req.entitlementContext( req, req.params.collectionName, req.body.itemId );
		// require entitlement: delete-item
		if( !entitlements.check( policy.entitlements.deleteItem ) ) return res.send( 403 );
		res.redirect( factory.buildItemEditUrl( req.params.collectionName, { id: req.body.itemId } ) );

	}

	function upsertItem( req, res, next ) {

		var entitlements = req.entitlementContext( req, req.params.collectionName, req.params.itemId );
		// require entitlement: upsertItem
		if( !entitlements.check( policy.entitlements.upsertItem ) ) return res.send( 403 );
		repo.getItemOrTemplate( req.params.collectionName, req.params.itemId, function( err, model, exists ) {

			if( err ) return next( err );
			model.content = req.body.content;
			try {

				repo.upsertItem( req.params.collectionName, model, function( err ) {

					if( err ) return next( err );
					if( !req.contented.downgradeProtocol() ) {

						// this is a lower-level client capable of programmatically following links
						res.setHeader( "location", factory.buildItemUrl( req.params.collectionName, model ) );
						res.statusCode = exists ? 204 : 201;
						res.sendEmpty = true;
						return sendResponse( req, res, next );

					} else {

						// this is a higher-level "browser" client
						try {

							return res.redirect( factory.buildItemEditUrl( req.params.collectionName, model ) );

						} catch( e ) {

							return next( e );

						}

					}

				} );

			} catch( e ) {

				return next( e );

			}

		} );

	}

	function deleteCollection( req, res, next ) {

		var entitlements = req.entitlementContext( req, req.params.collectionName );
		// require entitlement: delete-collection
		if( !entitlements.check( policy.entitlements.deleteCollection ) ) return res.send( 403 );
		repo.deleteCollection( req.params.collectionName, function( err ) {

			if( err ) throw err;
			if( req.contented.downgradeProtocol() )
				return res.redirect( config.appUrl );

			res.statusCode = 204;
			res.sendEmpty = true;
			return sendResponse( req, res, next );

		} );

	}

	function deleteItem( req, res, next ) {

		var itemId = req.method == "DELETE" ? req.params.itemId : req.body.itemId;
		var entitlements = req.entitlementContext( req, req.params.collectionName, itemId );
		// require entitlement: delete-item
		if( !entitlements.check( policy.entitlements.deleteItem ) ) return res.send( 403 );
		repo.deleteItem( req.params.collectionName, itemId, function( err ) {

			if( err ) throw err;
			if( req.contented.downgradeProtocol() )
				return res.redirect( factory.buildCollectionUrl( req.params.collectionName ) );

			res.statusCode = 204;
			res.sendEmpty = true;
			return sendResponse( req, res, next );

		} );

	}


	function determineVerbs( entitlementContext, verbEntitlementDictionary ) {

		var ret = [];
		for(var verb in verbEntitlementDictionary) {

			if( entitlementContext.check( verbEntitlementDictionary[verb] ) ) ret.push( verb );

		}
		return ret;

	}

	function addJSONItem( item, req, res, next ) {

		var collectionName = req.params.collectionName;
		repo.upsertItem( collectionName, item, function( err, created ) {

			if( err ) return next( err );
			res.setHeader( "location", factory.buildItemUrl( collectionName, created ) );
			res.sendEmpty = true;
			res.statusCode = 201;
			return sendResponse( req, res, next );

		} );

	}

}