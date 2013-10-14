/*jslint node: true */
"use strict";

module.exports = {

	"Contented" : Contented

};

var mimeTypes = {

	"html" : {

		"*" : "text/html; charset=utf-8"

	},

	"json" : {

		"app" :			"application/vnd.hyperset.application+json",
		"collection" :	"application/vnd.hyperset.collection+json",
		"item" :		"application/vnd.hyperset.item+json",
		"*" :			"application/json"

	}

};


function Contented( req ) {

	var contentType = normalizeContentType( req );
	var acceptType = normalizeAcceptType( req ) || contentType || "html";
	var returnTypes = mimeTypes[ acceptType ];

	return {

		prefix: contentedPrefix,
		mimeType: contentedMimeType,
		downgradeProtocol: contentedDowngradeProtocol

	};

	function normalizeMimeType( header ) {

		if( !!~header.indexOf( "html" ) ) return "html";
		if( !!~header.indexOf( "json" ) ) return "json";

	}

	function normalizeContentType( req ) {

		if( !( req.headers && req.headers[ "content-type" ] ) ) return null;
		return normalizeMimeType( req.headers[ "content-type" ] );

	}

	function normalizeAcceptType( req ) {

		var ret = null;
		if( req.headers && req.headers[ "accept"] ) {

			var accepts = req.headers[ "accept" ].split(",");
// TODO: order accepts by precedence rules
			while( !ret && accepts.length ) ret = normalizeMimeType( accepts.shift() );

		}
		return ret;

	}

	function contentedPrefix( resourceName ) {

		return acceptType + "-" + resourceName;

	}

	function contentedMimeType( resourceName ) {

		if( resourceName in returnTypes ) return returnTypes[ resourceName ];
		return returnTypes[ "*" ];

	}

	function contentedDowngradeProtocol() {

		return acceptType == "html";

	}

}