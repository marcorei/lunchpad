module.exports = function (grunt) {

	'use strict';



	var libraries = [
		'bower_components/modernizr/modernizr.js',
		'bower_components/angular/angular.min.js',
		'bower_components/angular-route/angular-route.min.js',
		'bower_components/angular-animate/angular-animate.min.js',
		'bower_components/angular-sanitize/angular-sanitize.min.js',
		'bower_components/moment/min/moment.min.js',
		'bower_components/moment/locale/de.js',
		'bower_components/angular-moment/angular-moment.min.js',
		'bower_components/angular-css-injector/angular-css-injector.js',

		// Temporary onboarding
		'bower_components/shepherd.js/shepherd.min.js'
	];



	grunt.initConfig({

		concat: {

			libraries: {
				src: libraries,
				dest: '../static/js/libraries.js'
			},

			dev: {
				src: [
					'js/**/*.js',
					'!js/front.js'
				],
				dest: '../static/js/app.js'
			},

			build: {
				src: [
					'js/**/*.js',
					'!js/front.js'
				],
				dest: '../static/js/app.js'
			}
		},



		uglify: {

			my_target: {
				files: {

					// [destination]: [source(, source, source)],
					'../static/js/app.js': ['../static/js/app.js'],
					'../static/js/libraries.js': ['../static/js/libraries.js']
				}
			},

			options: {
				compress: true,
				preserveComments: 'some'
			}
		},



		compass: {

			dev: {
				options: {
					sassDir: 'sass',
					cssDir: '../static/css',
					fontsDir: '../static/font',
					imagesDir: '../static/img',
					httpPath: '../templates',
					relativeAssets: true
				}
			},

			build: {
				options: {
					sassDir: 'sass',
					cssDir: '../static/css',
					fontsDir: '../static/font',
					imagesDir: '../static/img',
					environment: 'production',
					outputStyle: 'compressed',
					relativeAssets: true
				}
			}
		},



		watch: {

			options: {
				spawn: false,
				livereload: true
			},

			scripts: {
				files: ['js/**/*.js', libraries ],
				tasks: ['dev']
			},

			templates: {
				files: ['../templates/**/*.html']
			},

			css : {
				files: 'sass/*.scss',
				tasks: ['compass:dev']
			}
		}
	});



	// Load Grunt Tasks

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-contrib-uglify');



	// Register Tasks

	grunt.registerTask('default', [
		'dev'
	]);

	grunt.registerTask('dev', [
		'concat:libraries',
		'concat:dev',
		'compass:dev',
		'watch'
	]);

	grunt.registerTask('build', [
		'concat:libraries',
		'concat:build',
		'compass:build',
		'uglify'
	]);

};
