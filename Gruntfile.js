module.exports = function( grunt ) {

	grunt.initConfig( {

		pkg: grunt.file.readJSON( "package.json" ),

		watch: {

			files: [ "src/**/*.*", "spec/**/*.*", "template/**/*.*" ],
			tasks: [ "mochaTest" ]

		},

		mochaTest: {

			test: {

				options: {

					reporter: "spec",
					growl: true

				},

				src: [ "spec/**/*-spec.js" ]

			}

		}

	} );

	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-mocha-test" );

	grunt.registerTask( "test", [ "mochaTest" ] );
	grunt.registerTask( "auto-test", [ "watch" ] );
};

