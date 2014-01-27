var fs = require( "fs" );
var mustache = require( "mustache" );
var CDL = require( "../utils/CDL" );

module.exports = function( path, onComplete ) {

	fs.readdir( path, function( err, files ) {

		if( err ) throw err;
		var ret = { };
		var latch = new CDL( files.length, function() { onComplete(ret); } );

		files.forEach( function( x ) {

			fs.readFile( path + "/" + x, "utf8", function( err, data ) {

				var templateName = x.substr( 0, x.lastIndexOf( "." ) );
				ret[ templateName ] = mustache.compile( data );
				latch.count();

			} );

		} );

	} );

}