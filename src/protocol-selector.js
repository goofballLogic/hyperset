/* jslint node: true */
"use strict";

module.exports = {

	"ProtocolSelector" : ProtocolSelector

};

var defaultProtocols = [ "./protocols/json", "./protocols/html" ];

var defaultProtocolMappings = [

	[ "json", "^.*json$" ],
	[ "html", "^.*html$" ]

];

function ProtocolSelector( config ) {

	var middleware = buildMiddleware(

		compileMapping( config, defaultProtocolMappings )

	);

	return {

		"attach" : attach

	};


	function attach( app ) {

		// register middleware
		app.use( middleware );
		attachProtocols( config, defaultProtocols, app );

	}

}

function compileMapping( config, defaults ) {

	var mapping = [];
	var parseMap = function( mappingConfig ) {

		var map = [ mappingConfig[ 0 ] ];
		for(var i = 1; i < mappingConfig.length; i++ ) {

			map.push( new RegExp( mappingConfig[ i ] ) );

		}
		mapping.push( map );

	};
	// configured mappings
	( config.protocolMapping || [] ).forEach( parseMap );
	// default mappings
	defaults.forEach( parseMap );
	return mapping;

}

function buildMiddleware( mapping ) {

	return function( req, res ) {

		var headers = req.headers || { };
		var accepted = ( req.headers[ accepted ] || "" ).split( "," );
		var possibleDataTypes = [ headers[ "content-type" ] ].concat( accepted ).filter( function( x ) { return !!x; } );
		var found = null;

		while( possibleDataTypes.length > 0 && !found) {

			var candidate = possibleDataTypes.shift();
			found = resolve( mapping, candidate );

		}
		req[ "HSRequest" ] = req[ "HSRequest" ] || { };
		req[ "HSRequest" ].type = found || "html";

	};

}

function resolve( mapping, candidate ) {

	var seeker = function( found, mapping ) {

		if( found ) return found;
		for( var i = 1; i < mapping.length; i++ ) {

			if( mapping[ i ].test( candidate ) )
				return mapping[ 0 ];

		}
		return null;

	};
	return mapping.reduce( seeker, null );

}


function attachProtocols( config, defaultProtocols, app ) {

	var createAndAttach = function( modulePath ) {

		var protocolModule = require( modulePath );
		new protocolModule.Protocol( config ).attach( app );

	};

	// configured protocols
	var modulePaths = config.protocols || [ ];
	modulePaths.forEach( createAndAttach );
	// default protocols
	defaultProtocols.forEach( createAndAttach );

}