module.exports = function( grunt ) {

	grunt.initConfig( {

		pkg: grunt.file.readJSON( "package.json" ),

		watch: {

			"main": {

				files: [ "src/**/*.*", "spec/**/*.*", "template/**/*.*" ],
				tasks: [ "clear", "mochaTest" ]

			},

			"repo" : {

				files: [ "src/*-repo.js", "dev/repos/*.js" ],
				tasks: [ "clear", "exec:repoTest" ]
			}

		},

		mochaTest: {

			test: {

				options: {

					reporter: "spec",
					growl: true

				},

				src: [ "spec/**/*-spec.js" ]

			}

		},

		exec: {

			repoTest: {

				command: "node ./dev/repos/test.js ./src/json-repo.js"

			}

		}

	} );

	grunt.loadNpmTasks( "grunt-contrib-watch" );
	grunt.loadNpmTasks( "grunt-mocha-test" );
	grunt.loadNpmTasks( "grunt-exec" );
	grunt.loadNpmTasks( "grunt-clear" );

	grunt.registerTask( "test", [ "mochaTest" ] );
	grunt.registerTask( "auto-test", [ "watch:main" ] );
	grunt.registerTask( "repo-test", [ "exec:repoTest" ] );
	grunt.registerTask( "auto-repo-test", [ "watch:repo" ] );

};

