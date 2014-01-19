module.exports = function( grunt ) {

	grunt.initConfig( {

		pkg: grunt.file.readJSON( "package.json" ),

		cucumberjs: {

			src: "features",
			options: {
				steps: "features/step_definitions",
				format: "pretty"
			}

		},

		watch: {

			specs: {

				files: [ "src/**/*", "features/**/*" ],
				tasks: [ "specs" ]

			}

		}

	} );

	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-exec" );
	grunt.loadNpmTasks( "grunt-clear" );
	grunt.loadNpmTasks( "grunt-cucumber" );

	grunt.registerTask( "specs", [ "cucumberjs" ] );
	grunt.registerTask( "specs-auto", [ "watch:specs" ] );

};

