#Hyperset(2) configuration and usage

##Usage
Configuration is passed to the constructor of the engine, along with the repository and an onReady callback. For details of creating a repo, see [here] [1].
[1]: hs2-api.md "here"

There are no magic filenames, the naming of the files below is entirely up to you, and indeed there is no requirement to keep your configuration in its own file.

#####config.js

	module.exports = {
		appUrl: "http://store.widgets.nearstate.com/api",
		pathname: "api",
		port: 8080,
		name: "
	};


where:

```appUrl``` is the absolute URL, as requested by the client

```pathName``` is the
#####app.js
	// create a repo
	var repo = . . .
	
	// config for the engine's web server
	var config = require( "./config" );
	
	// build the engine
	var engine = new hyperset.Engine( config, repo, onEngineReady );
	
	function onEngineReady( engine ) {
		
		// any custom middleware
		engine.app.use( function( req, res, next ) {
			
			// e.g. print request info
			console.log( req.method, req.url );
			next();
			
		} );
		
		// launch the web server
		engine.listen();

	}
	
