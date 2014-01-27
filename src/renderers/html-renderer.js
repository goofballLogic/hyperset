module.exports = {

	"Renderer" : Renderer

};

function Renderer() {

	return {

		"render" : render

	};

	function render( response ) {

		return { statusCode: 500, output: "<html><body>Not implemented</body></html>" };

	}

}