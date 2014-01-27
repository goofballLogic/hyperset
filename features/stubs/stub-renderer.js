module.exports = {

	"Renderer" : Renderer,
	"getLastCall" : getLastCall,
	"setNextResponse" : setNextResponse

};


function setNextResponse( resp ) {

	global.stubRendererNextResponse = resp;

}

function getLastCall() {

	return global.stubRendererLastCall;

}

function setLastCall() {

	global.stubRendererLastCall = Array.prototype.slice.call( arguments, 0 );

}

function Renderer( ) {
	delete global.stubRendererLastCall;
	global.stubRendererNextResponse = "";

	return {

		"render" : render,
		"isReady" : function() { return true; }

	};

	function render() {

		setLastCall.apply( this, arguments );
		return global.stubRendererNextResponse;

	}

}