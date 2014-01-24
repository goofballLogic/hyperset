/* jslint node: true */
"use strict";

module.exports = {

	"ensureDir" : ensureDir,
	"ensureCleanDir" : ensureCleanDir,
	"ensureCleanDirs" : ensureCleanDirs,
	"ensureNoDir" : ensureNoDir,
	"specifyTimeout" : specifyTimeout,
	"buildHandleResponse" : buildHandleResponse,
	"setStackSize" : setStackSize

};


var path = require( "path" );
var fs = require( "fs" );
var rr = require( "rimraf" );

function setStackSize( limit ) {

	Error.stackTraceLimit = limit;

}

function buildHandleResponse( scenario ) {

	scenario.Before( function( callback ) {

		this.handleResponse = handleResponse.bind( this );
		callback();

	} );

}

function handleResponse( callback ) {

	return function( err, results ) {

		this.err = err;
		this.results = results;
		this.lastArguments = Array.prototype.slice.call( arguments );
		callback();

	}.bind( this );

}

function specifyTimeout( scenario, timeout ) {

	scenario.Before( function( callback ) {

		scenario.timeout = setTimeout( function() { throw new Error("Timed out"); }, 500 );
		callback();

	} );

	scenario.After( function( callback ) {

		clearTimeout( scenario.timeout );
		callback();

	} );

}

function ensureNoDir( dir, callback ) {

	rr( dir, callback );

}

function ensureCleanDirs( dir1, dir2, dirN, callback ) {

	var args = Array.prototype.slice.call( arguments );
	if( args.length < 2 ) return args[0](); // we're done

	var toEnsure = args.shift();
	ensureCleanDir( toEnsure, function( err ) {

		if( err ) {

			var callback = args.pop();
			return callback( err );

		}

		ensureCleanDirs.apply(this, args );

	} );

}

function ensureCleanDir( dirPath, callback ) {

	ensureDir( dirPath, function( err ) {

		if( err ) return callback( err );
		rr( dirPath, function( err ) {

			if( err ) callback( err );
			fs.mkdir( dirPath, function( err ) {

				callback( err );

			} );

		} );


	} );

}

function ensureDir( dirPath, callback ) {

	var p = path.resolve( dirPath );
	var bits = p.split( path.sep );
	ensureDirWalk( path.sep, bits, callback );

}

function ensureDirWalk( existingDir, bits, onComplete ) {

	if(!bits.length) return onComplete();
	var checkee = path.join( existingDir, bits.shift() );
	var next = function() { ensureDirWalk( checkee, bits, onComplete ); };

	fs.stat( checkee, function( err, stats ) {

		if( err ) {

			// try to create the folder
			fs.mkdir( checkee, function( err ) {

				if( err ) return onComplete( err );
				// else
				next();

			} );

		} else {

			if( stats.isDirectory() ) return next();
			// else
			onComplete( checkee + " is not a directory" );

		}

	} );

}