module.exports = {

	"Renderer" : Renderer

};

function Renderer() {

	return {

		"render" : render,
		"isReady" : isReady

	};

	function isReady() {

		return true;

	}

	function render( response ) {

		return { statusCode: 500, output: JSON.stringify( { "not" : "implemented" } ) };

	}

}