module.exports = {

	"Renderer" : Renderer

};

var whiskers = require( "./whiskers" );
var templates = null;

whiskers( __dirname + "/../templates/html", function( loadedTemplates ) {

	templates = loadedTemplates;

} );

function Renderer() {

	return {

		"render" : render,
		"isReady" : isReady

	};

	function isReady() {

		return !!templates;

	}

	function render( response ) {

		/*

			Exmaple response format:
			{
				"item-type" : "itemOrTemplate",
				"err" : undefined,
				"itemOrTemplate" : {
					"id" : "ABC-1234",
					"content" : {
						"title" : "Narmi hex-head screw",
						"price" : "2.99"
					}
				},
				"isExistingItem" : true,
			}

		*/
		// error handling
		if( response.err ) {

			if( response.err.code == 404 ) return output( 404, "404", null );
			if( response.err.code == 409 ) return output( 409, "409", null );
			return output( 500, "500", null );

		}
		return { statusCode: 500, output: "<html><body>Not implemented</body></html>" };

	}

}

function output( code, templateName, object) {

	var output = templates[ templateName ]( object || { } );
	return { "code" : code, "output" : output };

}