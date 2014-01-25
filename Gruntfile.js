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
			specsCoordinator: {

				files: [ "src/**/*", "features/**/*" ],
				tasks: [ "cucumberjs:coordinator", "specs" ]

			},

		}

	} );

	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-exec" );
	grunt.loadNpmTasks( "grunt-clear" );
	grunt.loadNpmTasks( "grunt-cucumber" );

	grunt.registerTask( "specs", [ "cucumberjs:all" ] );

};

