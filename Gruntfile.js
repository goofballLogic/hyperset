module.exports = function( grunt ) {

	grunt.initConfig( {

		pkg: grunt.file.readJSON( "package.json" ),


	} );

	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-mocha-test" );
	grunt.loadNpmTasks( "grunt-exec" );
	grunt.loadNpmTasks( "grunt-clear" );

};

