/* jslint node: true */
"use strict";

module.exports = {

	"Protocol" : Protocol

};

var parserDispatchModule = require( "./dispatch/parser-dispatcher" );
var url = require( "url" );

function Protocol( config, app ) {

	config.appUrl = config.appUrl.trim("/");
	var rootUrl = (url.parse( config.appUrl || "" ).path) || "";

	// register middleware

	var middleware = buildMiddleware( config );
	app.use( middleware );

	// calc urls
	var collectionUrlTemplate = buildCollectionUrl( rootUrl, ":collectionName" );
	var deleteCollectionRequestsUrlTemplate = buildDeleteRequestUrl( collectionUrlTemplate );
	var itemUrlTemplate = buildItemUrl( collectionUrlTemplate, ":itemId" );
	var upsertItemUrlTemplate = buildUpsertItemUrl( itemUrlTemplate );
	var deleteItemRequestsUrlTemplate = buildDeleteRequestUrl( itemUrlTemplate );

	// register routes
	var parserDispatcher = new parserDispatchModule.Dispatcher( config );
	var handler = parserDispatcher.dispatch;

	// View app,
	app.all( rootUrl, handler );
	// Add, View, Delete collection
	app.all( collectionUrlTemplate, handler );
	// Add delete collection request
	app.all( deleteCollectionRequestsUrlTemplate, handler );
	// View, Add, Update, Delete item
	app.all( itemUrlTemplate, handler );
	// Add upsert item request
	app.all( upsertItemUrlTemplate, handler );
	// Add delete item request
	app.all( deleteItemRequestsUrlTemplate, handler );

}

function buildMiddleware( config ) {

	var root = config.appUrl;

	var hyperset = {

		name: config.name,
		appUrl : root,
		addCollectionUrl : root,
		collectionUrlTemplate: buildCollectionUrl( root, "{{collectionName}}" ),
		getCollectionUrl : function( collectionName ) {

			return buildCollectionUrl( root, collectionName );

		},
		getDeleteCollectionRequestUrl: function( collectionName ) {

			return buildDeleteRequestUrl( buildCollectionUrl( root, collectionName ) );

		},
		getItemUrlTemplate: function( collectionName ) {

			return buildItemUrl( buildCollectionUrl( root, collectionName ), "{{itemId}}" );

		},
		getItemUrl: function( collectionName, itemId ) {

			return buildItemUrl( buildCollectionUrl( root, collectionName ), itemId );

		},
		getUpsertItemUrl: function( collectionName, itemId ) {

			return buildUpsertItemUrl( buildCollectionUrl( root, collectionName ), itemId );

		}

	};

	return function( req, res, next ) {

		req.hyperset = hyperset;
		next();

	};

}

function buildCollectionUrl( rootUrl, collectionName ) {

	return rootUrl + "/c/" + collectionName;

}

function buildDeleteRequestUrl( resourceUrl ) {

	return resourceUrl + "/deleterequests";

}

function buildItemUrl( collectionUrl, itemId ) {

	return collectionUrl + "/i/" + itemId;

}

function buildUpsertItemUrl( collectionUrl, itemId ) {

	return collectionUrl + "/upserts/" + itemId;

}