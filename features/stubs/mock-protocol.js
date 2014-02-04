module.exports = {

	"Protocol" : Protocol,
	"GetApp" : getApp

};

function getApp() {

	return global.mockProtocolApp;

}

function setApp( app ) {

	global.mockProtocolApp = app;

}

function Protocol() {

	return {

		"attach" : function( app ) {

			setApp( app );

		}

	};

}