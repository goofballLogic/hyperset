var mustache = require( "mustache" );
var fs = require( "fs" );

var completions = [];

var whiskers = {

	ensureLoaded : function( callback ) {

		if( completions ) completions.push( callback );
		else callback();

	}

};

fs.readdir( __dirname + "/../template", function( err, files ) {

	var countdown = files.length;

	files.forEach( function( file ) {

		fs.readFile( __dirname + "/../template/" + file, "utf8", function( err, data ) {

			var name = file.substring( 0, file.indexOf( "." ) );
			if(!err) whiskers[ name ] = mustache.compile( data );
			countdown--;
			if(!countdown) {

				var recompletions = completions;
				completions = null;
				recompletions.forEach( whiskers.ensureLoaded );

			}

		} );

	} );

} );

module.exports = whiskers;