/* jslint node: true */
"use strict";

module.exports = {

	"Dispatcher" : Dispatcher

};

function Dispatcher( config ) {

	var repoConfig = config.repository;
	if( !repoConfig ) throw new Error( "The request-dispatcher requires a configuration object 'repository' " );
	// any errors here should just get thrown
	var repoModule = require( repoConfig.path );
	var	repo = new repoModule.Repo( repoConfig );
	// name
	var repoName = repoConfig.name;

	return {

		"dispatch" : dispatcherDispatch

	};

	function dispatcherDispatch( request, callback ) {

		// is this a query or a command?
		request.repoName = repoName;
		if( !request.collectionName )
			return callback( new Error( "Invalid internal request: no collection name specified" ), null );

		if( request.command )
			return processCommand( repo, request, callback );

		processQuery( repo, request, callback );

	}

}

function processQuery( repo, request, callback ) {

	// this is either get item or get collection (get item or template is considered a command)
	var collectionName = request.collectionName;
	if( request.hasOwnProperty("id") ) {

		repo.getItem( collectionName, request.id, function( err, item ) {

			request.response = {

				"err" : err,
				"item" : item

			};
			callback( err, request );

		} );

	} else {

		repo.getCollection( collectionName, function( err, collection ) {

			request.response = {

				"err" : err,
				"collection" : collection

			};
			callback( err, request );

		} );

	}

}

function processUnrecognisedCommand( repo, request, callback ) {

	callback( new Error( "Unrecognised command: " + JSON.stringify( {
		"collectionName" : request.collectionName,
		"id" : request.id,
		"command" : request.command
	} ) ) );

}

function processCommand( repo, request, callback ) {

	/* this is one of:
		add-collection
		delete-collection
		upsert-item
		delete-item
		get-item-or-template */

	var command = request.command;
	var hasId = request.hasOwnProperty( "id" );
	var strategy = processUnrecognisedCommand;
	if( hasId ) {

		// item commands
		if( command == "get-or-template")
			strategy = processGetItemOrTemplate;
		else if( command == "delete" )
			strategy = processDeleteItem;
		else if( command == "upsert" )
			strategy = processUpsertItem;

	} else {

		// collection commands
		if( command == "delete" )
			strategy = processDeleteCollection;
		else if( command == "add" )
			strategy = processAddCollection;

	}

	return strategy.call( this, repo, request, callback );

}

function processGetItemOrTemplate( repo, request, callback ) {

	return repo.getItemOrTemplate( request.collectionName, request.id, function( err, itemOrTemplate, isExistingItem ) {

		request.response = {

			"err" : err,
			"itemOrTemplate" : itemOrTemplate,
			"isExistingItem" : isExistingItem

		};
		return callback( err, request );

	} );

}

function processDeleteItem( repo, request, callback ) {

	return repo.deleteItem( request.collectionName, request.id, function( err ) {

		request.response = { "err" : err };
		return callback( err, request );

	} );

}

function processUpsertItem( repo, request, callback ) {

	var collectionName = request.collectionName;

	repo.getItemOrTemplate( collectionName, request.id, function( err, itemOrTemplate ) {

		if( err ) return callback( err, null, null );
		itemOrTemplate.content = request.content;
		repo.upsertItem( collectionName, itemOrTemplate, callback );

	} );
}

function processDeleteCollection( repo, request, callback ) {

	repo.deleteCollection( request.collectionName, callback );

}

function processAddCollection( repo, request, callback ) {

	repo.addCollection( request.collectionName, callback );

}