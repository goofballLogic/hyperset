module.exports = function( grunt ) {

	grunt.initConfig( {

		pkg: grunt.file.readJSON( "package.json" ),

		watch: {

			"basic": {

				files: [ "src/**/*.*", "spec/**/*-basic-spec.js", "template/**/*.*" ],
				tasks: [ "clear", "mochaTest:testHttp", "mochaTest:testJSON" ]

			},

			"main": {

				files: [ "src/**/*.*", "spec/**/*.*", "template/**/*.*" ],
				tasks: [ "clear", "mochaTest" ]

			},

			"repo" : {

				files: [ "src/*-repo.js", "dev/repos/*.js" ],
				tasks: [ "clear", "exec:repoTest" ]
			},

			"policy": {

				files: [ "src/**/*.*", "spec/**/*.*", "template/**/*.*" ],
				tasks: [ "clear", "mochaTest:testPolicy" ]

			}

		},

		mochaTest: {

			testHttp: {

				options: {

					reporter: "spec",
					growl: true

				},

				src: [ "spec/**/http-*-spec.js" ]

			},

			testJSON: {

				options: {

					reporter: "spec",
					growl: true

				},

				src: [ "spec/**/json-*-spec.js"]

			},

			testPolicy: {

				options: {

					reporter: "spec",
					growl: true

				},

				src: [ "spec/**/policy-*-spec.js"]

			},

			testProfile: {

				options: {

					reporter: "spec",
					growl: true

				},

				src: [ "spec/**/profile-spec.js" ]

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
	grunt.registerTask( "repo-test", [ "exec:repoTest" ] );
	grunt.registerTask( "basic-test", [ "mochaTest:testHttp", "mochaTest:testJSON" ] );
	grunt.registerTask( "auto-test", [ "watch:main" ] );
	grunt.registerTask( "auto-repo-test", [ "watch:repo" ] );
	grunt.registerTask( "auto-policy-test", [ "watch:policy" ] );
	grunt.registerTask( "auto-basic-test", [ "watch:basic" ] );

};

