module.exports = {

	"Dispatcher" : Dispatcher

};

var defaultRenderers = {

	"json" : "../renderers/json-renderer",
	"html" : "../renderers/html-renderer"

};

var defaultRendererMappings = {

	".*+json$" : "json",
	".*/json$" : "json",
	".*+html$" : "html",
	".*/html$" : "html"

};

var renderableItems = [ "item", "collection", "itemOrTemplate", "error" ];

function Dispatcher( config ) {

	var renderers = compileAndInstantiateRenderers( config, defaultRendererMappings );
	var mappings = compileMappings( config, defaultRendererMappings );
	// YAGNI: allow configuring in additional items that could be rendered
	var renderTypes = renderableItems;

	return {

		"dispatch" : dispatch

	};

	function dispatch( err, internalRequest, res, next ) {

		var response = internalRequest.response;

		if( !( request.response instanceof Object ) )
			err = new Error( "No response" );

		// errors - response.err is preferred over err
		if( err ) repsonse.err = response.err || err;

		// what is the render type?
		var renderType = determineRenderType( response, renderTypes );

		// find the renderer for this request
		var requestType = internalRequest.type || "text/html";
		var renderer = determineRenderer( requestType );

		// get output
		var output = "Unknown error";
		var statusCode = 500;
		try {

			var results = renderer.render( response );
			output = results.output;
			statusCode = results.statusCode;

		} catch( e ) {

			// delegate renderer error handling to the web server
			return next( e );

		}

		// send
		res.send( statusCode, output );
		next();

	}

}

function determineRenderer( requestType, renderers ) {

	for( var i = 0; i < renderers.length; i++ ) {

		if( renderers[ i ].expr.test( requestType ) ) break;

	}
	return renderers[ i ];

}

function determineRenderType( response, renderableItems ) {

	var ret = "";
	renderableItems.forEach( function( key ) {

		if( response.hasOwnProperty( key ) ) ret = key;

	} );
	if( !ret ) {

		response.err = new Error( "Unrecognised entity" );

	}
	if( response.hasOwnProperty( "err" ) ) ret = "error";
	return ret;

}

/*

	"renderers" : {

		"CSV" : "../../custom-renderers/csv-renderer",
		"uber-json" : "../../custom-renderers/uber-json"

	}

*/
function compileRenderers( config, defaultRenderers ) {

	var rendererConfig = config.renderers;
	var ret = JSON.parse( JSON.stringify( defaultRenderers ) );
	if( rendererConfig instanceof Object ) {

		for( var name in rendererConfig )
			ret[ name ] = rendererConfig[ name ];

	}
	return ret;

}

/*

	"rendererMapping" : {

		".*+csv$" : "CSV",
		".*+json$" : "uber-json",

	}

*/
function compileAndInstantiateRenderers( config, defaultRendererMappings ) {

	var compiled = compileMappings( config, defaultRendererMappings );
	var instantiated = instantiateRenderers( config, compiled );
	return instantiated;

}

function instantiateRenderers( config, renderers ) {

	var ret = { };
	for( var name in renderers ) {

		var path = renderers[ name ];
		var module = require( path );
		var renderer = new module.Renderer( config );
		ret[ name ] = renderer;

	}
	return ret;

}

function compileMappings( config, defaultRendererMappings ) {

	var mappingConfig = config.rendererMapping;
	var ret = [ ];
	compileAndPushMappings( ret, mappingConfig );
	compileAndPushMappings( ret, defaultRendererMappings );
	return ret;

}

function compileAndPushMappings( mappings, mappingConfig ) {

	if( !( mappingConfig instanceof Object ) ) return mappings;

	for( var pattern in mappingConfig ) {

		mappings.push( {

			"expr" : new RegExp( mappingConfig[ pattern ] ),
			"renderer" : mappingConfig[ pattern ]

		} );

	}

}