module.exports = {

	"Dispatcher" : Dispatcher

};

var defaultRenderers = {

	"json" : "../renderers/json-renderer",
	"html" : "../renderers/html-renderer"

};

var defaultRendererMappings = {

	"^.*json$" : "json",
	"^.*html$" : "html"

};

var renderableItems = [ "application", "item", "collection", "itemOrTemplate", "error" ];

function Dispatcher( config ) {

	var renderers = compileAndInstantiateRenderers( config, defaultRenderers );
	var mappings = compileMappings( config, defaultRendererMappings );
	// YAGNI: allow configuring in additional items that could be rendered
	var renderTypes = renderableItems;

	return {

		"dispatch" : dispatch

	};

	function dispatch( err, internalRequest, res, next ) {

		var response = internalRequest.response;

		if( !( response instanceof Object ) )
			err = new Error( "No response" );

		// errors - response.err is preferred over err
		if( err ) repsonse.err = response.err || err;

		// what is the render type?
		response[ "item-type" ] = determineRenderType( response, renderTypes );

		// find the renderer for this request
		var requestType = internalRequest.type || "text/html";
		var renderer = determineRenderer( requestType, mappings, renderers );

		onRendererReady( renderer, response, res, next );

	}

	var saftey = 100;

	function onRendererReady( renderer, response, res, next ) {

		if( !renderer.isReady() ) {

			var iterate = function() { onRendererReady( renderer, response, res, next ); };
			if( --saftey < 0 ) throw new Error( "Renderer failed to initialise" );
			return setTimeout( iterate, 100 );

		}

		// get output
		var output = "Unknown error";
		var statusCode = 500;
		try {

			var results = renderer.render( response );
			output = results.output;
			statusCode = results.code;

		} catch( e ) {

			// delegate renderer error handling to the web server
			return next( e );

		}

		// send
		res.send( statusCode, output );
		next();

	}

}

function determineRenderer( requestType, mappings, renderers ) {

	for( var i = 0; i < mappings.length; i++ ) {

		if( mappings[ i ].expr.test( requestType ) ) break;

	}
	var rendererName = mappings[ i ].renderer;
	return renderers[ rendererName ];

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
function compileAndInstantiateRenderers( config, defaultRenderers ) {

	var compiled = compileRenderers( config, defaultRenderers );
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
function compileMappings( config, defaultRendererMappings ) {

	var ret = [ ];
	compileAndPushMappings( ret, config.rendererMapping );
	compileAndPushMappings( ret, defaultRendererMappings );
	return ret;

}

function compileAndPushMappings( mappings, mappingConfig ) {

	if( !( mappingConfig instanceof Object ) ) return mappings;

	for( var pattern in mappingConfig ) {

		mappings.push( {

			"expr" : new RegExp( pattern ),
			"renderer" : mappingConfig[ pattern ]

		} );

	}

}