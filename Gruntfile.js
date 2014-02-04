module.exports = function( grunt ) {

	grunt.initConfig( {

		pkg: grunt.file.readJSON( "package.json" ),

		cucumberjs: {

			all: {

				src: "features",
				options: {
					steps: "features/step_definitions"
				}

			},

			verbose: {

				src: "features",
				options: {

					steps: "features/step_definitions",
					format: "pretty"

				}

			},

			coordinator: {

				src: "features/coordinator.feature",
				options: {
					steps: "features/step_definitions",
					format: "pretty"
				}

			}

		},

		watch: {

			specs: {

				files: [ "src/**/*", "features/**/*" ],
				tasks: [ "specs" ]

			},
			verboseSpecs: {

				files: [ "src/**/*", "features/**/*" ],
				tasks: [ "cucumberjs:verbose" ]

			}

		}

	} );

	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-exec" );
	grunt.loadNpmTasks( "grunt-clear" );
	grunt.loadNpmTasks( "grunt-cucumber" );

	grunt.registerTask( "specs", [ "cucumberjs:all" ] );

};

