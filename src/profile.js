var url = require( "url" );
var http = require( "http" );

( function( context ) {

	context.attach = profileAttach;

	return;

	function profileAttach( app, config ) {

		if( !config.profileServiceUrl ) return;
		var options = url.parse( config.profileServiceUrl );
		app.use( function( req, res, next ) {

			if( req.userProfile ) return next();
			var profileReq = http.request( options, function( profileRes ) {

				var body = "";
				profileRes.on( "data", function( data) {

					body = body + data;

				} );
				profileRes.on( "end", function() {

					req.userProfile = JSON.parse( body );
					next();

				} );

			} );
			profileReq.on( "error", function( e ) {

				console.log( new Error( "Error caught calling profile service (see below)").stack );
				console.log( "Caught:", e.stack, "\n" );
				res.send( 500 );

			} );
			profileReq.end();

		} );

	}

} ( module.exports ) );