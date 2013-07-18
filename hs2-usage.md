#Hyperset(2) configuration and usage

##Usage
Configuration is passed to the constructor of the engine, along with the repository and an onReady callback. For details of creating a repo, see [here] [1].
[1]: hs2-api.md "here"

There are no magic filenames, the naming of the files below is entirely up to you, and indeed there is no requirement to keep your configuration in its own file.

#####config.js

	module.exports = {
		appUrl: "http://store.widgets.nearstate.com",
		pathname: "api",
		port: 8080
	};

#####app.js
	// create a repo
	var repo = . . .
	
	// config for the engine's web server
	var config = require( "./config" );
	
	// build the engine
	var engine = new hyperset.Engine( config, repo, onEngineReady );
	
	function onEngineReady( engine ) {
		
		// launch the web server
		engine.listen();

	}
	
